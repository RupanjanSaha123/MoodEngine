"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface Task {
    id: string;
    content: string;
    type: "task" | "note" | "goal";
    completed: boolean;
    createdAt: number;
}

export interface Memory {
    tasks: Task[];
    userFacts: Record<string, string>;
    lastInteraction: number;
}

const DEFAULT_MEMORY: Memory = {
    tasks: [],
    userFacts: {},
    lastInteraction: Date.now(),
};

export function useMemory() {
    const [memory, setMemory] = useState<Memory>(DEFAULT_MEMORY);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Initial Load & Auth Check
    useEffect(() => {
        const init = async () => {
            // Check Auth
            if (supabase) {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);

                if (session?.user) {
                    await fetchCloudMemory(session.user.id);
                } else {
                    loadLocalMemory();
                }
            } else {
                loadLocalMemory();
            }
            setLoading(false);
        };

        const { data: authListener } = supabase?.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                await fetchCloudMemory(session.user.id);
            } else {
                loadLocalMemory();
            }
        }) || { data: null };

        init();

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const loadLocalMemory = () => {
        const stored = localStorage.getItem("ai_memory");
        if (stored) {
            setMemory(JSON.parse(stored));
        }
    };

    const fetchCloudMemory = async (userId: string) => {
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setMemory(prev => ({
                    ...prev,
                    tasks: data.map(d => ({
                        id: d.id,
                        content: d.content,
                        type: d.type as any,
                        completed: d.completed,
                        createdAt: new Date(d.created_at).getTime()
                    }))
                }));
            }
        } catch (e) {
            console.error("Cloud fetch failed", e);
        }
    };

    const addTask = async (content: string, type: "task" | "note" | "goal") => {
        // Optimistic UI
        const tempId = Date.now().toString();
        const newTask: Task = {
            id: tempId,
            content,
            type,
            completed: false,
            createdAt: Date.now(),
        };

        setMemory((prev) => ({
            ...prev,
            tasks: [newTask, ...prev.tasks],
        }));

        if (user && supabase) {
            try {
                const { data, error } = await supabase.from('tasks').insert({
                    user_id: user.id,
                    content,
                    type
                }).select().single();

                if (data) {
                    // Replace temp ID with real ID
                    setMemory(prev => ({
                        ...prev,
                        tasks: prev.tasks.map(t => t.id === tempId ? { ...t, id: data.id } : t)
                    }));
                }
            } catch (e) { console.error(e); }
        } else {
            // Local Save
            const current = JSON.parse(localStorage.getItem("ai_memory") || JSON.stringify(DEFAULT_MEMORY));
            current.tasks = [newTask, ...current.tasks];
            localStorage.setItem("ai_memory", JSON.stringify(current));
        }
        return newTask;
    };

    const toggleTask = async (id: string) => {
        const task = memory.tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = !task.completed;

        setMemory((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) =>
                t.id === id ? { ...t, completed: newStatus } : t
            ),
        }));

        if (user && supabase) {
            try {
                await supabase.from('tasks').update({ completed: newStatus }).eq('id', id);
            } catch (e) { console.error(e); }
        } else {
            const current = JSON.parse(localStorage.getItem("ai_memory") || JSON.stringify(DEFAULT_MEMORY));
            if (current.tasks) {
                current.tasks = current.tasks.map((t: Task) => t.id === id ? { ...t, completed: newStatus } : t);
                localStorage.setItem("ai_memory", JSON.stringify(current));
            }
        }
    };

    const removeTask = async (id: string) => {
        setMemory((prev) => ({
            ...prev,
            tasks: prev.tasks.filter((t) => t.id !== id),
        }));

        if (user && supabase) {
            try {
                await supabase.from('tasks').delete().eq('id', id);
            } catch (e) { console.error(e); }
        } else {
            const current = JSON.parse(localStorage.getItem("ai_memory") || JSON.stringify(DEFAULT_MEMORY));
            if (current.tasks) {
                current.tasks = current.tasks.filter((t: Task) => t.id !== id);
                localStorage.setItem("ai_memory", JSON.stringify(current));
            }
        }
    };

    return { memory, addTask, toggleTask, removeTask, loading, user };
}
