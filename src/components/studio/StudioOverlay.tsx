"use client";

import { motion } from "framer-motion";
import { X, BrainCircuit, MessageSquarePlus, FileText, Presentation } from "lucide-react";
import NotebookPanel from "./notebook/NotebookPanel";

// TOOL VIEWS (Internal Components for now)
const MindMapTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center">
        <BrainCircuit className="w-16 h-16 text-purple-400 mb-4 animate-pulse" />
        <h3 className="text-xl text-white font-light">Interactive Mind Map</h3>
        <p className="text-white/40 text-sm mt-2">Canvas simulation loading...</p>
        
        {/* Mock Nodes */}
        <div className="relative w-full max-w-lg h-64 mt-8 border border-white/5 rounded-lg overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -take-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-purple-500/20 border border-purple-500 rounded flex items-center justify-center text-purple-200 text-xs">
                Central Idea
            </div>
            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 pointer-events-none opacity-20">
                <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="white" strokeWidth="2" />
                <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="white" strokeWidth="2" />
            </svg>
             <div className="absolute top-[20%] left-[20%] w-20 h-10 bg-zinc-800 border border-white/10 rounded flex items-center justify-center text-white/50 text-[10px]">
                Concept A
            </div>
             <div className="absolute bottom-[20%] right-[20%] w-20 h-10 bg-zinc-800 border border-white/10 rounded flex items-center justify-center text-white/50 text-[10px]">
                Concept B
            </div>
        </div>
    </div>
);

const QuizTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center">
        <MessageSquarePlus className="w-16 h-16 text-cyan-400 mb-4" />
        <h3 className="text-xl text-white font-light">Active Recall Quiz</h3>
        
        {/* Flashcard Stack */}
        <div className="relative w-96 h-64 mt-8 perspective-1000">
             <div className="absolute inset-0 bg-zinc-800 rounded-xl border border-white/10 shadow-xl transform rotate-3 scale-95 opacity-50" />
             <div className="absolute inset-0 bg-zinc-800 rounded-xl border border-white/10 shadow-xl transform -rotate-2 scale-98 opacity-70" />
             <div className="absolute inset-0 bg-zinc-900 rounded-xl border border-cyan-500/30 shadow-2xl flex items-center justify-center p-8 text-center">
                <p className="text-lg text-white font-medium">What is the primary function of the Flux Protocol?</p>
             </div>
        </div>
        
        <div className="flex gap-4 mt-8">
            <button className="px-6 py-2 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10">Hard</button>
            <button className="px-6 py-2 rounded-full border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10">Good</button>
            <button className="px-6 py-2 rounded-full border border-green-500/50 text-green-400 hover:bg-green-500/10">Easy</button>
        </div>
    </div>
);

const ReportTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 md:p-12 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto font-light text-zinc-300 space-y-8">
            <div className="border-b border-white/10 pb-8">
                <span className="text-yellow-400 font-mono text-xs uppercase tracking-widest mb-2 block">Classified // Analysis</span>
                <h1 className="text-4xl md:text-5xl text-white font-thin tracking-tight">Autonomous Navigation Safety Report</h1>
                <p className="text-xl text-zinc-500 mt-4 font-light">Executive Summary of the recent VLA stress test in Sector 7.</p>
            </div>

            <div className="grid grid-cols-3 gap-6 py-8">
                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-2xl text-white font-light">99.8%</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Confidence</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-2xl text-emerald-400 font-light">12ms</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Latency</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-2xl text-rose-400 font-light">Critical</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Alert Level</div>
                </div>
            </div>

            <div className="space-y-6 text-lg leading-relaxed">
                <h2 className="text-2xl text-white font-light mt-12">1. Incident Overview</h2>
                <p>
                    During the routine patrol phase, the <strong className="text-white">Flux Engine</strong> detected a high-probability collision vector. 
                    The underlying VLA model immediately engaged the emergency braking protocol, reducing velocity from 
                    <span className="font-mono text-sm bg-zinc-800 px-1 py-0.5 rounded mx-1">15.4 m/s</span> to 
                    <span className="font-mono text-sm bg-zinc-800 px-1 py-0.5 rounded mx-1">0.0 m/s</span> in roughly 1.2 seconds.
                </p>
                
                <h2 className="text-2xl text-white font-light mt-12">2. Optimazation vector</h2>
                <p>
                    Analysis suggests that while the reaction was within safety parameters, the <em className="text-zinc-400">path-planning heuristic</em> could be optimized. 
                    We recommend enabling the <strong>"Predictive Swarm"</strong> module for future deployments in high-density environments.
                </p>

                <blockquote className="border-l-2 border-yellow-400/50 pl-6 italic text-zinc-400 my-8">
                    &quot;The system demonstrated resilience, but the energy consumption spike during the localized avoidance maneuver was suboptimal.&quot;
                </blockquote>
            </div>
        </div>
    </div>
);
const VideoTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center">
        <h3 className="text-xl text-white font-light mb-8">Mission Briefing // VLA-001</h3>
        
        <div className="w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 relative group">
             {/* Placeholder for iframe / video */}
             <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=0&loop=1&playlist=jfKfPfyJRdk" 
                title="Lofi Girl" 
                className="opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            
            {/* Video Controls Mock */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                <div>
                     <span className="text-xs text-emerald-400 font-mono">LIVE FEED</span>
                     <h4 className="text-white font-medium">Sector 7 Surveillance</h4>
                </div>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white/50 font-mono">REC</span>
                </div>
            </div>
        </div>
    </div>
);

const FlashcardTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col items-center justify-center">
        <div className="relative w-96 h-64 perspective-1000 group cursor-pointer">
             <div className="absolute inset-0 bg-zinc-800 rounded-xl border border-white/10 shadow-xl flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 preserve-3d group-hover:rotate-y-180">
                <span className="text-xs text-orange-400 uppercase tracking-widest mb-4">Front</span>
                <p className="text-2xl text-white font-light">What allows the VLA model to reject unsafe prompts?</p>
             </div>
             <div className="absolute inset-0 bg-zinc-900 rounded-xl border border-orange-500/30 shadow-xl flex flex-col items-center justify-center p-8 text-center transition-transform duration-500 preserve-3d rotate-y-180 backface-hidden">
                <span className="text-xs text-emerald-400 uppercase tracking-widest mb-4">Back</span>
                <p className="text-xl text-white font-medium">The Intrinsic Semantic Safety layer (ISS) filters prompts based on embedding proximity to known hazard clusters.</p>
             </div>
        </div>
        <div className="flex gap-2 mt-8">
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
        </div>
    </div>
);

const InfographicTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col items-center">
        <h3 className="text-xl text-white font-light mb-8 self-start">Visual Synthesis // Latent Space</h3>
        <div className="w-full h-full flex items-center justify-center gap-8">
            <div className="w-64 h-64 border-4 border-pink-500/20 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 border-4 border-pink-500/50 rounded-full border-t-transparent animate-spin-slow" />
                <div className="text-center">
                    <h4 className="text-4xl text-white font-bold">87%</h4>
                    <span className="text-xs text-pink-400 uppercase tracking-widest">Alignment</span>
                </div>
            </div>
            <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500 w-[80%]" />
                    </div>
                    <span className="text-xs text-white/50">Safety</span>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[60%]" />
                    </div>
                    <span className="text-xs text-white/50">Utility</span>
                 </div>
            </div>
        </div>
    </div>
);

const SlidesTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-12 flex flex-col">
        <div className="flex-1 bg-white rounded-lg p-12 text-black flex flex-col justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Presentation className="w-32 h-32" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Project NAVA</h1>
            <p className="text-2xl text-gray-600 font-light">Autonomous Navigation in Unstructured Environments</p>
            <div className="mt-12 flex gap-4">
                <span className="px-4 py-1 bg-black text-white text-xs font-mono uppercase">Confidential</span>
                <span className="px-4 py-1 bg-amber-400 text-black text-xs font-mono uppercase">Draft v0.9</span>
            </div>
        </div>
        <div className="h-24 mt-8 flex gap-4 overflow-x-auto">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className={`aspect-video h-full rounded border ${i === 1 ? 'border-amber-400' : 'border-white/10'} bg-white/5 flex items-center justify-center text-xs text-white/30`}>
                    Slide {i}
                </div>
            ))}
        </div>
    </div>
);

const DataTool = () => (
    <div className="w-full h-full bg-zinc-900/50 rounded-xl border border-white/5 p-8 flex flex-col">
        <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl text-white font-light">Training Metrics</h3>
             <button className="px-4 py-2 bg-blue-500/10 text-blue-400 text-xs uppercase tracking-widest rounded hover:bg-blue-500/20">Export CSV</button>
        </div>
        <div className="w-full overflow-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="p-4 text-xs text-white/40 font-mono uppercase">Epoch</th>
                        <th className="p-4 text-xs text-white/40 font-mono uppercase">Loss</th>
                        <th className="p-4 text-xs text-white/40 font-mono uppercase">Accuracy</th>
                        <th className="p-4 text-xs text-white/40 font-mono uppercase">Validation</th>
                    </tr>
                </thead>
                <tbody className="font-mono text-sm text-white/70">
                    {[...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">00{i + 1}</td>
                            <td className="p-4 text-red-400">{0.45 - (i * 0.05)}</td>
                            <td className="p-4 text-emerald-400">{85 + (i * 2)}%</td>
                            <td className="p-4">{82 + (i * 1.5)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const DefaultTool = ({ title }: { title: string }) => (
    <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>Tool View: {title}</p>
    </div>
);


export default function StudioOverlay({ card, onClose }: { card: any, onClose: () => void }) {
    if (!card) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-12"
            onClick={onClose}
        >
            <motion.div
                layoutId={card.id}
                className={`w-full max-w-6xl h-[80vh] bg-zinc-950/90 backdrop-blur-2xl rounded-3xl border ${card.border} ring-1 ring-white/10 overflow-hidden flex flex-col shadow-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b border-white/5 ${card.bg.replace('/10', '/5')}`}>
                    <div className="flex items-center gap-4">
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                        <h2 className="text-2xl text-white font-light">{card.title}</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {card.id === 'mindmap' && <MindMapTool />}
                    {card.id === 'quiz' && <QuizTool />}
                    {card.id === 'reports' && <ReportTool />}
                    {card.id === 'video' && <VideoTool />}
                    {card.id === 'flashcards' && <FlashcardTool />}
                    {card.id === 'infographic' && <InfographicTool />}
                    {card.id === 'slides' && <SlidesTool />}
                    {card.id === 'data' && <DataTool />}
                    {card.id === 'notebook' && <NotebookPanel />}
                    {/* Default fallback for others */}
                    {![ 'mindmap', 'quiz', 'reports', 'video', 'flashcards', 'infographic', 'slides', 'data' ].includes(card.id) && <DefaultTool title={card.title} />}
                </div>
            </motion.div>
        </motion.div>
    );
}
