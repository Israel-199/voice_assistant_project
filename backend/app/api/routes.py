import time
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.core.rag_engine import RAGEngine
from app.core.translator import TranslationEngine
from app.core.tts_engine import TTSEngine
from app.config import Config

api_bp = Blueprint("api", __name__)

rag = RAGEngine()
translator = TranslationEngine()
tts = TTSEngine()

@api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Captain Voice Assistant RAG API",
        "version": "1.0.0",
        "documents_indexed": len(rag.documents),
        "supported_languages": len(translator.get_supported_languages()),
        "supported_voices": len(tts.get_available_voices())
    })

@api_bp.route("/query", methods=["POST"])
def process_query():
    start_time = time.time()
    data = request.json or {}

    query = data.get("query", "").strip()
    target_language = data.get("target_language", "am")
    voice_profile = data.get("voice_profile", None)
    top_k = int(data.get("top_k", 3))
    llm_provider = data.get("llm_provider", "local")

    if not query:
        return jsonify({"error": "Query string is required"}), 400

    retrieved_chunks = rag.search(query, top_k=top_k)
    llm_result = rag.generate_grounded_response(query, retrieved_chunks, provider=llm_provider)

    llm_text = llm_result["response"]
    translation_result = translator.translate(llm_text, target_lang=target_language)
    translated_text = translation_result["translated_text"]

    tts_result = tts.synthesize(
        text=translated_text,
        voice=voice_profile,
        target_lang=target_language
    )

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return jsonify({
        "status": "success",
        "input": {
            "query": query,
            "target_language": target_language,
            "target_language_name": translation_result.get("target_language_name", target_language),
            "voice_profile": tts_result.get("voice_id"),
            "voice_name": tts_result.get("voice_name")
        },
        "rag": {
            "retrieved_chunks": retrieved_chunks,
            "top_score": retrieved_chunks[0]["similarity_pct"] if retrieved_chunks else "0%",
            "retrieved_count": len(retrieved_chunks)
        },
        "llm": {
            "response": llm_text,
            "grounded": llm_result.get("grounded", True),
            "provider": llm_result.get("provider", "local"),
            "citations": llm_result.get("citations", [])
        },
        "translation": {
            "translated_text": translated_text,
            "source_lang": translation_result.get("source_lang", "en"),
            "target_lang": target_language,
            "target_lang_name": translation_result.get("target_language_name")
        },
        "tts": {
            "audio_filename": tts_result.get("audio_filename"),
            "audio_url": tts_result.get("audio_url"),
            "voice_name": tts_result.get("voice_name"),
            "file_size_bytes": tts_result.get("file_size_bytes", 0)
        },
        "trace": {
            "execution_time_ms": elapsed_ms,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

@api_bp.route("/audio/<filename>", methods=["GET"])
def get_audio(filename):
    return send_from_directory(Config.STATIC_AUDIO_DIR, filename)

@api_bp.route("/knowledge", methods=["GET"])
def list_knowledge():
    return jsonify({
        "total_documents": len(rag.documents),
        "documents": rag.documents
    })

@api_bp.route("/knowledge", methods=["POST"])
def add_knowledge():
    data = request.json or {}
    title = data.get("title", "").strip()
    category = data.get("category", "General Operations").strip()
    content = data.get("content", "").strip()

    if not title or not content:
        return jsonify({"error": "Title and content are required."}), 400

    new_doc = rag.add_document(title, category, content)
    return jsonify({
        "message": "Document successfully added and RAG vector index updated.",
        "document": new_doc
    }), 201

@api_bp.route("/voices", methods=["GET"])
def get_voices():
    return jsonify({
        "voices": tts.get_available_voices(),
        "languages": translator.get_supported_languages()
    })
