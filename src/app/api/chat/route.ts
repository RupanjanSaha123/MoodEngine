import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message, config, context } = await req.json();
        const { name, personality } = config;

        // Use environment variable for security
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ text: "Error: GEMINI_API_KEY is missing in .env.local" });
        }

        // Real API Call
        const genAI = new GoogleGenerativeAI(apiKey);

        let model;
        let result;

        try {
            // Attempt 1: gemini-1.5-flash (Standard, fast)
            model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
            console.log("Primary model failed, retrying with fallback...");
            // Attempt 2: gemini-pro (Classic, widely available)
            model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Simplified prompt for fallback
            let systemPrompt = `You are ${name}. Input: "${message}".`;
            result = await model.generateContent(systemPrompt);
        }

        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("API Error:", error.message);

        if (error.message.includes("404")) {
            return NextResponse.json({
                text: "[SYSTEM_MSG] Error: Model not found. Please ensure 'Generative Language API' is ENABLED in your Google Cloud Console."
            });
        }

        return NextResponse.json({
            text: `[SYSTEM_MSG] Connection Error: ${error.message}`
        });
    }
}
