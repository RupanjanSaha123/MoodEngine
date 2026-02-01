import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, config, context } = await req.json();
        const { name, personality } = config;

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

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Safety check for API Key
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                text: "I cannot process this. My neural link (API KEY) is missing. Please configure it in the terminal."
            });
        }

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ text: "Neural interference detected. (Error connecting to AI)" });
    }
}
