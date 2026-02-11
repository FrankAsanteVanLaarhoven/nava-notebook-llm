"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Video, BrainCircuit, FileText, Layers, PieChart, Presentation, Table, MessageSquarePlus, Code } from "lucide-react";
import { useState, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import StudioOverlay from "./StudioOverlay";

// Card Definitions
const initialCards = [
    { id: "video", title: "Video Overview", icon: Video, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { id: "notebook", title: "NAVA Notebook", icon: Code, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { id: "mindmap", title: "Mind Map", icon: BrainCircuit, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { id: "reports", title: "Key Reports", icon: FileText, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { id: "flashcards", title: "Flashcards", icon: Layers, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { id: "quiz", title: "Study Quiz", icon: MessageSquarePlus, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { id: "infographic", title: "Infographic", icon: PieChart, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
    { id: "slides", title: "Slide Deck", icon: Presentation, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { id: "data", title: "Data Table", icon: Table, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
];

export default function StudioGrid() {
const [gridCards, setGridCards] = useState(initialCards);
    const [selectedCard, setSelectedCard] = useState<typeof initialCards[0] | null>(null);
    const [isAddingSource, setIsAddingSource] = useState(false);
    const [newSourceInput, setNewSourceInput] = useState("");

    // Persistence: Load active card on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('nava_active_card');
            if (saved) {
                const card = initialCards.find(c => c.id === saved);
                if (card) setSelectedCard(card);
            }
        }
    }, []);

    // Handle Card Selection
    const handleCardSelect = (card: typeof initialCards[0] | null) => {
        setSelectedCard(card);
        if (card) {
            localStorage.setItem('nava_active_card', card.id);
        } else {
            localStorage.removeItem('nava_active_card');
        }
    };

    // Handle Adding Source
    const handleAddSource = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSourceInput.trim()) return;

        const newCard = {
            id: `source-${Date.now()}`,
            title: "New Source",
            icon: FileText,
            color: "text-zinc-400",
            bg: "bg-zinc-800/50",
            border: "border-white/10"
        };
        
        // In a real app, we'd analyze the URL/text to determine type/title
        // For now, we just add a generic source card
        setGridCards(prev => [...prev, newCard]);
        setNewSourceInput("");
        setIsAddingSource(false);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 animate-in fade-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Audio Overview (Wide Card) */}
                <div className="col-span-1 md:col-span-2 row-span-1">
                    <AudioPlayer />
                </div>

                {/* Other Cards */}
                {gridCards.map((card) => (
                    <motion.div
                        key={card.id}
                        layoutId={card.id}
                        onClick={() => handleCardSelect(card)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            relative h-48 rounded-3xl p-6 border ${card.border} ${card.bg} backdrop-blur-sm
                            flex flex-col justify-between cursor-pointer group transition-all duration-300
                            hover:bg-opacity-20 hover:border-opacity-50
                        `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <card.icon className={`w-6 h-6 ${card.color}`} />
                            <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20`}>
                                <span className="text-white text-xs">↗</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div>
                            <h3 className="text-white font-medium text-lg mb-1 group-hover:translate-x-1 transition-transform">{card.title}</h3>
                            <p className="text-white/40 text-xs">Click to view</p>
                        </div>
                        
                        {/* Glow */}
                        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-40 transition-opacity ${card.color.replace('text', 'bg')}`} />
                    </motion.div>
                ))}

                {/* Activity Feed / Generation Status */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8">
                    <h3 className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">System Activity</h3>
                    <div className="bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
                        {[
                            { id: 1, text: "Generating slide deck...", sub: "based on 1 source", icon: Presentation, spin: true },
                            { id: 2, text: "Generating quiz...", sub: "based on 1 source", icon: MessageSquarePlus, spin: true },
                            { id: 3, text: "Safety Zone Thresholds for VLA", sub: "1 source · 1m ago", icon: FileText, spin: false },
                            { id: 4, text: "Generating infographic...", sub: "based on 1 source", icon: PieChart, spin: true },
                            { id: 5, text: "Intrinsic Semantic Safety in VLA Models", sub: "1 source · 3m ago", icon: BrainCircuit, spin: false },
                            { id: 6, text: "Generating Audio Overview...", sub: "Come back in a few minutes", icon: Video, spin: true },
                        ].map((item, i) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${item.spin ? 'animate-pulse' : ''}`}>
                                    <item.icon className="w-4 h-4 text-white/50 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-medium ${item.spin ? 'text-cyan-400' : 'text-white'}`}>{item.text}</h4>
                                    <p className="text-xs text-white/30">{item.sub}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white/20 text-xs px-2 py-1 rounded border border-white/10">View</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Note Card */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-8 flex flex-col items-center justify-center gap-4">
                    {isAddingSource ? (
                        <motion.form 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleAddSource}
                            className="flex items-center gap-2 bg-zinc-900 border border-white/10 rounded-full p-2 pl-6 w-full max-w-lg shadow-xl"
                        >
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Paste URL or type a note..." 
                                className="bg-transparent text-white border-none outline-none w-full placeholder-white/30 text-sm"
                                value={newSourceInput}
                                onChange={(e) => setNewSourceInput(e.target.value)}
                            />
                            <button type="submit" className="bg-white text-black rounded-full px-6 py-2 text-sm font-medium hover:bg-gray-200 transition-colors">
                                Add
                            </button>
                            <button type="button" onClick={() => setIsAddingSource(false)} className="p-2 text-white/50 hover:text-white">
                                <span className="sr-only">Cancel</span>
                                ✕
                            </button>
                        </motion.form>
                    ) : (
                        <button 
                            onClick={() => setIsAddingSource(true)}
                            className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"
                        >
                            <MessageSquarePlus className="w-5 h-5" />
                            Add Note / Source
                        </button>
                    )}
                </div>

            </div>

            {/* EXPANDED OVERLAY */}
            <AnimatePresence>
                {selectedCard && (
                    <StudioOverlay card={selectedCard} onClose={() => handleCardSelect(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
