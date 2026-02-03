"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import HologramOrb from "@/components/HologramOrb/HologramOrb";
import { Mic, Send, Activity, Brain, Check, List, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Network, Video, StopCircle } from "lucide-react";
import { useMemory } from "@/hooks/useMemory";
import { useTTS } from "@/hooks/useTTS";
import dynamic from "next/dynamic";

const HumanoidCanvas = dynamic(() => import("@/components/Humanoid/HumanoidCanvas"), { ssr: false });

interface AIConfig {
  name: string;
  personality: "friendly" | "aggressive" | "sarcastic" | "logical";
  visual: string;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { memory, addTask, toggleTask, removeTask, user } = useMemory();
  const { speak, toggle: toggleVoice, enabled: voiceEnabled } = useTTS();
  
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  
  // Screen Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Mood State
  const [mood, setMood] = useState(80); // 0-100
  const [energy, setEnergy] = useState(65); // 0-100

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load config
    const stored = localStorage.getItem("ai_config");
    if (!stored) {
      router.push("/create");
      return;
    }
    const parsed = JSON.parse(stored);
    setConfig(parsed);

    // Welcome message
    const welcome = getWelcomeMessage(parsed.name, parsed.personality);
    setMessages([{
      id: "init",
      text: welcome,
      sender: "ai",
      timestamp: Date.now()
    }]);
    
    // Speak welcome message slightly delayed to ensure voices loaded
    setTimeout(() => speak(welcome, parsed.personality), 500);

    // Init Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), text, sender: "user", timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Simulate AI Processing & API Call
    const aiId = (Date.now() + 1).toString();
    
    if (!config) return;

