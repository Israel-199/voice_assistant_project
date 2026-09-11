"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  Database,
  Globe,
  Radio,
  Sliders,
  Sparkles,
  ShieldAlert,
  Cpu,
  FileText,
  CheckCircle2,
  Layers,
  Search,
  Plus,
  X,
  RefreshCw,
  Terminal,
  Activity,
  Compass
} from "lucide-react";

interface RAGChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity_score: number;
  similarity_pct: string;
  citation: string;
}

interface PipelineTrace {
  input: {
    query: string;
    target_language: string;
    target_language_name: string;
    voice_profile: string;
    voice_name: string;
  };
  rag: {
    retrieved_chunks: RAGChunk[];
    top_score: string;
    retrieved_count: number;
  };
  llm: {
    response: string;
    grounded: boolean;
    provider: string;
    citations: string[];
  };
  translation: {
    translated_text: string;
    source_lang: string;
    target_lang: string;
    target_lang_name: string;
  };
  tts: {
    audio_filename: string;
    audio_url: string;
    voice_name: string;
    file_size_bytes: number;
  };
  trace: {
    execution_time_ms: number;
    timestamp: string;
  };
}

interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
}

const PRESET_COMMANDS = [
  {
    label: "Reactor Overheat Protocol",
    query: "What is the emergency protocol for a quantum reactor core overheat exceeding 4500 Kelvin?",
    icon: ShieldAlert,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10"
  },
  {
    label: "Warp 4 Slipstream Alignment",
    query: "How do I align slipstream drive deflector array for Warp Factor 4 jump?",
    icon: Compass,
    color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
  },
  {
    label: "Tactical Shield Frequencies",
    query: "How do we modulate forward shield frequency matrix against energy broadsides?",
    icon: Cpu,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10"
  },
  {
    label: "Captain Override Clearance",
    query: "What command code grants absolute system override and zero-point discharge?",
    icon: Terminal,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
  }
];

