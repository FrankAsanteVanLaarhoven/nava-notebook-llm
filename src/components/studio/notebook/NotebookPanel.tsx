"use client";

import React, { useState, useEffect } from 'react';
import { Code, FileText, Play, Trash2, Plus, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { multiLanguageExecutionService, SupportedLanguage } from '../../../services/multi-language-execution-service';

type CellLanguage = 'vnc' | 'rust' | 'python' | 'sql' | 'javascript' | 'typescript' | 'bash' | 'html' | 'css' | 'json';

interface NotebookCell {
    id: string;
    type: 'code' | 'markdown';
    language: CellLanguage;
    content: string;
    output?: string;
    isExecuting?: boolean;
    metadata?: {
        executionCount?: number;
        lastExecuted?: Date;
    };
}

const languageOptions: { value: CellLanguage; label: string; icon: string; color: string }[] = [
    { value: 'vnc', label: 'NAVΛ (VNC)', icon: '⋋', color: 'text-emerald-400' },
    { value: 'python', label: 'Python', icon: '🐍', color: 'text-yellow-400' },
    { value: 'rust', label: 'Rust', icon: '🦀', color: 'text-orange-400' },
    { value: 'sql', label: 'SQL', icon: '🗄️', color: 'text-blue-400' },
    { value: 'javascript', label: 'JavaScript', icon: 'JS', color: 'text-yellow-300' },
    { value: 'typescript', label: 'TypeScript', icon: 'TS', color: 'text-blue-400' },
    { value: 'bash', label: 'Bash', icon: '💻', color: 'text-gray-400' },
    { value: 'html', label: 'HTML', icon: '🌐', color: 'text-orange-500' },
    { value: 'css', label: 'CSS', icon: '🎨', color: 'text-blue-300' },
    { value: 'json', label: 'JSON', icon: '{}', color: 'text-gray-300' },
];

export default function NotebookPanel() {
    const [cells, setCells] = useState<NotebookCell[]>([
        {
            id: '1',
            type: 'markdown',
            language: 'vnc',
            content: '# NAVΛ Studio Notebook\n\nInteractive multi-language computational notebook powered by **Flux Engine**.\n\n**Supported Languages:** VNC, Rust, Python, SQL, JavaScript, TypeScript, Bash',
        },
        {
            id: '2',
            type: 'code',
            language: 'python',
            content: 'import numpy as np\nimport matplotlib.pyplot as plt\n\n# Generate navigation data\npoints = np.random.rand(10, 2)\nprint(f"Generated {len(points)} navigation points")',
            output: '',
            metadata: { executionCount: 0 },
        },
    ]);

    const [activeCell, setActiveCell] = useState<string | null>(null);
    const [showLanguageMenu, setShowLanguageMenu] = useState<string | null>(null);

    // Initial Pyodide Load Check
    useEffect(() => {
        // Can optionally trigger warm-up here
    }, []);

    const addCell = (type: 'code' | 'markdown', language: CellLanguage = 'python') => {
        const newCell: NotebookCell = {
            id: Date.now().toString(),
            type,
            language,
            content: '',
            metadata: type === 'code' ? { executionCount: 0 } : undefined,
        };
        setCells([...cells, newCell]);
        setActiveCell(newCell.id);
    };

    const insertCellAfter = (afterId: string, type: 'code' | 'markdown', language: CellLanguage = 'python') => {
        const index = cells.findIndex(c => c.id === afterId);
        const newCell: NotebookCell = {
            id: Date.now().toString(),
            type,
            language,
            content: '',
            metadata: type === 'code' ? { executionCount: 0 } : undefined,
        };
        const newCells = [...cells];
        newCells.splice(index + 1, 0, newCell);
        setCells(newCells);
        setActiveCell(newCell.id);
    };

    const updateCell = (id: string, content: string) => {
        setCells(cells.map(cell =>
            cell.id === id ? { ...cell, content } : cell
        ));
    };

    const changeCellLanguage = (id: string, language: CellLanguage) => {
        setCells(cells.map(cell =>
            cell.id === id ? { ...cell, language } : cell
        ));
        setShowLanguageMenu(null);
    };

    const deleteCell = (id: string) => {
        setCells(cells.filter(cell => cell.id !== id));
    };

    const executeCell = async (id: string) => {
        const cell = cells.find(c => c.id === id);
        if (!cell || cell.type !== 'code') return;

        setCells(prev => prev.map(c =>
            c.id === id ? { ...c, isExecuting: true } : c
        ));

        const executionCount = (cell.metadata?.executionCount || 0) + 1;

        try {
            let lang: SupportedLanguage = cell.language as SupportedLanguage;
            if ((lang as string) === 'vnc') lang = 'navlambda';

            const result = await multiLanguageExecutionService.executeCode(
                lang as SupportedLanguage,
                cell.content
            );

            // Process Output
            let output = '';
            if (result.outputs) {
                // If we get an image, display execution count but handle rich output differently if we had a renderer
                // For now, text representation
                output = result.outputs.map(o => {
                    if (o.output_type === 'stream') return o.text;
                    if (o.output_type === 'execute_result' || o.output_type === 'display_data') {
                        return o.data?.['text/plain'] || JSON.stringify(o.data, null, 2);
                    }
                    if (o.output_type === 'error') return `${o.ename}: ${o.evalue}\n${o.traceback?.join('\n')}`;
                    return '';
                }).join('\n');
            }

            setCells(prev => prev.map(c =>
                c.id === id
                    ? {
                        ...c,
                        isExecuting: false,
                        output: output || (result.success ? '✓ Executed successfully' : 'Execution failed'),
                        metadata: {
                            executionCount: result.execution_count || executionCount,
                            lastExecuted: new Date()
                        }
                    }
                    : c
            ));
        } catch (error: any) {
            setCells(prev => prev.map(c =>
                c.id === id
                    ? {
                        ...c,
                        isExecuting: false,
                        output: `Execution Error: ${error.message || String(error)}`,
                        metadata: {
                            executionCount,
                            lastExecuted: new Date()
                        }
                    }
                    : c
            ));
        }
    };

    const executeAllCells = async () => {
        for (const cell of cells) {
            if (cell.type === 'code') {
                await executeCell(cell.id);
            }
        }
    };

    const getLanguageInfo = (lang: CellLanguage) => {
        return languageOptions.find(l => l.value === lang) || languageOptions[0];
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-white font-sans">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-2xl mr-2">📓</span>
                    <h2 className="text-lg font-light text-white/80">Interactive Notebook</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => addCell('code', 'python')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-sm text-white/80 transition-colors border border-white/5"
                    >
                        <Code className="w-4 h-4" />
                        Code
                    </button>
                    <button
                        onClick={() => addCell('markdown')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-sm text-white/80 transition-colors border border-white/5"
                    >
                        <FileText className="w-4 h-4" />
                        Text
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <button
                        onClick={executeAllCells}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-full text-sm transition-colors border border-emerald-500/20"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Run All
                    </button>
                </div>
            </div>

            {/* Cells Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 scroll-smooth">
                <AnimatePresence>
                    {cells.map((cell, index) => {
                        const langInfo = getLanguageInfo(cell.language);
                        const isCode = cell.type === 'code';
                        const isActive = activeCell === cell.id;

                        return (
                            <motion.div
                                key={cell.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setActiveCell(cell.id)}
                                className={`
                                    group relative rounded-xl border transition-all duration-300
                                    ${isActive
                                        ? 'bg-zinc-900/80 border-cyan-500/30 ring-1 ring-cyan-500/10 shadow-lg shadow-cyan-900/5'
                                        : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/50 hover:border-white/10'
                                    }
                                `}
                            >
                                {/* Drag Handle / Number (Gutter) */}
                                <div className="absolute left-0 top-0 bottom-0 w-12 hidden md:flex flex-col items-center py-4 border-r border-white/5 bg-black/20 rounded-l-xl text-xs font-mono text-white/20 select-none">
                                    {isCode ? `[${cell.metadata?.executionCount || ' '}]` : ''}
                                </div>

                                <div className="md:ml-12 p-4">
                                    {/* Cell Header Actions (Hover) */}
                                    <div className="flex justify-between items-start mb-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2">
                                            {isCode && (
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowLanguageMenu(showLanguageMenu === cell.id ? null : cell.id);
                                                        }}
                                                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs font-medium text-white/70 transition-colors"
                                                    >
                                                        <span>{langInfo.icon}</span>
                                                        <span>{langInfo.label}</span>
                                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                                    </button>
                                                    {showLanguageMenu === cell.id && (
                                                        <div className="absolute py-1 top-full left-0 mt-1 w-40 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                                                            {languageOptions.map(opt => (
                                                                <button
                                                                    key={opt.value}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        changeCellLanguage(cell.id, opt.value);
                                                                    }}
                                                                    className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 flex items-center gap-2 ${opt.value === cell.language ? 'text-cyan-400 bg-white/5' : 'text-white/70'}`}
                                                                >
                                                                    <span>{opt.icon}</span>
                                                                    {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!isCode && (
                                                <span className="text-xs font-mono text-white/30 uppercase tracking-widest px-2">Markdown</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {isCode && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        executeCell(cell.id);
                                                    }}
                                                    disabled={cell.isExecuting}
                                                    className={`p-1.5 rounded-md transition-colors ${cell.isExecuting ? 'text-cyan-400 animate-spin' : 'text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                                                    title="Run Cell"
                                                >
                                                    {cell.isExecuting ? <RefreshCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    insertCellAfter(cell.id, 'code', cell.language);
                                                }}
                                                className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Add Cell Below"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCell(cell.id);
                                                }}
                                                className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Delete Cell"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Editor Area */}
                                    <div className={`relative rounded-lg overflow-hidden ${isActive ? 'bg-black/30' : 'bg-transparent'}`}>
                                        <textarea
                                            value={cell.content}
                                            onChange={(e) => updateCell(cell.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.shiftKey && e.key === 'Enter' && isCode) {
                                                    e.preventDefault();
                                                    executeCell(cell.id);
                                                }
                                            }}
                                            placeholder={isCode ? `Enter ${langInfo.label} code...` : "Type markdown here..."}
                                            className={`
                                                w-full bg-transparent border-none outline-none p-3 font-mono text-sm resize-y min-h-[4rem]
                                                ${isCode ? langInfo.color : 'text-zinc-300'}
                                                placeholder-white/20
                                            `}
                                            spellCheck={false}
                                        />
                                    </div>

                                    {/* Output Area */}
                                    {cell.output && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="mt-4 pt-4 border-t border-white/5 font-mono text-sm"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs text-white/30 uppercase tracking-wider">Output</span>
                                            </div>
                                            <pre className="whitespace-pre-wrap text-white/80 bg-black/20 p-4 rounded-lg overflow-x-auto">
                                                {cell.output}
                                            </pre>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {/* Empty State / Add CTA */}
                {cells.length === 0 && (
                     <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <Code className="w-12 h-12 mb-4 opacity-50" />
                        <p className="mb-4">Notebook is empty</p>
                        <button 
                            onClick={() => addCell('code')}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white text-sm"
                        >
                            Start Coding
                        </button>
                     </div>
                )}
                
                <div className="h-20" /> {/* Spacer */}
            </div>
        </div>
    );
}
