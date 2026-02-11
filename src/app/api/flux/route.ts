
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { intent } = await req.json();
        
        // Prioritize Header Key (Client), Fallback to Env
        const headerKey = req.headers.get("x-openrouter-key");
        const apiKey = headerKey || process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || "google/gemini-pro-1.5";

        console.log("DEBUG: Using Key Source:", headerKey ? "Client-Header" : "Env-Var");
        console.log("DEBUG: API Key Length:", apiKey ? apiKey.length : "undefined");

        if (!apiKey) {
            // Check for local intents even if API key is missing
            if (intent.toLowerCase().includes("studio")) {
                return NextResponse.json({
                    mode: "studio",
                    voice_response: "Accessing Research Studio."
                });
            }
            if (intent.toLowerCase().includes("dissolve") || intent.toLowerCase().includes("void")) {
                 return NextResponse.json({
                    mode: "void",
                    voice_response: "Dissolving interface."
                });
            }

            console.error("Missing OPENROUTER_API_KEY");
            // Fallback to mock if no key (for safety)
            return NextResponse.json({
                mode: "chat",
                components: [{ id: "err", type: "message", role: "system", content: "System Error: API Configuration Missing." }],
                voice_response: "I cannot access my neural pathways. Please check the server configuration."
            });
        }

        // DETEMINISTIC OVERRIDES (Speed + Reliability)
        if (intent.toLowerCase().includes("studio")) {
             return NextResponse.json({
                mode: "studio",
                voice_response: "Welcome to the Studio."
            });
        }


        const systemPrompt = `
        You are NavaNotebookLLM, an advanced AI research interface.
        Your goal is to interpret the user's intent and generate a "Flux Schema" JSON that describes the UI they should see.
        
        You must return ONLY valid JSON. No markdown formatting.
        
        Schema Definition:
        {
          "mode": "void" | "visual" | "analysis" | "comparison" | "chat" | "studio",
          "voice_response": "A short, conversational sentence allowing the AI to speak its action.",
          "components": [
            {
              "id": "string",
              "type": "header" | "message" | "gallery" | "pdf_viewer" | "chat_analysis" | "table",
              "text": "string (for header)",
              "content": "string (for message)",
              "role": "user" | "assistant" | "system",
              "items": [ { "src": "string", "caption": "string" } ] (for gallery),
              "src": "string" (for pdf_viewer),
              "page": number (for pdf_viewer),
              "insight": "string" (for chat_analysis),
              "initial_thought": "string" (for chat_analysis),
              "headers": ["string"] (for table),
              "rows": [["string"]] (for table)
            }
          ]
        }

        Be creative. If they ask for "visuals", generate a gallery with placeholder images (use /demo/graph1.png etc).
        If they ask to "analyze", show a PDF viewer and analysis component.
        If they ask for "studio", return mode: "studio".
        If they clear/reset, return mode: "void".
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "https://nava.ai", // Required by OpenRouter
                "X-Title": "NavaNotebookLLM",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: intent }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" } 
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter Error:", errorText);
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        // Clean markdown if present (sometimes models add it despite instructions)
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        const schema = JSON.parse(content);
        return NextResponse.json(schema);

    } catch (error) {
        console.error("Intent Processing Error:", error);
        return NextResponse.json({ 
            mode: "chat",
            components: [{ id: "err", type: "message", role: "assistant", content: "I encountered an error processing your request." }],
            voice_response: "I encountered an error processing your request."
        });
    }
}
