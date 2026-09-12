import os
import time
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from rag_engine import RAGEngine
from translator import TranslationEngine
from tts_engine import TTSEngine

load_dotenv()

app = Flask(__name__, static_folder="static")
CORS(app)

rag = RAGEngine()
translator = TranslationEngine()
tts = TTSEngine()

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "Captain Voice Assistant RAG API",
        "version": "1.0.0",
        "documents_indexed": len(rag.documents),
        "supported_languages": len(translator.get_supported_languages()),
        "supported_voices": len(tts.get_available_voices())
    })

@app.route("/api/query", methods=["POST"])
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

@app.route("/api/audio/<filename>", methods=["GET"])
def get_audio(filename):
    audio_dir = os.path.join(app.root_path, "static", "audio")
    return send_from_directory(audio_dir, filename)

@app.route("/api/knowledge", methods=["GET"])
def list_knowledge():
    return jsonify({
        "total_documents": len(rag.documents),
        "documents": rag.documents
    })

@app.route("/api/knowledge", methods=["POST"])
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

@app.route("/api/voices", methods=["GET"])
def get_voices():
    return jsonify({
        "voices": tts.get_available_voices(),
        "languages": translator.get_supported_languages()
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Captain Voice Assistant API starting on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
