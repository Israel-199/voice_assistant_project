import os
import re
import time
from typing import Dict, Any

class TranslationEngine:
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

    def _chunk_text(self, input_text: str, max_chunk_size: int = 350) -> list[str]:
        if not input_text or not input_text.strip():
            return []

        parts = re.split(r'(?<=[.!?;\n])\s+', input_text.strip())
        chunks = []
        curr = ""
        for p in parts:
            if len(p) > max_chunk_size:
                words = p.split(' ')
                for w in words:
                    if len(curr) + len(w) + 1 <= max_chunk_size:
                        curr = (curr + " " + w).strip()
                    else:
                        if curr:
                            chunks.append(curr)
                        curr = w
            else:
                if len(curr) + len(p) + 1 <= max_chunk_size:
                    curr = (curr + " " + p).strip()
                else:
                    if curr:
                        chunks.append(curr)
                    curr = p
        if curr:
            chunks.append(curr)
        return chunks

    def translate(self, text: str, target_lang: str = "am") -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "translated_text": "",
                "source_lang": "en",
                "target_lang": target_lang,
                "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang)
            }

        if target_lang.lower() in ["en", "english"]:
            return {
                "translated_text": text,
                "source_lang": "en",
                "target_lang": "en",
                "target_lang_name": "English",
                "provider": "Direct"
            }

        for attempt in range(2):
            try:
                from deep_translator import GoogleTranslator
                translator = GoogleTranslator(source='en', target=target_lang)
                if len(text) > 1500:
                    chunks = self._chunk_text(text, max_chunk_size=1000)
                    translated_chunks = [translator.translate(c) for c in chunks if c.strip()]
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
                clean_reason = "Network offline or DNS service unavailable" if ("NameResolutionError" in str(e) or "getaddrinfo" in str(e) or "Max retries exceeded" in str(e)) else "Service busy"
                print(f"[Translation System] Primary Google Translator (Attempt {attempt+1}) unavailable: {clean_reason}")
                time.sleep(0.3)

        for attempt in range(2):
            try:
                from deep_translator import MyMemoryTranslator
                target_tag = self.MYMEMORY_LANG_MAP.get(target_lang, target_lang)
                translator = MyMemoryTranslator(source='en-US', target=target_tag)
                
                chunks = self._chunk_text(text, max_chunk_size=350)
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
                clean_reason = "Network offline or DNS service unavailable" if ("NameResolutionError" in str(e) or "getaddrinfo" in str(e) or "Max retries exceeded" in str(e)) else "Service busy"
                print(f"[Translation System] Secondary MyMemory Translator (Attempt {attempt+1}) unavailable: {clean_reason}")
                time.sleep(0.3)

        return {
            "translated_text": text,
            "source_lang": "en",
            "target_lang": target_lang,
            "target_lang_name": self.SUPPORTED_LANGUAGES.get(target_lang, target_lang),
            "provider": "Offline Fallback",
            "notice": "Offline Mode Active: Online translation service was unreachable. Displaying original grounded text."
        }

    def get_supported_languages(self) -> Dict[str, str]:
        return self.SUPPORTED_LANGUAGES
