from pathlib import Path, PurePath

from flask import Flask, request, render_template, abort, send_file, jsonify, redirect
from flask.helpers import url_for

from PIL import Image

def create_app(config=None):
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_pyfile("config.py")
    if config:
        app.config.from_pyfile(config)

    def _check_image_path(img_path: Path) -> Path:
        abs_path: Path = Path(app.config["BASE_DIR"]) / img_path

        if not abs_path.exists():
            return abort(404)

        if abs_path.is_file() and abs_path.suffix in app.config["ALLOWED_EXTENSIONS"]:
            return abs_path
        else:
            abort(403)

    def _images_dict(path: Path):
        response = {"images": [], "dirs": []}
        print("Checking ", path.absolute())
        for f in path.iterdir():
            if f.is_dir():
                response["dirs"].append(f.name)
            elif f.is_file() and f.suffix in app.config["ALLOWED_EXTENSIONS"]:
                response["images"].append(f.name)

        for p in response.values():
            p.sort()

        return response

    @app.route('/', defaults={"image_path": ""})
    @app.route('/<path:image_path>')
    def main_img(image_path):
        abs_path: Path = Path(app.config["BASE_DIR"]) / image_path

        if not abs_path.exists():
            abort(404)

        print(abs_path, abs_path.is_dir())
        if abs_path.is_dir():
            image_path = (abs_path / _images_dict(abs_path)["images"][0]).relative_to(Path(app.config["BASE_DIR"]))
            print("Is dir, redirecting to:", image_path)
            return redirect(url_for("main_img", image_path=image_path), 302)

        chk_img = _check_image_path(image_path).relative_to(Path(app.config["BASE_DIR"]))
        return render_template('index.html', image=chk_img)

    @app.route('/ls/', defaults={"path": ""})
    @app.route('/ls/<path:path>')
    def get_ls(path):
        path: Path = Path(app.config["BASE_DIR"]) / path

        if not path.exists():
            return abort(404)

        if path.is_dir():
            return jsonify(_images_dict(path))
        else:
            abort(403)

    @app.route('/img/<path:image_path>')
    def get_image(image_path):
        return send_file(_check_image_path(image_path))

    @app.route('/crop/<path:image_path>', methods=["POST"])
    def crop_image(image_path):
        chk_img = _check_image_path(image_path)
        res = request.get_json()
        left = res["x"]
        top = res["y"]
        right = left + res["width"]
        bottom = top + res["height"]

        if "filename" in res:
            image_path = res["filename"]
        else:
            image_path = PurePath(image_path).name

        img = Image.open(chk_img)
        cropped = img.crop((left, top, right, bottom))
        # TODO: Specify this path in config
        cropped.save(Path("/home/davo/Pictures/Wallpapers") / PurePath(image_path))

        return "OK"

    return app

if __name__ == "__main__":
    app = create_app()
    app.run()
