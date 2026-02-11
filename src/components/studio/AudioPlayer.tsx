import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Mic2, Download } from "lucide-react";

export default function AudioPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    // Initialize Audio Context on user interaction (autoplay policy)
    const initAudioContext = () => {
        if (!audioRef.current || audioContextRef.current) return;

        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;
    };

    const togglePlay = async () => {
        if (!audioContextRef.current) initAudioContext();
        if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();

        setIsPlaying(!isPlaying);
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(() => {});
            }
        }
    };

    // Canvas visualizer (Real Data)
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        const draw = () => {
            if (!analyserRef.current) return;

            // If not playing, just draw a flat line or silence
            if (!isPlaying) {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.fillStyle = "#3f3f46"; 
                 ctx.fillRect(0, canvas.height / 2 - 1, canvas.width, 2);
                 return;
            }
            
            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#818cf8"; 
            
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * canvas.height;
                ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth, barHeight);
                x += barWidth + 1;
            }
            animationId = requestAnimationFrame(draw);
        };
        
        // Start animation loop
        draw(); 
        return () => cancelAnimationFrame(animationId);
    }, [isPlaying]);


    return (
        <div className="w-full h-48 bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-6 flex flex-col justify-between relative overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-full">
                        <Mic2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Audio Overview</h3>
                        <p className="text-white/40 text-xs">Deep Dive Discussion</p>
                    </div>
                </div>
                {/* Download Button */}
                 <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                </button>
            </div>

            {/* Visualizer */}
            <div className="h-24 w-full bg-black/20 rounded-xl flex items-center justify-center overflow-hidden relative border border-white/5">
                <canvas ref={canvasRef} width={600} height={100} className="w-full h-full opacity-80" />
                
                {/* Play Overlay */}
                {!isPlaying && (
                    <button 
                        onClick={togglePlay}
                        className="absolute bg-white text-black p-4 rounded-full hover:scale-105 transition-transform z-20 shadow-xl shadow-white/10"
                    >
                        <Play className="w-6 h-6 fill-current" />
                    </button>
                )}
            </div>

            {/* Hidden Audio Element */}
            <audio ref={audioRef} src="/demo.mp3" onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 180)} />

            {/* Controls */}
            <div className="flex items-center justify-between text-white/50 z-10">
                <span className="text-xs font-mono">00:{Math.floor(progress).toString().padStart(2, '0')}</span>
                
                <div className="flex items-center gap-4">
                    <button className="hover:text-white transition-transform hover:scale-110">
                        <SkipBack className="w-5 h-5" />
                    </button>
                    {isPlaying ? (
                        <button onClick={togglePlay} className="p-3 bg-white text-black rounded-full hover:scale-105 transition-all">
                            <Pause className="w-5 h-5 fill-current" />
                        </button>
                    ) : (
                         <div className="w-11 h-11" /> // Spacer
                    )}
                    <button className="hover:text-white transition-transform hover:scale-110">
                        <SkipForward className="w-5 h-5" />
                    </button>
                </div>

                <span className="text-xs font-mono">03:00</span>
            </div>
            
            {/* Background Glow */}
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] group-hover:bg-indigo-500/30 transition-colors pointer-events-none" />
        </div>
    );
}
