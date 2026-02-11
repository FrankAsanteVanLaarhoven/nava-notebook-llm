
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, provider, apiKey, voiceId } = await req.json();

        if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

        // --- OPENAI TTS ---
        if (provider === 'openai') {
            if (!apiKey) return NextResponse.json({ error: "OpenAI API Key required" }, { status: 401 });

            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text,
                    voice: 'alloy', // Default, can be configurable
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                return NextResponse.json({ error: `OpenAI Error: ${err}` }, { status: response.status });
            }

            const audioBuffer = await response.arrayBuffer();
            return new NextResponse(audioBuffer, {
                headers: { 'Content-Type': 'audio/mpeg' },
            });
        }

        // --- ELEVENLABS TTS ---
        if (provider === 'elevenlabs') {
            if (!apiKey || !voiceId) return NextResponse.json({ error: "ElevenLabs Key and Voice ID required" }, { status: 401 });

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                }),
            });

            if (!response.ok) {
                const err = await response.text();
                return NextResponse.json({ error: `ElevenLabs Error: ${err}` }, { status: response.status });
            }

            const audioBuffer = await response.arrayBuffer();
            return new NextResponse(audioBuffer, {
                headers: { 'Content-Type': 'audio/mpeg' },
            });
        }

        return NextResponse.json({ error: "Invalid Provider" }, { status: 400 });

    } catch (error) {
        console.error("TTS Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