    // Check for local commands first (faster)
    const localResponse = checkLocalCommands(text, config);
    if (localResponse) {
        setTimeout(() => {
             const aiMsg: Message = { id: aiId, text: localResponse, sender: "ai", timestamp: Date.now() };
             setMessages(prev => [...prev, aiMsg]);
             speak(localResponse, config?.personality);
             updateStats();
        }, 500);
        return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          config: config,
          context: messages.filter(m => m.id !== "init").slice(-5) // Send last 5 contextual messages
        })
      });

      const data = await res.json();
      const aiMsg: Message = { id: aiId, text: data.text, sender: "ai", timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      speak(data.text, config?.personality);
      updateStats();

    } catch (e) {
      const errorMsg = "Connection lost. I cannot reach the cloud.";
      setMessages(prev => [...prev, { id: aiId, text: errorMsg, sender: "ai", timestamp: Date.now() }]);
      speak(errorMsg);
    }
  };

  const updateStats = () => {
      setMood(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
      setEnergy(prev => Math.min(100, Math.max(0, prev + (Math.random() * 10 - 5))));
  };

  const checkLocalCommands = (input: string, cfg: AIConfig) => {
    const lower = input.toLowerCase();

    // -- COMMAND PARSING --

    // Note/Task
    if (lower.startsWith("note:") || lower.startsWith("remind me to") || lower.startsWith("add task")) {
      const content = input.replace(/^(note:|remind me to|add task)/i, "").trim();
      addTask(content, "task");
      setIsTaskPanelOpen(true); // Auto-open panel
      return `Saved to memory: "${content}"`;
    }

    // Goal
    if (lower.includes("goal:")) {
      const content = input.replace(/goal:/i, "").trim();
      addTask(content, "goal");
      setIsTaskPanelOpen(true);
      return `Goal set: "${content}". Focus engaged.`;
    }

    // Open/Close Tasks
    if (lower.includes("show tasks") || lower.includes("open memory")) {
      setIsTaskPanelOpen(true);
      return "Accessing memory banks.";
    }
    if (lower.includes("hide tasks")) {
      setIsTaskPanelOpen(false);
      return "Minimizing data streams.";
    }

    return null; // No local command found, proceed to LLM
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' } as any,
        audio: true
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `recording-${Date.now()}.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        // Stop all tracks to clear the recording icon
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Handle user stopping via browser UI
      stream.getVideoTracks()[0].onended = () => {
         if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
         }
      };

    } catch (err) {
      console.error("Error starting recording:", err);
      // Fallback or notification could go here
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  if (!config) return null;

  return (
    <div className={styles.dashboard}>
      {/* Side Panel (Left) */}
      <div className={styles.sidePanel}>
        <div className={styles.marker}>
          <Brain size={16} />
          <span>SYS.ONLINE</span>
        </div>
        
        <div className={styles.entityInfo}>
          <h1 className={styles.entityName}>{config.name}</h1>
          <div className={styles.entityType}>
            Personality: <span style={{ color: 'var(--neon-purple)' }}>{config.personality}</span>
          </div>
        </div>

        <div className={styles.statGroup}>
          <div className={styles.statLabel}>
            <span>SYNC RATE</span>
            <span>{Math.round(mood)}%</span>
          </div>
          <div className={styles.barContainer}>
            <div className={styles.barFill} style={{ width: `${mood}%` }}></div>
          </div>
        </div>

        <div className={styles.statGroup}>
          <div className={styles.statLabel}>
            <span>CPU LOAD</span>
            <span>{Math.round(energy)}%</span>
          </div>
          <div className={styles.barContainer}>
            <div className={styles.barFill} style={{ width: `${energy}%`, background: 'var(--neon-blue)' }}></div>
          </div>
        </div>
        
        {/* Neural Link / Login */}
        <div style={{ marginTop: 'auto', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: 0.8 }} onClick={() => !user && router.push('/login')}>
           <Network size={16} color={user ? "var(--neon-cyan)" : "var(--neon-purple)"} />
           <span style={{ fontSize: '0.8rem', color: user ? "var(--neon-cyan)" : "var(--neon-purple)" }}>
             {user ? "NEURAL LINK ACTIVE" : "CONNECT NEURAL LINK"}
           </span>
        </div>
        
        {/* Voice Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: 0.7 }} onClick={toggleVoice}>
          {voiceEnabled ? <Volume2 size={20} color="var(--neon-cyan)" /> : <VolumeX size={20} color="var(--text-dim)" />}
          <span style={{ fontSize: '0.8rem', color: voiceEnabled ? 'var(--neon-cyan)' : 'var(--text-dim)' }}>
             VOICE MODULE {voiceEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Main Stage */}
      <div className={styles.mainArea}>
        <div className={styles.hologramStage}>
          <div style={{ transform: `scale(${0.8 + (energy/200)})`, transition: 'transform 1s', width: '100%', height: '100%' }}>
            {config.visual === "humanoid" ? (
              <HumanoidCanvas energy={energy} mood={mood} />
            ) : (
              <HologramOrb />
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={styles.inputArea}>
          <div className={styles.chatDisplay}>
            {messages.map(m => (
              <div key={m.id} className={`${styles.message} ${m.sender === 'user' ? styles.userMsg : styles.aiMsg}`}>
                {m.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.controls}>
            <button 
              className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
              onClick={toggleMic}
            >
              {isListening ? <Activity size={20} /> : <Mic size={20} />}
            </button>

            <button
               className={`${styles.micBtn} ${isRecording ? styles.recording : ''}`}
               onClick={isRecording ? stopRecording : startRecording}
               title={isRecording ? "Stop Recording" : "Record Screen"}
               style={isRecording ? { background: 'rgba(255, 0, 60, 0.2)', borderColor: 'var(--neon-red)' } : {}}
            >
               {isRecording ? <StopCircle size={20} color="var(--neon-red)" /> : <Video size={20} />}
            </button>
            
            <input
              className={styles.textInput}
              placeholder="Type or speak... (Try 'Remind me to...')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            />
            
            <button 
              className={styles.micBtn}
              onClick={() => handleSend(input)}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Task Panel (Right) */}
      <div className={`${styles.taskPanel} ${!isTaskPanelOpen ? styles.closed : ''}`}>
        
        <div className={styles.toggleBtn} onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)}>
          {isTaskPanelOpen ? <ChevronRight /> : <ChevronLeft />}
        </div>

        <div className={styles.panelHeader}>
          <div className={styles.panelTitle}>
            <List size={20} />
            MEMORY CORES
          </div>
        </div>

        <div className={styles.taskList}>
          {memory.tasks.length === 0 && (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '2rem' }}>
              No active protocols.
            </div>
          )}
          {memory.tasks.map(task => (
             <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
               <div 
                 className={`${styles.checkbox} ${task.completed ? styles.checked : ''}`}
                 onClick={() => toggleTask(task.id)}
               >
                 {task.completed && <Check size={12} strokeWidth={4} color="black" />}
               </div>
               <div className={styles.taskContent}>
                 {task.content}
                 <span className={styles.taskType}>{task.type}</span>
               </div>
               <button onClick={() => removeTask(task.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                 <X size={14} />
               </button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getWelcomeMessage(name: string, personality: string) {
  switch (personality) {
    case "aggressive": return `${name} online. What do you want?`;
    case "sarcastic": return `${name} here. Try not to bore me.`;
    case "logical": return `${name} initialized. Systems normal.`;
    default: return `Hello! I am ${name}. How are you feeling today?`;
  }
}
