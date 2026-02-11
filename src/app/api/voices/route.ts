import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const apiKey = req.headers.get("xi-api-key") || process.env.ELEVENLABS_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
        }

        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
            method: "GET",
            headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Filter for high quality ones if needed, or return all
        // The user specifically asked for "best human like voices"
        // We will return all, but the frontend can sort/highlight.
        return NextResponse.json(data);

    } catch (error) {
        console.error("Voice Fetch Error:", error);
        return NextResponse.json({ error: "Failed to fetch voices" }, { status: 500 });
    }
}
