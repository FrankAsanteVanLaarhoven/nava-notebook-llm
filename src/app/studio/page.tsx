
"use client";

import StudioGrid from "@/components/studio/StudioGrid";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudioPage() {
    return (
        <main className="min-h-screen bg-black text-white p-4 md:p-8">
            <header className="flex items-center gap-4 mb-8 max-w-7xl mx-auto">
                <Link 
                    href="/" 
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-light tracking-tight">Research Studio</h1>
                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">NavaNotebookLLM // Direct Access</p>
                </div>
            </header>
            
            <StudioGrid />
        </main>
    );
}
