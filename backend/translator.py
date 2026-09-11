import os
from typing import Dict, Any

class TranslationEngine:
    """Translation Engine utilizing deep-translator (Google Translate) for free multi-lingual support."""

    SUPPORTED_LANGUAGES = {
        "en": "English",
        "am": "Amharic (አማርኛ)",
        "es": "Spanish (Español)",
        "fr": "French (Français)",
        "de": "German (Deutsch)",
        "ar": "Arabic (العربية)",
        "zh-CN": "Chinese (Simplified)",
        "ja": "Japanese (日本語)",
        "ru": "Russian (Русский)",
        "hi": "Hindi (हिन्दी)"
    }

    def __init__(self):
        print("Translation Engine: Initialized with support for 10+ languages (including Amharic).")

    def translate(self, text: str, target_lang: str = "am") -> Dict[str, Any]:
        """Translates input text to target language."""
        if not text or not text.strip():
            return {
                "translated_text": "",
                "source_lang": "en",
                "target_lang": target_lang,
                "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang)
            }

        # If target language is English or same, return directly
        if target_lang.lower() in ["en", "english"]:
            return {
                "translated_text": text,
                "source_lang": "en",
                "target_lang": "en",
                "target_lang_name": "English"
            }

        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source='auto', target=target_lang)
            translated = translator.translate(text)
            
            return {
                "translated_text": translated,
                "source_lang": "en",
                "target_lang": target_lang,
                "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang)
            }
        except Exception as e:
            print(f"Translation failed for lang {target_lang}: {e}. Returning original text.")
            return {
                "translated_text": text,
                "source_lang": "en",
                "target_lang": target_lang,
                "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
                "error": str(e)
            }

    def get_supported_languages(self) -> Dict[str, str]:
        return self.SUPPORTED_LANGUAGES
