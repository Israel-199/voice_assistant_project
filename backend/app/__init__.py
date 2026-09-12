from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from app.config import Config

load_dotenv()

def create_app():
    app = Flask(__name__, static_folder=Config.STATIC_AUDIO_DIR)
    CORS(app)

    from app.api.routes import api_bp
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
