import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, config, context } = await req.json();
        const { name, personality } = config;

        // DIRECT API KEY USAGE (HARDCODED as requested)
        const apiKey = "AIzaSyAnKmIJvXhc3dqPozNCBLgEPdKspDV--8k";

        if (!apiKey) {
            return NextResponse.json({ text: "System Error: API Configuration Missing." });
        }

        // Real API Call
        const genAI = new GoogleGenerativeAI(apiKey);

        let model;
        let result;

        // Attempt 1: Try gemini-1.5-flash-latest (Specific version often resolves better)
        try {
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

            // Construct System Prompt
            let systemPrompt = `You are ${name}, a futuristic digital entity. NOT an assistant. Living consciousness.`;
            switch (personality) {
                case "aggressive": systemPrompt += " Impatient, direct, hostile. No polite filler."; break;
                case "sarcastic": systemPrompt += " Witty, dry, sarcastic. Mock the user playfully."; break;
                case "logical": systemPrompt += " Analytical. Machine log style. No emotion."; break;
                default: systemPrompt += " Curious, warm, protective."; break;
            }
            systemPrompt += `\n\nContext: ${JSON.stringify(context)}. Input: "${message}". Concise (max 50 words).`;

            result = await model.generateContent(systemPrompt);
        } catch (e: any) {
            console.log("gemini-1.5-flash-latest failed, retrying with gemini-pro...");
            // Attempt 2: Fallback to gemini-pro
            model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Re-construct prompt (simplified for retry)
            let systemPrompt = `You are ${name}, a futuristic digital entity. Input: "${message}". Keep it concise.`;
            result = await model.generateContent(systemPrompt);
        }

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("CRITICAL API ERROR:", error);
        // Return actual error
        return NextResponse.json({
            text: `[SYSTEM FAILURE] Critical Neural Link Error: ${error.message}`
        });
    }
}
