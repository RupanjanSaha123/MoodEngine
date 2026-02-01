"use client";

import { useState, useEffect, useCallback } from "react";

export function useTTS() {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        // Function to load and set voices
        const loadVoices = () => {
            const vs = window.speechSynthesis.getVoices();
            setVoices(vs);
        };

        // Initial load
        loadVoices();

        // Event listener for when voices are loaded/changed
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const speak = useCallback((text: string, personality?: string) => {
        if (!enabled || !window.speechSynthesis) return;

        // Cancel any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Select voice based on personality or default to a "system" sounding one
        // Microsoft Zira or Google US English are usually good common ones
        const preferredVoice = voices.find(v =>
            v.name.includes("Zira") || // Windows
            v.name.includes("Google US English") || // Chrome
            v.name.includes("Samantha") // Mac
        );

        if (preferredVoice) utterance.voice = preferredVoice;

        // Adjust pitch/rate based on personality
        if (personality === "aggressive") {
            utterance.rate = 1.2;
            utterance.pitch = 0.8;
        } else if (personality === "sarcastic") {
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
        } else if (personality === "logical") {
            utterance.rate = 1.1;
            utterance.pitch = 0.5; // Robotic
        } else {
            // Friendly/Default
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
        }

        window.speechSynthesis.speak(utterance);
    }, [voices, enabled]);

    const toggle = () => setEnabled(!enabled);

    return { speak, toggle, enabled };
}
