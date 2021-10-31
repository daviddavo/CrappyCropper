import "jquery-cropper"
import "cropperjs/dist/cropper.css";

import "../style/main.scss"

const $image = $("#image")
const options = {
    aspectRatio: 16 / 9,
    viewMode: 2,
    crop(e) {
    }
}
let _dirinfo

$image.on().cropper(options)

function getBaseDir() {
    return window.location.pathname.substr(0,window.location.pathname.lastIndexOf('/'))
}

function getImageDir() {
    return window.location.pathname
}

function getImageName() {
    return window.location.pathname.substr(window.location.pathname.lastIndexOf('/')+1)
}

// TODO: Show it in a kind of pop-up modal or something
function getDirInfo() {
    if (_dirinfo) {
        console.log(_dirinfo["images"])
        return _dirinfo
    } else {
        const path = getBaseDir() 
        let xhr = new XMLHttpRequest()
        // TODO: Make async
        xhr.open("GET", "/ls/" + path, false)
        xhr.send()

        console.log(xhr.response)
        _dirinfo = JSON.parse(xhr.response)

        if (!_dirinfo["currentImg"]) {
            let i = 0
            let currentImg = $image.attr('src')

            for (let image in _dirinfo["images"]) {
                if (image == currentImg) break
                i++
            }

            _dirinfo["currentImg"] = i
        }

        return _dirinfo
    }
}

function setImage(imagepath) {
    const url = getBaseDir()+"/"+imagepath
    console.log("Setting image to " + imagepath)
    $image.cropper('replace', "/img/"+url)
    window.history.replaceState(null, "", url)
}

function nextImage() {
    let dirinfo = getDirInfo()
    dirinfo.currentImg = (dirinfo.currentImg + 1) % dirinfo.images.length
    setImage(dirinfo.images[dirinfo.currentImg])
}

function prevImage() {
    let dirinfo = getDirInfo()
    dirinfo.currentImg = (dirinfo.currentImg + dirinfo.images.length -1)%dirinfo.images.length
    setImage(dirinfo.images[dirinfo.currentImg])
}

function cropImage() {
    // TODO: Make request to backed to archive this image
    let data = $image.cropper('getData')
    console.log($image)
    console.log($image.attr('src'))
    let img_path = "/crop" + getImageDir()
    let arr = getImageName().split('.')
    data.filename = arr[0] + "_" + getAspectSuffix(data.width / data.height) + '.' + arr.slice(1).join('.')

    console.log("Cropping", img_path)
    // TODO: DISPLAY OK NOTIFICATION
    let xhr = new XMLHttpRequest()
    xhr.open("POST", img_path, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    console.log("Sending data", data)
    xhr.send(JSON.stringify(data))
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if(xhr.status == 200) {
                showNotification("Image " + getImageDir() + " cropped", "alert-success")
            } else {
                showNotification("Error on request " + img_path + ", please see logs for more details", "alert-danger")
                console.log(xhr)
            }
        }
    }
}

function archiveImage() {
}

function expandCrop() {
    let imgData = $image.cropper('getImageData')
    let cropData = $image.cropper('getData')
    let cropRatio = cropData.width / cropData.height

    console.log("Image:", imgData)
    console.log("CropBox:", cropData)
    let w
    let h

    if (imgData.aspectRatio < cropRatio) {
        w = imgData.naturalWidth
        h = w / cropRatio
    } else {
        h = imgData.naturalHeight
        w = h * cropRatio
    }

    let data = {
        x: (imgData.naturalWidth - w) / 2,
        y: (imgData.naturalHeight - h) / 2,
        width: w,
        height: h
    }

    console.log(data)
    $image.cropper('setData', data)
    console.log($image.cropper('getData'))
}

function setAspectRatio(ratio) {
    $image.cropper('setAspectRatio', ratio)
    expandCrop()
}

function getAspectSuffix(ratio) {
    const available = ["16x9","5x4","9x16","4x3"]

    for (let a of available) {
        let arr = a.split("x")
        if (Math.abs(arr[0]/arr[1] - ratio) < 0.05) {
            return a
        }
    }

    return ""
}

const keyMaps = {
    "a": {
        f: prevImage,
        desc: "Go to prev image"
    },
    "Ctrl+c": {
        ctrl: true,
        f: cropImage,
        desc: "Save cropped image"
    },
    "d": {
        f: nextImage,
        desc: "Go to next image"
    },
    "e": {
        f: expandCrop,
        desc: "Expand cropping to fullest"
    },
    "h": {
        f: _ => $('#help').toggle('slow'),
        desc: "Show this help",
    },
    "i": {
        desc: "Get dir info",
        f: getDirInfo
    },
    "q": {
        desc: "Archive this image"
    },
    "0": {
        desc: "Free aspect ratio",
        f: _ => setAspectRatio(NaN)
    },
    "1": {
        desc: "16x9 aspect ratio",
        f: _ => setAspectRatio(16/9)
    },
    "2": {
        desc: "5x4 aspect ratio",
        f: _ => setAspectRatio(5/4)
    },
    "3": {
        desc: "9x16 aspect ratio",
        f: _ => setAspectRatio(9/16)
    },
    "4": {
        desc: "4x3 aspect ratio",
        f: _ => setAspectRatio(4/3)
    }
}

// On document ready
$(function() {
    console.log("On help load")
    let text = ""
    
    for (let key in keyMaps) {
       // if (keyMaps[key].ctrl) { text += "Ctrl + " }
       text += key + ": " + keyMaps[key].desc + "\n"
    }

    $('#help').text(text)
})

function showNotification(text, classes="alert-dark") {
    let div = $('<div>', {
        class: "fade alert " + classes,
        html: text
    }).appendTo("#notifications")
    setTimeout(function() {div.addClass("show")}, 100)
    setTimeout(function() {div.removeClass("show")}, 3100)
    setTimeout(function() {div.remove()}, 3500)
}

$(document.body).on('keydown', function(e) {
    let key = e.key
    if (e.ctrlKey) {
        key = "Ctrl+" + key
    }

    if (keyMaps[key]) {
        e.preventDefault()
        showNotification("Calling " + keyMaps[key].desc, "alert-info")
        keyMaps[key].f()
    } else {
        console.log("Unrecognized key " + key)
    }
})