import os

class Config:
    PORT = int(os.getenv("PORT", 5000))
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_PATH = os.path.join(BASE_DIR, "data", "knowledge_base.json")
    STATIC_AUDIO_DIR = os.path.join(BASE_DIR, "static", "audio")
