from pathlib import Path

from flask import Flask, render_template, abort, send_file, jsonify

def create_app(config=None):
    app = Flask(__name__, instance_relative_config=False)
    
    app.config.from_pyfile("config.py")
    if config:
        app.config.from_pyfile(config)

    @app.route('/')
    def main():
        return render_template('index.html')

    @app.route('/ls/', defaults={"path": ""})
    @app.route('/ls/<path:path>')
    def get_ls(path):
        path: Path = Path(app.config["BASE_DIR"]) / path

        if not path.exists():
            return abort(404)

        if path.is_dir():
            response = {"images": [], "dirs": []}
            for f in path.iterdir():
                if f.is_dir():
                    response["dirs"].append(f.name)
                elif f.is_file() and f.suffix in app.config["ALLOWED_EXTENSIONS"]:
                    response["images"].append(f.name)

            return jsonify(response)
        else:
            abort(403)

    @app.route('/image/<path:image_path>')
    def get_image(image_path):
        abs_path: Path = Path(app.config["BASE_DIR"]) / image_path

        if not abs_path.exists():
            return abort(404)

        if abs_path.is_file() and abs_path.suffix in app.config["ALLOWED_EXTENSIONS"]:
            return send_file(abs_path)
        else:
            abort(403)


    return app

if __name__ == "__main__":
    app = create_app()
    app.run()
