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

        # Helper function to split long text into chunks <= 400 chars
        def chunk_text(input_text: str, max_chunk_size: int = 400):
            sentences = input_text.split('. ')
            chunks = []
            curr_chunk = ""
            for s in sentences:
                sentence = s if s.endswith('.') else s + '.'
                if len(curr_chunk) + len(sentence) + 1 <= max_chunk_size:
                    curr_chunk = (curr_chunk + " " + sentence).strip()
                else:
                    if curr_chunk:
                        chunks.append(curr_chunk)
                    curr_chunk = sentence
            if curr_chunk:
                chunks.append(curr_chunk)
            return chunks

        # Attempt 1: GoogleTranslator (Supports up to 5000 chars, reliable & high accuracy for Amharic)
        try:
            from deep_translator import GoogleTranslator
            translator = GoogleTranslator(source='en', target=target_lang)
            # If text is very long, chunk it
            if len(text) > 4000:
                chunks = chunk_text(text, 3500)
                translated_chunks = [translator.translate(c) for c in chunks]
                translated = " ".join(translated_chunks)
            else:
                translated = translator.translate(text)

            if translated and not translated.startswith("Error"):
                return {
                    "translated_text": translated,
                    "source_lang": "en",
                    "target_lang": target_lang,
                    "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
                    "provider": "GoogleTranslate"
                }
        except Exception as e:
            print(f"GoogleTranslator failed for {target_lang}: {e}")

        # Attempt 2: MyMemoryTranslator (with chunking for 500 char limit)
        try:
            from deep_translator import MyMemoryTranslator
            target_tag = self.MYMEMORY_LANG_MAP.get(target_lang, target_lang)
            translator = MyMemoryTranslator(source='en-US', target=target_tag)
            
            chunks = chunk_text(text, 400)
            translated_chunks = [translator.translate(c) for c in chunks if c.strip()]
            translated = " ".join(translated_chunks)
            
            if translated and not translated.startswith("Error"):
                return {
                    "translated_text": translated,
                    "source_lang": "en",
                    "target_lang": target_lang,
                    "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
                    "provider": "MyMemory"
                }
        except Exception as e:
            print(f"MyMemoryTranslator fallback failed for {target_lang}: {e}")

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