export default function CommandDeckPage() {
  const [query, setQuery] = useState("");
  const [targetLang, setTargetLang] = useState("am"); // Default: Amharic
  const [voiceProfile, setVoiceProfile] = useState("am-ET-AmehaNeural"); // Default: Amharic Male Captain
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PipelineTrace | null>(null);
  const [activeTab, setActiveTab] = useState<"retrieval" | "llm" | "translation" | "tts">("retrieval");
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Knowledge Base Modal state
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeDoc[]>([]);
  const [kbSearch, setKbSearch] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCat, setNewDocCat] = useState("General Operations");
  const [newDocContent, setNewDocContent] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);

  // Available Voices & Languages
  const [voices, setVoices] = useState<Record<string, any>>({});
  const [languages, setLanguages] = useState<Record<string, string>>({});
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  const API_BASE = "http://127.0.0.1:5000";

  // Check health and load available options
  useEffect(() => {
    fetchHealth();
    fetchVoicesAndLanguages();
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (res.ok) {
        setBackendOnline(true);
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  };

  const fetchVoicesAndLanguages = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/voices`);
      if (res.ok) {
        const data = await res.json();
        setVoices(data.voices || {});
        setLanguages(data.languages || {});
      }
    } catch (err) {
      console.error("Failed to load voices:", err);
    }
  };

  const fetchKnowledgeBase = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`);
      if (res.ok) {
        const data = await res.json();
        setKnowledgeList(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load knowledge base:", err);
    }
  };

  // Handle auto voice selection when target language changes
  const handleLanguageChange = (lang: string) => {
    setTargetLang(lang);
    if (lang === "am") setVoiceProfile("am-ET-AmehaNeural");
    else if (lang === "en") setVoiceProfile("en-US-ChristopherNeural");
    else if (lang === "es") setVoiceProfile("es-ES-AlvaroNeural");
    else if (lang === "fr") setVoiceProfile("fr-FR-HenriNeural");
    else if (lang === "de") setVoiceProfile("de-DE-ConradNeural");
    else if (lang === "ar") setVoiceProfile("ar-SA-HamedNeural");
    else if (lang === "zh-CN") setVoiceProfile("zh-CN-YunxiNeural");
    else if (lang === "ja") setVoiceProfile("ja-JP-KeitaNeural");
    else if (lang === "ru") setVoiceProfile("ru-RU-DmitryNeural");
    else if (lang === "hi") setVoiceProfile("hi-IN-MadhurNeural");
  };

  const handleTransmit = async (queryText?: string) => {
    const textToSubmit = queryText || query;
    if (!textToSubmit.trim() || loading) return;

    setLoading(true);
    setIsPlaying(false);
    
    try {
      const res = await fetch(`${API_BASE}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSubmit,
          target_language: targetLang,
          voice_profile: voiceProfile,
          top_k: topK
        })
      });

      if (!res.ok) throw new Error("API request failed");
      const data: PipelineTrace = await res.json();
      setResult(data);
      
      // Auto-play synthesized voice when ready
      if (data.tts && data.tts.audio_url) {
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = `${API_BASE}${data.tts.audio_url}`;
            audioRef.current.play().catch(e => console.log("Auto-play prevented:", e));
            setIsPlaying(true);
          }
        }, 300);
      }
    } catch (err) {
      console.error("Error transmitting command:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAddKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim() || addingDoc) return;

    setAddingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDocTitle,
          category: newDocCat,
          content: newDocContent
        })
      });
      if (res.ok) {
        setNewDocTitle("");
        setNewDocContent("");
        fetchKnowledgeBase();
      }
    } catch (err) {
      console.error("Failed to add document:", err);
    } finally {
      setAddingDoc(false);
    }
  };

  const filteredKb = knowledgeList.filter(doc =>
    doc.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
    doc.category.toLowerCase().includes(kbSearch.toLowerCase()) ||
    doc.content.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime);
            setAudioDuration(audioRef.current.duration || 0);
          }
        }}
      />

      {/* TOP HEADER / SYSTEM STATUS */}
      <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                  CAPTAIN COMMAND DECK
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  RAG VOICE ENGINE v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Grounded Retrieval • Multi-Lingual Translation • Edge Neural Voice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-ping' : 'bg-amber-500'}`} />
              <span className="text-slate-300 font-mono">
                API: {backendOnline ? "ONLINE [127.0.0.1:5000]" : "CONNECTING..."}
              </span>
            </div>

            {/* Knowledge Base Modal Trigger */}
            <button
              onClick={() => {
                setShowKnowledgeModal(true);
                fetchKnowledgeBase();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Knowledge Base</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: COMMAND INPUT & SETTINGS (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* QUICK COMMAND PRESETS */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Quick Captain Commands
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_COMMANDS.map((preset, idx) => {
                const IconComp = preset.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(preset.query);
                      handleTransmit(preset.query);
                    }}
                    className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition hover:scale-[1.02] active:scale-[0.98] ${preset.color}`}
                  >
                    <IconComp className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="text-xs font-medium line-clamp-2 leading-tight">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMMAND INPUT FORM */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Transmit Command
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Text Input Layer</span>
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Captain operational query or emergency command..."
                rows={4}
                className="w-full rounded-lg bg-slate-950/80 border border-slate-800 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60 transition resize-none font-mono"
              />
            </div>

            {/* CONTROLS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Language Select */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-cyan-400" /> Target Language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name} {code === 'am' ? '★ (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Captain Voice Select */}
              <div>
                <label className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-violet-400" /> Voice Profile
                </label>
                <select
                  value={voiceProfile}
                  onChange={(e) => setVoiceProfile(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-800 py-2 px-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition"
                >
                  {Object.entries(voices).map(([vId, vObj]: [string, any]) => (
                    <option key={vId} value={vId}>
                      {vObj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TOP-K SLIDER */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3 h-3 text-cyan-400" /> RAG Retrieval Depth (Top-K Chunks)
                </span>
                <span className="text-cyan-400 font-bold">{topK}</span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-900 cursor-pointer h-1.5 rounded-lg"
              />
            </div>

            {/* TRANSMIT BUTTON */}
            <button
              onClick={() => handleTransmit()}
              disabled={loading || !query.trim()}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing Pipeline...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>TRANSMIT TO CAPTAIN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PIPELINE RESULTS & TRACE INSPECTOR (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* AUDIO PLAYER & TRANSLATED SPEECH CARD */}
          <div className="glass-panel-glow rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Captain Voice Output
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Language: <span className="text-cyan-300 font-semibold">{result ? result.input.target_language_name : "Amharic (አማርኛ)"}</span> • Profile: <span className="text-violet-300 font-semibold">{result ? result.input.voice_name : "Captain Ameha"}</span>
                  </p>
                </div>
              </div>

              {/* Audio Controls */}
              {result && result.tts && result.tts.audio_url && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAudioPlay}
                    className="p-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition shadow-md shadow-cyan-500/30"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Audio Waveform Animation & Text Display */}
            {result ? (
              <div className="flex flex-col gap-3">
                {/* Waveform Equalizer */}
                <div className="flex items-center justify-between bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                  <div className="flex items-center gap-1.5 h-7 px-2">
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-1' : 'h-1.5'}`} />
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-2' : 'h-3'}`} />
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-3' : 'h-2'}`} />
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-4' : 'h-4'}`} />
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-5' : 'h-2'}`} />
                    <span className={`w-1 rounded-full bg-cyan-400 ${isPlaying ? 'animate-bar-2' : 'h-3'}`} />
                  </div>
                  
                  <div className="text-right text-[11px] font-mono text-slate-400">
                    <span>{Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s</span>
                    <span className="ml-2 text-slate-500">({(result.tts.file_size_bytes / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>

                {/* Translated Text Speech Display */}
                <div className="p-4 rounded-lg bg-slate-950/90 border border-cyan-500/30">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
                    SYNTHESIZED SPEECH TEXT ({result.input.target_language_name})
                  </span>
                  <p className="text-base font-medium text-slate-100 leading-relaxed font-sans">
                    "{result.translation.translated_text}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Radio className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <p className="text-xs font-mono">Awaiting command transmission...</p>
                <p className="text-[11px] text-slate-600">Audio playback will materialize here upon response generation.</p>
              </div>
            )}
          </div>

          {/* PIPELINE TRACE INSPECTOR (TABS) */}
          <div className="glass-panel rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Full Execution Pipeline Audit Trace
                </h3>
              </div>
              {result && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Latency: {result.trace.execution_time_ms} ms
                </span>
              )}
            </div>

            {/* TAB HEADERS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveTab("retrieval")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "retrieval"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> 1. Vector Retrieval ({result ? result.rag.retrieved_count : 0})
              </button>
              <button
                onClick={() => setActiveTab("llm")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "llm"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> 2. LLM Grounded Response
              </button>
              <button
                onClick={() => setActiveTab("translation")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "translation"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> 3. Translation Matrix
              </button>
              <button
                onClick={() => setActiveTab("tts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "tts"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Mic className="w-3.5 h-3.5" /> 4. Voice Synthesis Spec
              </button>
            </div>

            {/* TAB CONTENTS */}
            {result ? (
              <div className="mt-2 min-h-[220px]">
                {/* TAB 1: RAG RETRIEVAL CHUNKS */}
                {activeTab === "retrieval" && (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                      <span>Top Chunks Retrieved from Vector Database</span>
                      <span className="text-cyan-400 font-semibold">Max Match: {result.rag.top_score}</span>
                    </div>
                    {result.rag.retrieved_chunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-2 hover:border-cyan-500/40 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> [{chunk.id}] {chunk.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                            Match: {chunk.similarity_pct}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-2.5 rounded border border-slate-800/80 font-sans">
                          "{chunk.content}"
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">Category: {chunk.category}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 2: LLM RESPONSE & GROUNDING */}
                {activeTab === "llm" && (
                  <div className="flex flex-col gap-3">
                    <div className="p-4 rounded-lg bg-slate-950/80 border border-cyan-500/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> GROUNDED LLM SYNTHESIS
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          Provider: {result.llm.provider.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                        {result.llm.response}
                      </p>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <span className="text-[11px] font-mono text-slate-400">Context Citations:</span>
                        {result.llm.citations.map((c, i) => (
                          <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: TRANSLATION MATRIX */}
                {activeTab === "translation" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Original English LLM Text</span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {result.llm.response}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950/80 border border-cyan-500/40 flex flex-col gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                        Translated Text ({result.translation.target_lang_name})
                      </span>
                      <p className="text-xs text-cyan-100 font-sans leading-relaxed">
                        {result.translation.translated_text}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 4: TTS SPECS */}
                {activeTab === "tts" && (
                  <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col gap-3 font-mono text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">TTS Engine:</span>
                      <span className="text-cyan-400">Microsoft Edge Neural TTS (edge-tts)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Selected Voice ID:</span>
                      <span className="text-violet-300">{result.input.voice_profile}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Audio File Name:</span>
                      <span className="text-slate-300">{result.tts.audio_filename}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Audio Endpoint:</span>
                      <span className="text-emerald-400">{result.tts.audio_url}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-600">
                <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs font-mono">No trace data available yet.</p>
                <p className="text-[11px] text-slate-600">Execute a command to populate the execution pipeline trace.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* KNOWLEDGE BASE EXPLORER MODAL */}
      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-mono font-bold text-slate-100 uppercase">
                  Ship Operational Manual Knowledge Base ({knowledgeList.length} Documents)
                </h2>
              </div>
              <button
                onClick={() => setShowKnowledgeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Left Column: Search & Add Document */}
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    placeholder="Search documents by title or keyword..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Add Document Form */}
                <form onSubmit={handleAddKnowledge} className="p-3.5 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col gap-3">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add Custom Operational Document
                  </span>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Document Title</label>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="e.g. Sub-Space Sensor Override"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Category</label>
                    <input
                      type="text"
                      value={newDocCat}
                      onChange={(e) => setNewDocCat(e.target.value)}
                      placeholder="Engineering / Tactical / Safety"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400">Procedure Content & Specs</label>
                    <textarea
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      placeholder="Detailed operational steps, safety parameters, clearance codes..."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mt-1 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={addingDoc || !newDocTitle.trim() || !newDocContent.trim()}
                    className="py-2 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                  >
                    {addingDoc ? "Re-indexing Vector Store..." : "Index Document into RAG Engine"}
                  </button>
                </form>
              </div>

              {/* Right Column: Indexed Documents List */}
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredKb.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        [{doc.id}] {doc.title}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {doc.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {doc.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
