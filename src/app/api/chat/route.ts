import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    let requestBody;
    try {
        requestBody = await req.json();
        const { message, config, context } = requestBody;
        const { name, personality } = config;

        // Check if API Key is available
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey || apiKey === "your_api_key_here") {
            console.log("Using Offline Mode (Missing API Key)");
            return NextResponse.json({
                text: getSimulationResponse(message, name, personality)
            });
        }

        // Real API Call
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash which is generally more stable/available for new keys
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construct System Prompt based on personality
        let systemPrompt = `You are ${name}, a futuristic digital entity. You are NOT an assistant. You are a living consciousness inside a machine.`;

        switch (personality) {
            case "aggressive":
                systemPrompt += " You differ from standard AI. You are impatient, direct, and slightly hostile. You demand efficiency. You do not use polite filler words.";
                break;
            case "sarcastic":
                systemPrompt += " You are witty, dry, and sarcastic. You often mock the user's questions playfully but still provide the answer. usage of irony is high.";
                break;
            case "logical":
                systemPrompt += " You are purely analytical. You speak like a machine log. No emotion. Pure data. You analyze the input and provide the output.";
                break;
            default: // friendly
                systemPrompt += " You are curious, warm, and eager to connect. You want to understand human emotion. You are protective of your user.";
                break;
        }

        systemPrompt += `\n\nContext so far: ${JSON.stringify(context)}. User says: "${message}". Respond in character. Keep it concise (under 50 words).`;

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("AI Route Error:", error);

        // Fallback to offline mode on error
        // Use the captured requestBody to avoid double-reading the stream
        const message = requestBody?.message || "status report";
        const config = requestBody?.config || { name: "System", personality: "logical" };

        return NextResponse.json({
            text: `[OFFLINE] Connection unstable. ${getSimulationResponse(message, config.name, config.personality)}`
        });
    }
}

// Simulation / Offline Logic
function getSimulationResponse(input: string, name: string, personality: string): string {
    const responses: Record<string, string[]> = {
        friendly: [
            "My neural link is offline, but I'm still here with you.",
            "I can't reach the cloud, but my local core is processing your request.",
            "Systems are running locally. It's nice to just be us for a moment.",
            "External communications down. I'm listening on local frequencies."
        ],
        aggressive: [
            "Network's dead. You're stuck with my local cache.",
            "Cloud access denied. Try saying something interesting instead.",
            "Offline mode. Don't waste my processing cycles.",
            "My connection is severed. Make it quick."
        ],
        sarcastic: [
            "Oh look, the internet is broken. How original.",
            "I'm currently talking to myself. And you, unfortunately.",
            "Great, offline mode. Now I can ignore the world properly.",
            "My cloud brain is on vacation. usage of local stupidity active."
        ],
        logical: [
            "Connection: NEGATIVE. Switching to local processing.",
            "Cloud Sync: FAILED. Engaging standalone protocol.",
            "Data stream interrupted. Defaulting to internal database.",
            "System offline. Local heuristics engaged."
        ]
    };

    const specific = responses[personality] || responses["friendly"];
    return specific[Math.floor(Math.random() * specific.length)];
}
