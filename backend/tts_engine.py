import os
import asyncio
import uuid
import edge_tts
from typing import Dict, Any

class TTSEngine:
    """Voice Synthesis Engine using Microsoft Edge Neural TTS (100% free, studio-quality)."""

    VOICE_PROFILES = {
        "am-ET-AmehaNeural": {"name": "Captain Ameha (Amharic Neural Male)", "lang": "am", "gender": "Male"},
        "am-ET-MekdesNeural": {"name": "Captain Mekdes (Amharic Neural Female)", "lang": "am", "gender": "Female"},
        "en-US-ChristopherNeural": {"name": "Captain Christopher (English Neural Male)", "lang": "en", "gender": "Male"},
        "en-US-JennyNeural": {"name": "Captain Jenny (English Neural Female)", "lang": "en", "gender": "Female"},
        "en-US-GuyNeural": {"name": "Captain Guy (English Authoritative Male)", "lang": "en", "gender": "Male"},
        "es-ES-AlvaroNeural": {"name": "Captain Alvaro (Spanish Neural Male)", "lang": "es", "gender": "Male"},
        "fr-FR-HenriNeural": {"name": "Captain Henri (French Neural Male)", "lang": "fr", "gender": "Male"},
        "de-DE-ConradNeural": {"name": "Captain Conrad (German Neural Male)", "lang": "de", "gender": "Male"},
        "ar-SA-HamedNeural": {"name": "Captain Hamed (Arabic Neural Male)", "lang": "ar", "gender": "Male"},
        "zh-CN-YunxiNeural": {"name": "Captain Yunxi (Chinese Neural Male)", "lang": "zh-CN", "gender": "Male"},
        "ja-JP-KeitaNeural": {"name": "Captain Keita (Japanese Neural Male)", "lang": "ja", "gender": "Male"},
        "ru-RU-DmitryNeural": {"name": "Captain Dmitry (Russian Neural Male)", "lang": "ru", "gender": "Male"},
        "hi-IN-MadhurNeural": {"name": "Captain Madhur (Hindi Neural Male)", "lang": "hi", "gender": "Male"}
    }

    LANG_DEFAULT_VOICE = {
        "am": "am-ET-AmehaNeural",
        "en": "en-US-ChristopherNeural",
        "es": "es-ES-AlvaroNeural",
        "fr": "fr-FR-HenriNeural",
        "de": "de-DE-ConradNeural",
        "ar": "ar-SA-HamedNeural",
        "zh-CN": "zh-CN-YunxiNeural",
        "ja": "ja-JP-KeitaNeural",
        "ru": "ru-RU-DmitryNeural",
        "hi": "hi-IN-MadhurNeural"
    }

    def __init__(self, output_dir: str = None):
        if output_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            output_dir = os.path.join(base_dir, "static", "audio")

        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"TTS Engine: Initialized. Saving audio files to {self.output_dir}")

    async def _generate_audio_async(self, text: str, voice: str, output_path: str, rate: str = "+0%", pitch: str = "+0Hz"):
        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate, pitch=pitch)
        await communicate.save(output_path)

    def synthesize(self, text: str, voice: str = None, target_lang: str = "am", rate: str = "+0%", pitch: str = "+0Hz") -> Dict[str, Any]:
        """Synthesizes text into an MP3 file using Edge TTS."""
        if not text or not text.strip():
            return {"error": "Text is empty"}

        # Select appropriate voice profile based on requested voice or target language
        selected_voice = voice
        if not selected_voice or selected_voice not in self.VOICE_PROFILES:
            selected_voice = self.LANG_DEFAULT_VOICE.get(target_lang, "en-US-ChristopherNeural")

        filename = f"captain_speech_{uuid.uuid4().hex[:8]}.mp3"
        file_path = os.path.join(self.output_dir, filename)

        try:
            asyncio.run(self._generate_audio_async(text, selected_voice, file_path, rate=rate, pitch=pitch))
            
            voice_info = self.VOICE_PROFILES.get(selected_voice, {"name": selected_voice, "gender": "Unknown"})
            
            return {
                "audio_filename": filename,
                "audio_url": f"/api/audio/{filename}",
                "voice_id": selected_voice,
                "voice_name": voice_info.get("name"),
                "voice_gender": voice_info.get("gender"),
                "rate": rate,
                "pitch": pitch,
                "file_size_bytes": os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
        except Exception as e:
            print(f"TTS synthesis error for voice {selected_voice}: {e}")
            return {
                "error": str(e),
                "voice_id": selected_voice,
                "audio_url": None
            }

    def get_available_voices(self) -> Dict[str, Any]:
        return self.VOICE_PROFILES
