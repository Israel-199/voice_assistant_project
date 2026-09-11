import os
from typing import Dict, Any

class TranslationEngine:
    """Translation Engine utilizing deep-translator (MyMemory & Google Translate) for free multi-lingual support."""

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

    # Language code mapping for MyMemory API (requires standard RFC 3066 tag like 'am-ET')
    MYMEMORY_LANG_MAP = {
        "am": "am-ET",
        "en": "en-US",
        "es": "es-ES",
        "fr": "fr-FR",
        "de": "de-DE",
        "ar": "ar-SA",
        "zh-CN": "zh-CN",
        "ja": "ja-JP",
        "ru": "ru-RU",
        "hi": "hi-IN"
    }

    def __init__(self):
        print("Translation Engine: Initialized with support for 10+ languages (including Amharic).")

    def translate(self, text: str, target_lang: str = "am") -> Dict[str, Any]:
        """Translates input text to target language using robust free translation providers."""
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

        # Attempt 1: MyMemoryTranslator
        try:
            from deep_translator import MyMemoryTranslator
            target_tag = self.MYMEMORY_LANG_MAP.get(target_lang, target_lang)
            translator = MyMemoryTranslator(source='en-US', target=target_tag)
            translated = translator.translate(text)
            
            if translated and not translated.startswith("Error"):
                return {
                    "translated_text": translated,
                    "source_lang": "en",
                    "target_lang": target_lang,
                    "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
                    "provider": "MyMemory"
                }
        except Exception as e:
            print(f"MyMemoryTranslator failed for {target_lang}: {e}")

        # Attempt 2: GoogleTranslator fallback
        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source='en', target=target_lang)
            translated = translator.translate(text)
            if translated:
                return {
                    "translated_text": translated,
                    "source_lang": "en",
                    "target_lang": target_lang,
                    "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
                    "provider": "GoogleTranslate"
                }
        except Exception as e:
            print(f"GoogleTranslator fallback failed for {target_lang}: {e}")

        # Safe Fallback: Return original text with notice if network is isolated
        return {
            "translated_text": text,
            "source_lang": "en",
            "target_lang": target_lang,
            "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
            "notice": "Translation service fallback active."
        }

    def get_supported_languages(self) -> Dict[str, str]:
        return self.SUPPORTED_LANGUAGES
