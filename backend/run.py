import os
from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    port = Config.PORT
    print(f"Captain Voice Assistant API starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
