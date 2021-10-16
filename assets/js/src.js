import "jquery-cropper"
import "cropperjs/dist/cropper.css";

import "bootstrap"

import "../style/main.scss"

const $image = $("#image")
const options = {
    aspectRatio: 16 / 9,
    viewMode: 2,
    crop(e) {
        console.log(e.detail.x)
        console.log(e.detail.y)
        console.log(e.detail.width)
        console.log(e.detail.height)
        console.log(e.detail.rotate)
        console.log(e.detail.scaleX)
        console.log(e.detail.scaleY)
    }
}

$image.on().cropper(options)

function nextImage() {
    // TODO: Change to next image
    console.log("Changing to next image")
}

$(document.body).on('keydown', function(e) {
    switch(e.key) {
        case "ArrowRight":
            nextImage()
            break
        case "ArrowLeft":
            prevImage()
            break
        default:
            console.log(e.key)
    }
})