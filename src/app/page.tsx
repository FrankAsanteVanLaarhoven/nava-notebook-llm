
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command, Mic, Sparkles, X, Power, Settings } from "lucide-react";
import StudioGrid from "@/components/studio/StudioGrid";
import SettingsModal, { VoiceSettings } from "@/components/studio/SettingsModal";

// --- FLUX PROTOCOL ---
type FluxSchema = {
    mode: "void" | "visual" | "analysis" | "comparison" | "chat" | "studio";
    components: any[];
};

export default function FluxEngine() {
    const [intent, setIntent] = useState("");
    const [schema, setSchema] = useState<FluxSchema>({ mode: "void", components: [] });
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // TTS State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({ 
        provider: 'browser',
        openRouterKey: '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' // Pre-filled for user convenience
    });
    const inputRef = useRef<HTMLInputElement>(null);

    // Load Settings
    useEffect(() => {
        const saved = localStorage.getItem('nava_voice_settings');
        if (saved) {
            try {
                // Merge with default to ensure new fields are present if old cache exists
                const parsed = JSON.parse(saved);
                setVoiceSettings(prev => ({ 
                    ...prev, 
                    ...parsed,
                    openRouterKey: parsed.openRouterKey || prev.openRouterKey // Keep pre-filled if not in cache
                }));
            } catch (e) {
                console.error("Failed to parse voice settings", e);
            }
        }
    }, []);

    const saveSettings = (newSettings: VoiceSettings) => {
        setVoiceSettings(newSettings);
        localStorage.setItem('nava_voice_settings', JSON.stringify(newSettings));
    };

    // --- TEXT TO SPEECH (Dola-like) ---
    const speak = async (text: string) => {
        // 1. Browser Fallback
        if (voiceSettings.provider === 'browser') {
            if (!('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.05;
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            return;
        }

        // 2. ID/API Providers (OpenAI / ElevenLabs)
        try {
            setIsSpeaking(true);
            const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    provider: voiceSettings.provider,
                    apiKey: voiceSettings.provider === 'openai' ? voiceSettings.openaiKey : voiceSettings.elevenLabsKey,
                    voiceId: voiceSettings.elevenLabsVoiceId
                })
            });

            if (!res.ok) throw new Error(await res.text());

            const blob = await res.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            audio.onended = () => setIsSpeaking(false);
            audio.play();

        } catch (err) {
            console.error("TTS Error:", err);
            setIsSpeaking(false);
            // Fallback to browser if API fails
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    // --- SPEECH RECOGNITION ---
    const startListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setIntent(transcript);
                // Auto-submit after voice
                setTimeout(() => processIntent(transcript), 500);
            };
            recognition.start();
        } else {
            alert("Speech recognition not supported in this browser.");
        }
    };

    // --- FOCUS LOGIC ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSchema({ mode: "void", components: [] });
                setIntent("");
            }
            // CMD+K or Slash to Focus
            if ((e.metaKey && e.key === "k") || e.key === "/") {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        
        // Auto-focus on mount
        setTimeout(() => inputRef.current?.focus(), 100);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // --- INTENT PARSER ---
    const processIntent = async (text: string) => {
        setIsProcessing(true);
        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (voiceSettings.openRouterKey) {
                headers['x-openrouter-key'] = voiceSettings.openRouterKey;
            }

            const res = await fetch('/api/flux', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ intent: text })
            });
            const data = await res.json();
            setSchema(data);
            
            // Speak response if available
            if (data.voice_response) {
                speak(data.voice_response);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processIntent(intent);
    };

    return (
        <main 
            className="flex min-h-screen flex-col items-center justify-center bg-black relative overflow-hidden"
            onClick={() => inputRef.current?.focus()} // Click anywhere to focus
        >
            
            {/* --- THE VOID CORE --- */}
            <AnimatePresence>
                {schema.mode === "void" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 2, filter: "blur(50px)" }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        {/* Breathing Core */}
                        <div className={`w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] transition-all duration-1000 
                            ${isListening ? 'scale-125 bg-red-500/20' : 'scale-100'}
                            ${isProcessing ? 'animate-pulse bg-cyan-500/20' : ''}
                        `} />
                        
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <Sparkles className={`w-16 h-16 text-white/20 transition-all duration-500 ${isProcessing ? 'animate-spin text-cyan-400' : ''}`} />
                            <p className="text-white/20 font-light tracking-[0.2em] text-sm uppercase flex items-center gap-2">
                                {isListening ? (
                                    <span className="text-red-400 animate-pulse">Listening...</span>
                                ) : isSpeaking ? (
                                    <span className="text-emerald-400 animate-pulse">Speaking...</span>
                                ) : isProcessing ? (
                                    "Generating Interface..."
                                ) : (
                                    "Waiting for Intent"
                                )}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* --- DYNAMIC RENDERER --- */}
            <AnimatePresence>
                {schema.mode !== "void" && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="z-10 w-full max-w-7xl h-[80vh] overflow-y-auto px-4 scrollbar-hide"
                        onClick={(e) => e.stopPropagation()} // Prevent focus stealing when clicking content
                    >
                        {/* HEADER */}
                        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6 sticky top-0 bg-black/80 backdrop-blur-xl z-50 pt-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-indigo-400 text-xs font-mono tracking-widest uppercase">Flux Generated UI</span>
                                <h2 className="text-3xl font-light text-white tracking-tight">{schema.mode.toUpperCase()}</h2>
                            </div>
                            <button 
                                onClick={() => {
                                    setSchema({ mode: "void", components: [] });
                                    setIntent("");
                                }} 
                                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
                            >
                                <span className="text-xs text-white/50 group-hover:text-white transition-colors">DISSOLVE UI</span>
                                <Power className="w-4 h-4 text-white/50 group-hover:text-red-400 transition-colors" />
                            </button>
                        </div>

                        {/* STUDIO GRID MODE */}
                        {schema.mode === 'studio' ? (
                            <StudioGrid />
                        ) : (
                            /* COMPONENT GRID (Existing) */
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-24">
                                {schema.components.map((comp: any, idx: number) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={`
                                            ${comp.type === 'gallery' ? 'col-span-12' : ''}
                                            ${comp.type === 'pdf_viewer' ? 'col-span-12 md:col-span-7' : ''}
                                            ${comp.type === 'chat_analysis' ? 'col-span-12 md:col-span-5' : ''}
                                            ${comp.type === 'table' ? 'col-span-12' : ''}
                                            ${comp.type === 'header' ? 'col-span-12' : ''}
                                            ${comp.type === 'message' ? 'col-span-12 md:col-span-8 md:col-start-3' : ''}
                                        `}
                                    >
                                        
                                        {/* --- COMPONENT TYPES --- */}

                                        {comp.type === 'header' && (
                                            <div className="mb-4">
                                                <h1 className="text-5xl font-thin text-white mb-2">{comp.text}</h1>
                                                <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-transparent rounded-full"/>
                                            </div>
                                        )}

                                        {comp.type === 'gallery' && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {comp.items.map((item: any, i: number) => (
                                                    <div key={i} className="group relative aspect-[4/3] bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer">
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 group-hover:text-white/30 transition-colors">
                                                            <span className="text-4xl">🖼️</span>
                                                            <span className="text-xs mt-2 font-mono">{item.src}</span>
                                                        </div>
                                                        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="text-sm font-medium text-white">{item.caption}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {comp.type === 'table' && (
                                            <div className="bg-zinc-900/30 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
                                                <table className="w-full text-left text-sm text-white/70">
                                                    <thead className="bg-white/5 text-white/90 uppercase tracking-wider text-xs">
                                                        <tr>
                                                            {comp.headers.map((h: string) => <th key={h} className="p-4 font-semibold">{h}</th>)}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {comp.rows.map((row: string[], r: number) => (
                                                            <tr key={r} className="hover:bg-white/5 transition-colors">
                                                                {row.map((cell: any, c: any) => <td key={c} className="p-4 font-light">{cell}</td>)}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}

                                        {comp.type === 'pdf_viewer' && (
                                            <div className="h-[700px] bg-zinc-900 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden group">
                                                <div className="flex items-center justify-between p-4 bg-black/20 border-b border-white/5">
                                                    <span className="text-xs text-white/40 font-mono">{comp.src}</span>
                                                    <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">Page {comp.page}</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-center">
                                                    <p className="text-white/20">Document Preview Wrapper</p>
                                                </div>
                                            </div>
                                        )}

                                        {comp.type === 'chat_analysis' && (
                                            <div className="h-full min-h-[400px] p-8 bg-zinc-900/50 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-6 text-cyan-400">
                                                        <Sparkles className="w-5 h-5" />
                                                        <span className="text-sm font-bold uppercase tracking-widest">AI Synthesis</span>
                                                    </div>
                                                    <p className="text-xl text-white/90 leading-relaxed font-light mb-8">{comp.insight}</p>
                                                </div>
                                                <div className="p-4 bg-cyan-900/10 rounded-xl border border-cyan-500/20">
                                                    <p className="text-sm text-cyan-200/70 italic font-mono">"{comp.initial_thought}"</p>
                                                </div>
                                            </div>
                                        )}

                                        {comp.type === 'message' && (
                                            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center">
                                                <p className="text-lg text-white/60">{comp.content}</p>
                                            </div>
                                        )}

                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>


            {/* --- INPUT ORBITAL (Fixed Z-Index) --- */}
            <div className="fixed bottom-12 w-full max-w-2xl px-4 z-[9999]" onClick={(e) => e.stopPropagation()}>
                
                {/* BRANDING HEADER (Floating above input) */}
                <div className="absolute -top-16 left-0 w-full flex justify-center pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-sm font-semibold tracking-widest text-white/80">NavaNotebookLLM</span>
                        </div>
                        <button 
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="relative group">
                    {/* Glow Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity duration-500 ${isListening ? 'opacity-100 bg-red-500/20' : 'group-hover:opacity-100 opacity-30'}`} />
                    
                    <div className="relative flex items-center bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 focus-within:ring-indigo-500/50 transition-all">
                        <Command className="w-5 h-5 text-white/30 ml-3" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            placeholder="Ask NavaNotebookLLM..."
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 text-lg px-4 py-3 font-light outline-none"
                            autoComplete="off"
                        />
                        <div className="flex items-center gap-2 pr-2">
                            {/* Visual Key Hint */}
                            <span className="hidden md:block text-[10px] bg-white/10 px-2 py-1 rounded text-white/30 font-mono">⌘K</span>
                            
                            {/* Mic Trigger */}
                            <button 
                                type="button" 
                                onClick={startListening}
                                className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </form>

                {/* ONBOARDING HINTS */}
                <div className="text-center mt-6 space-y-4">
                    <p className="text-white/30 text-xs font-mono tracking-widest uppercase animate-pulse">
                        Waiting for Intent...
                    </p>
                    <div className="flex justify-center gap-4 text-[10px] text-white/20 font-mono">
                        <span>Try: "Research Quantum Entanglement"</span>
                        <span className="opacity-50">|</span>
                        <span>"Compare VLA Models"</span>
                    </div>
                </div>
                
                {/* STUDIO TRIGGER */}
                <div className="flex justify-center mt-8">
                    <button 
                        onClick={() => processIntent("open studio")} 
                        className="group flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all"
                    >
                         <span className="text-indigo-400 group-hover:text-indigo-300 text-xs tracking-widest uppercase font-semibold">
                            [ Enter Studio ]
                        </span>
                    </button>
                </div>
            </div>

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                onSave={saveSettings}
                initialSettings={voiceSettings}
            />

        </main>
    );
}
