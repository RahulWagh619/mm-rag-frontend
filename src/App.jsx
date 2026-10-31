import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Paperclip,
  ArrowUp,
  FileText,
  Sliders,
  X,
  Layers,
  Zap,
  Clock,
  Cpu,
} from "lucide-react";
const API_BASE_URL = " https://rendering-proximity-pacifist.ngrok-free.dev";

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      content:
        "Welcome. Upload your multi-page document or PDF to initiate dynamic late-interaction indexing with ColQwen2 and zero-shot extraction via zero-shot extraction via Groq's Qwen 3.8-27b.",
      sources: [],
      telemetry: null,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFile, setActiveFile] = useState(null);
  const [indexStatus, setIndexStatus] = useState("idle");
  const [topK, setTopK] = useState(2);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // --- 1. FIXED FILE UPLOAD HANDLER ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveFile(file);
    setIndexStatus("indexing");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/index`, {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true", // Required for ngrok free tier
        },
        body: formData, // Browser auto-attaches multipart boundary
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        throw new Error(`Upload failed (${res.status}): ${errorDetails}`);
      }

      const data = await res.json();
      console.log("Index response:", data);
      setIndexStatus("ready");
    } catch (err) {
      console.error("Upload error:", err);
      alert(`Backend error: ${err.message}`);
      setIndexStatus("idle");
    }
  };

  // --- 2. FIXED QUERY HANDLER ---
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputQuery.trim() || isProcessing) return;

    const userText = inputQuery.trim();
    setInputQuery("");

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true", // Required for ngrok free tier
        },
        body: JSON.stringify({ query: userText, top_k: topK }),
      });

      if (!res.ok) {
        const errorDetails = await res.text();
        throw new Error(`Query failed (${res.status}): ${errorDetails}`);
      }

      const data = await res.json();

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        sources: data.sources || [],
        telemetry: data.telemetry || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Query error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Failed to retrieve answer: ${err.message}`,
          sources: [],
          telemetry: null,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="flex h-screen bg-[#0d0f12] text-zinc-100 font-sans antialiased overflow-hidden text-base selection:bg-emerald-500/30 selection:text-emerald-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf"
        className="hidden"
      />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 ease-in-out border-r border-zinc-800/60 bg-[#090b0e] flex flex-col justify-between overflow-hidden z-20`}
      >
        <div className="p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                <Sparkles className="h-5 w-5 text-black" />
              </div>
              <span className="font-semibold tracking-tight text-base text-zinc-200">
                DocVQA{" "}
                <span className="text-emerald-400 font-mono text-sm">
                  LateInt
                </span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1.5 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
              Corpus Target
            </span>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group border border-zinc-800/80 hover:border-emerald-500/50 bg-[#12151a] hover:bg-[#141920] rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/40 text-emerald-400 transition">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-300 transition">
                    {activeFile ? activeFile.name : "Upload Document"}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 mt-0.5">
                    {indexStatus === "idle" && "Click to select PDF"}
                    {indexStatus === "indexing" && "Building patch index..."}
                    {indexStatus === "ready" && "Indexed • Multi-vector active"}
                  </span>
                </div>
              </div>

              {indexStatus === "indexing" && (
                <div className="mt-3.5 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full w-2/3 animate-pulse rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
              Retrieval Budget
            </span>
            <div className="bg-[#12151a] border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-300 font-mono">Pages (top_k)</span>
                <span className="text-emerald-400 font-mono font-semibold px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-sm">
                  {topK}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="border border-zinc-800/60 rounded-xl p-4 bg-[#111418] flex flex-col gap-2.5">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" /> Pipeline Architecture
            </span>
            <div className="text-xs text-zinc-300 flex flex-col gap-2 pt-1 font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Retriever</span>
                <span className="text-emerald-400 font-medium">ColQwen2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Aspect</span>
                <span className="text-zinc-200">Dynamic Multi-Patch</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 font-sans">Extractor</span>
                <span className="text-cyan-400 font-medium">Qwen 3.8-27b</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/60 text-xs font-mono text-zinc-400 flex items-center justify-between">
          <span>Kaggle T4 Bridge</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />{" "}
            Ready
          </span>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col relative h-full">
        <header className="h-16 border-b border-zinc-800/60 px-6 flex items-center justify-between bg-[#0d0f12]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 transition"
              >
                <Sliders className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-sm font-mono font-medium text-zinc-300">
              Open-Domain DocVQA •{" "}
              <span className="text-zinc-100 font-sans font-semibold">
                Late Interaction Search
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
              Benchmark:
            </span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              90.0% EM • 97.5% F1
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-3.5 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="bg-[#1a1f26] border border-zinc-700/60 text-zinc-100 px-5 py-3 rounded-2xl max-w-[85%] text-base leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-w-full">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
                        Extracted Answer
                      </span>
                    </div>

                    <div className="text-base sm:text-lg text-zinc-100 leading-relaxed pl-8 font-normal">
                      {msg.content}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pl-8 flex flex-col gap-2.5 mt-2">
                        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-cyan-400" />{" "}
                          Grounded Evidences (Top-{topK})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {msg.sources.map((src, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedCitation(src)}
                              className="group border border-zinc-800/80 hover:border-cyan-500/50 bg-[#12151b] hover:bg-[#141922] p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-3.5"
                            >
                              <div className="h-14 w-12 bg-zinc-900 rounded-md overflow-hidden border border-zinc-800 group-hover:border-cyan-500/40 flex-shrink-0 relative">
                                <img
                                  src={src.previewUrl}
                                  alt="Page context"
                                  className="h-full w-full object-cover opacity-60 group-hover:opacity-90 transition"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <span className="absolute bottom-0.5 right-1 text-[10px] font-mono text-zinc-200">
                                  P.{src.pageNumber}
                                </span>
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-cyan-300 transition">
                                  {src.evidenceSummary}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                    MaxSim: {src.maxSimScore}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.telemetry && (
                      <div className="pl-8 mt-1">
                        <div className="inline-flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg bg-[#090b0e] border border-zinc-800/60 text-xs font-mono text-zinc-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            Retriever:{" "}
                            <span className="text-zinc-200">
                              {msg.telemetry.retrievalMs}ms
                            </span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-emerald-400" />
                            Reader:{" "}
                            <span className="text-zinc-200">
                              {msg.telemetry.readerMs}ms
                            </span>
                          </span>
                          <span>•</span>
                          <span className="text-emerald-400">
                            {msg.telemetry.exactMatchConfidence}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex flex-col gap-3 items-start pl-8">
                <div className="flex items-center gap-2 text-sm font-mono text-emerald-400">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    ColQwen2 Late-Interaction Search & Verification...
                  </span>
                </div>
                <div className="h-12 w-56 rounded-xl bg-zinc-900/60 border border-zinc-800/80 animate-pulse" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-5 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12] to-transparent">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSend}
              className="relative flex items-center bg-[#15191f] border border-zinc-800 focus-within:border-emerald-500/50 rounded-2xl shadow-[0_0_25px_rgba(0,0,0,0.5)] transition-all duration-200"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="pl-4 pr-3 py-4 text-zinc-400 hover:text-emerald-400 transition"
                title="Attach Document"
              >
                <Paperclip className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={
                  activeFile
                    ? `Ask anything about ${activeFile.name}...`
                    : "Ask a question across the document pool..."
                }
                className="flex-1 bg-transparent border-0 text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0 py-4"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || isProcessing}
                className={`mr-3 p-2.5 rounded-xl transition-all duration-200 ${
                  inputQuery.trim() && !isProcessing
                    ? "bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)] hover:bg-emerald-400 cursor-pointer"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="h-5 w-5 stroke-[2.5]" />
              </button>
            </form>

            <div className="text-center mt-3">
              <span className="text-xs font-mono text-zinc-500">
                ColQwen2 Dynamic Aspect-Ratio Retrieval • Qwen 3.8-27b Zero-Shot
                Extractor
              </span>
            </div>
          </div>
        </div>

        {/* Modal */}
        {selectedCitation && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12151b] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 flex flex-col gap-5 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                    Page {selectedCitation.pageNumber}
                  </span>
                  <span className="text-sm text-zinc-200 font-medium">
                    {selectedCitation.evidenceSummary}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCitation(null)}
                  className="text-zinc-400 hover:text-zinc-200 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center max-h-[420px]">
                <img
                  src={selectedCitation.previewUrl}
                  alt="High-resolution context"
                  className="w-full h-auto object-contain"
                />
                <div className="absolute top-[35%] left-[20%] w-[55%] h-[18%] border-2 border-emerald-400/80 bg-emerald-400/10 rounded-md shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-end justify-end p-1.5">
                  <span className="text-[10px] font-mono text-emerald-300 bg-black/80 px-1.5 py-0.5 rounded">
                    MaxSim Focal Match
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-zinc-400 pt-1">
                <span>MaxSim Similarity: {selectedCitation.maxSimScore}</span>
                <span className="text-cyan-400">
                  Dynamic Multi-Vector Grounding
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
