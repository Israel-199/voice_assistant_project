# Captain Voice Assistant with RAG-Based Translation

A full-stack, **100% free**, production-grade Captain Voice Assistant application. The system receives text-based commands from a Captain, grounds response generation using a local **RAG (Retrieval-Augmented Generation)** vector search engine over a Ship Operations Knowledge Base (25 documents), translates the output into target languages (including **Amharic**), and synthesizes speech using the Captain's voice profile via Microsoft Edge Neural Speech (`edge-tts`).

---

## 🏗️ Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                            NEXT.JS COMMAND DECK FRONTEND                          |
|  (User Input -> Language Switcher [Amharic] -> Voice Selector -> Audio Player)    |
+----------------------------------------+------------------------------------------+
                                         |
                                  HTTP POST /api/query
                                         v
+-----------------------------------------------------------------------------------+
|                              FLASK BACKEND API (Python)                           |
|                                                                                   |
| 1. RAG VECTOR RETRIEVAL:                                                          |
|    Query -> TF-IDF Vectorizer -> Cosine Similarity Matrix -> Top-K Context Chunks  |
|                                                                                   |
| 2. GROUNDED LLM SYNTHESIS:                                                        |
|    Top-K Context + System Prompt -> Local Grounded Synthesizer / Cloud LLM        |
|                                                                                   |
| 3. MULTI-LINGUAL TRANSLATION:                                                     |
|    Grounded Text -> deep-translator (MyMemory/Google) -> Target Text (Amharic)    |
|                                                                                   |
| 4. VOICE SYNTHESIS (CAPTAIN'S VOICE):                                             |
|    Target Text -> edge-tts Engine -> MP3 Audio Stream (am-ET-AmehaNeural)        |
+----------------------------------------+------------------------------------------+
                                         |
                            Audio MP3 & JSON Audit Trace
                                         v
+-----------------------------------------------------------------------------------+
|                            CAPTAIN COMMAND DECK UI                                |
|  - Real-Time Audio Playback & Equalizer Waveform                                 |
|  - Translated Speech Text Output (Amharic / Multi-Lingual)                       |
|  - Interactive Audit Trace (Retrieved Vector Chunks, Similarity %, Grounding)    |
|  - Knowledge Base Explorer & Document Indexer                                     |
+-----------------------------------------------------------------------------------+
```

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm

---

### ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Backend API Port (Default: 5000)
PORT=5000

# Optional Cloud LLM API Keys (If omitted, system automatically uses 100% free built-in local grounded synthesizer)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

---

### 1. Launching the Backend (Flask API)

```bash
cd backend

# Option A: Using pre-created virtual environment
.\venv\Scripts\python.exe run.py

# Option B: Creating a fresh virtual environment
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The Flask backend will start on **`http://127.0.0.1:5000`**.

---

### 2. Launching the Frontend (Next.js Command Bridge UI)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install --legacy-peer-deps

# Start Next.js development server
npm run dev
```

Open **`http://localhost:3000`** in your web browser.

---

## 🛠️ Tools & Technologies Used (100% Free)

| Layer | Tool / Library | Reason & Justification |
| :--- | :--- | :--- |
| **Vector Store & RAG** | Scikit-Learn (TF-IDF + Cosine Similarity) | 100% free, lightweight, zero memory footprint, 0 latency vector indexing over 25+ documents. |
| **LLM Synthesis** | Local Grounded Engine + Multi-Cloud Provider Support | Built-in offline grounded synthesizer ensures 100% reliability out-of-the-box with zero API keys required; supports optional free Gemini / Groq keys. |
| **Translation** | `deep-translator` (MyMemory / Google Translate) | 100% free, fast, supports **Amharic (`am`)** and 10+ languages with zero paid API keys. |
| **Voice Synthesis** | `edge-tts` (Microsoft Edge Neural Speech) | Studio-quality neural voice synthesis supporting `am-ET-AmehaNeural` (Amharic Male Captain) and `en-US-ChristopherNeural` (English Male Captain) 100% free without credit card. |
| **Backend** | Python Flask + Flask-CORS | Modular, robust REST API serving endpoints `/api/query`, `/api/audio`, `/api/knowledge`. |
| **Frontend** | Next.js 16 + Tailwind CSS v4 + Lucide React | Modern dark sci-fi glassmorphic command deck UI with audio visualizer, pipeline audit trace tabs, and knowledge explorer. |

---

## 📚 Sample Knowledge Base

The repository includes a comprehensive 25-document knowledge base located at `backend/data/knowledge_base.json`. Topics include:
1. **DOC-001**: Quantum Reactor Core Thermal Emergency Protocol
2. **DOC-002**: Slipstream Drive Alignment & Warp Factor 4 Calibration
3. **DOC-003**: Tactical Defense Shield Phase Modulation
4. **DOC-005**: Life Support Systems & O2 Scrubber Maintenance
5. **DOC-007**: Hull Breach Containment & Emergency Force Fields
6. **DOC-008**: Captain Override Authorization Codes & Security Hierarchy
7. **DOC-011**: Medical Bay Bio-Hazard Quarantine Lockdown Protocol
8. **DOC-024**: Self-Destruct Sequence Operating Parameters

---

## 🔍 API Endpoints

- `POST /api/query`: Executes full RAG pipeline -> Translation -> TTS Synthesis. Returns JSON trace and audio URL.
- `GET /api/audio/<filename>`: Serves synthesized audio MP3 files.
- `GET /api/knowledge`: Returns indexed knowledge base documents.
- `POST /api/knowledge`: Indexes new custom document into vector store.
- `GET /api/voices`: Returns supported voice profiles and target languages.
- `GET /api/health`: Health status.

---

## ⚖️ Known Limitations & Future Roadmap

1. **Streaming Audio Support**: Currently, audio is synthesized into an MP3 file and returned. Future improvement: HTTP chunked audio streaming for sub-100ms latency.
2. **Speech-to-Text Input Layer**: Adding Web Speech API / Whisper for voice command input in addition to text input.
3. **Local Embedding Models**: Adding `sentence-transformers` for dense semantic embeddings when higher CPU resources are available.
