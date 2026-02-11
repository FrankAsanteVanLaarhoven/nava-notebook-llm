
import React, { useState, useEffect } from 'react';
import { X, Key, Mic, Activity, ChevronRight, Zap } from 'lucide-react'; // Added icons
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: VoiceSettings) => void;
    initialSettings: VoiceSettings;
}

export type VoiceSettings = {
    provider: 'browser' | 'openai' | 'elevenlabs';
    openaiKey?: string;
    openaiVoice?: string;
    elevenLabsKey?: string;
    elevenLabsVoiceId?: string;
    openRouterKey?: string;
};

interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    labels?: {
        gender?: string;
        accent?: string;
        age?: string;
    };
}

// --- Subcomponents for Clean Architecture ---

function ElevenLabsSettings({ settings, setSettings }: { settings: VoiceSettings, setSettings: (s: VoiceSettings) => void }) {
    const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'male' | 'female'>('all');

    const fetchVoices = React.useCallback(async () => {
        if (!settings.elevenLabsKey) return;
        setLoading(true);
        try {
            const res = await fetch('/api/voices', {
                headers: { 'xi-api-key': settings.elevenLabsKey }
            });
            const data = await res.json();
            if (data.voices) {
                setVoices(data.voices);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [settings.elevenLabsKey]);

    useEffect(() => {
        if (settings.elevenLabsKey && voices.length === 0) {
            fetchVoices();
        }
    }, [settings.elevenLabsKey, voices.length, fetchVoices]);

    const filteredVoices = voices.filter(v => {
        if (filter === 'all') return true;
        return v.labels?.gender === filter;
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-2"
        >
            {/* API Key Input */}
            <div className="space-y-2 group">
                <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono flex items-center gap-2 group-focus-within:text-cyan-400 transition-colors">
                    <Key className="w-3 h-3" /> ElevenLabs API Key
                </label>
                <div className="flex gap-0 border-b border-white/10 group-focus-within:border-cyan-500/50 transition-colors relative">
                    <input 
                        type="password" 
                        value={settings.elevenLabsKey || ''}
                        onChange={(e) => setSettings({ ...settings, elevenLabsKey: e.target.value })}
                        placeholder="xi-..."
                        className="flex-1 bg-transparent px-0 py-3 text-white font-mono text-sm focus:outline-none placeholder:text-white/10"
                    />
                    <button 
                        onClick={fetchVoices}
                        disabled={loading}
                        className="px-4 py-2 text-[10px] font-mono tracking-wider hover:text-cyan-300 disabled:opacity-50 text-white/40 uppercase transition-colors"
                    >
                        {loading ? 'SYNCING...' : 'SYNC VOICES'}
                    </button>
                    {/* Animated underline */}
                    <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-cyan-400 group-focus-within:w-full transition-all duration-500" />
                </div>
            </div>

            {/* Voice Selection Grid */}
            {voices.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Select Voice Identity</label>
                        <div className="flex gap-4 text-[10px] font-mono">
                             <button onClick={() => setFilter('all')} className={`${filter === 'all' ? 'text-cyan-400' : 'text-white/30 hover:text-white'} transition-colors`}>ALL</button>
                             <button onClick={() => setFilter('male')} className={`${filter === 'male' ? 'text-cyan-400' : 'text-white/30 hover:text-white'} transition-colors`}>MALE</button>
                             <button onClick={() => setFilter('female')} className={`${filter === 'female' ? 'text-cyan-400' : 'text-white/30 hover:text-white'} transition-colors`}>FEMALE</button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {filteredVoices.map(voice => (
                            <button
                                key={voice.voice_id}
                                onClick={() => setSettings({ ...settings, elevenLabsVoiceId: voice.voice_id })}
                                className={`
                                    group flex items-center justify-between p-3 border-l-2 transition-all w-full
                                    ${settings.elevenLabsVoiceId === voice.voice_id 
                                        ? 'bg-white/5 border-cyan-400' 
                                        : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/20'}
                                `}
                            >
                                <div className="text-left">
                                    <div className={`text-xs font-mono tracking-wide ${settings.elevenLabsVoiceId === voice.voice_id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                                        {voice.name.toUpperCase()}
                                    </div>
                                    <div className="text-[9px] text-white/20 font-mono mt-0.5 flex gap-2">
                                        <span>{voice.labels?.accent?.toUpperCase() || 'UNKNOWN'}</span>
                                        <span>//</span>
                                        <span>{voice.labels?.age?.toUpperCase() || 'ADULT'}</span>
                                    </div>
                                </div>
                                {settings.elevenLabsVoiceId === voice.voice_id && (
                                    <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// --- Main Component ---

export default function SettingsModal({ isOpen, onClose, onSave, initialSettings }: SettingsModalProps) {
    const [settings, setSettings] = useState<VoiceSettings>(initialSettings);
    const [activeTab, setActiveTab] = useState<'voice' | 'llm'>('voice');

    // Reset settings if modal opens/initialSettings change
    useEffect(() => {
        if (isOpen) {
            setSettings(initialSettings);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                className="w-full max-w-xl bg-black/40 border border-white/10 rounded-none shadow-2xl overflow-hidden relative"
                style={{
                    boxShadow: '0 0 40px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.05)'
                }}
            >
                {/* Decorative Elements (Sci-Fi) */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40" />
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="space-y-1">
                        <h2 className="text-lg font-mono font-medium text-white tracking-widest uppercase flex items-center gap-3">
                            <Zap className="w-4 h-4 text-cyan-500" />
                            System Configuration
                        </h2>
                        <div className="h-[1px] w-24 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex h-[450px]">
                    {/* Sidebar Tabs */}
                    <div className="w-48 border-r border-white/5 bg-white/[0.01] flex flex-col pt-6">
                        {[
                            { id: 'voice', label: 'VOICE SYNTHESIS', icon: Mic },
                            { id: 'llm', label: 'INTELLIGENCE', icon: Activity },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`
                                    w-full text-left px-6 py-4 text-[10px] font-mono tracking-widest transition-all relative
                                    flex items-center gap-3 group
                                    ${activeTab === tab.id ? 'text-white bg-white/5' : 'text-white/30 hover:text-white/60'}
                                `}
                            >
                                <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? 'text-cyan-400' : 'group-hover:text-white'}`} />
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-gradient-to-br from-black/20 to-transparent">
                        
                        <AnimatePresence mode='wait'>
                            {activeTab === 'llm' && (
                                <motion.div 
                                    key="llm"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2 group">
                                            <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono flex items-center gap-2">
                                                <Key className="w-3 h-3" /> OpenRouter Access Token
                                            </label>
                                            <div className="flex gap-0 border-b border-white/10 group-focus-within:border-cyan-500/50 transition-colors relative">
                                                <input 
                                                    type="password" 
                                                    value={settings.openRouterKey || ''}
                                                    onChange={(e) => setSettings({ ...settings, openRouterKey: e.target.value })}
                                                    placeholder="sk-or-v1-..."
                                                    className="w-full bg-transparent px-0 py-3 text-white font-mono text-sm focus:outline-none placeholder:text-white/10"
                                                />
                                                <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-cyan-400 group-focus-within:w-full transition-all duration-500" />
                                            </div>
                                            <p className="text-[9px] text-white/20 font-mono pl-1 border-l border-white/10">
                                                REQUIRED FOR FLUX ENGINE INTENT PARSING. TARGETING GEMINI PRO 1.5.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'voice' && (
                                <motion.div 
                                    key="voice"
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="space-y-8"
                                >
                                    {/* Provider Selector - Horizontal Pill */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] text-white/30 uppercase tracking-widest font-mono">Audio Backend Provider</label>
                                        <div className="flex gap-2">
                                            {['browser', 'openai', 'elevenlabs'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => setSettings({ ...settings, provider: p as any })}
                                                    className={`
                                                        px-4 py-2 text-[10px] font-mono tracking-wider uppercase border transition-all relative overflow-hidden
                                                        ${settings.provider === p 
                                                            ? 'border-cyan-500/50 text-white bg-cyan-500/10 shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)]' 
                                                            : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}
                                                    `}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Provider Specific Settings */}
                                    <div className="pt-2 border-t border-white/5">
                                        {settings.provider === 'openai' && (
                                            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
                                                <div className="space-y-2 group">
                                                    <label className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono flex items-center gap-2">
                                                        <Key className="w-3 h-3" /> OpenAI Secret Key
                                                    </label>
                                                    <div className="border-b border-white/10 group-focus-within:border-cyan-500/50 transition-colors relative">
                                                        <input 
                                                            type="password" 
                                                            value={settings.openaiKey || ''}
                                                            onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                                                            placeholder="sk-..."
                                                            className="w-full bg-transparent px-0 py-3 text-white font-mono text-sm focus:outline-none placeholder:text-white/10"
                                                        />
                                                        <div className="absolute bottom-[-1px] left-0 w-0 h-[1px] bg-cyan-400 group-focus-within:w-full transition-all duration-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {settings.provider === 'elevenlabs' && (
                                            <ElevenLabsSettings settings={settings} setSettings={setSettings} />
                                        )}
                                        
                                        {settings.provider === 'browser' && (
                                            <div className="p-4 border border-white/5 bg-white/[0.02] flex items-start gap-3 mt-4">
                                                <div className="w-1 h-full bg-emerald-500/50 rounded-full" />
                                                <div>
                                                    <h4 className="text-xs font-mono text-emerald-400 mb-1">LOCAL SYNTHESIS ACTIVE</h4>
                                                    <p className="text-[10px] text-white/40 font-mono leading-relaxed">
                                                        Using device native text-to-speech. Zero latency. No API key required.
                                                        Quality dependent on operating system.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-4 border-t border-white/5 flex justify-end bg-black/20">
                    <button 
                        onClick={handleSave}
                        className="
                            group flex items-center gap-3 px-6 py-3 
                            bg-white text-black hover:bg-cyan-400 transition-colors
                            text-xs font-bold tracking-widest uppercase font-mono
                        "
                    >
                        Save Configuration
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </motion.div>
        </div>
    );
}
