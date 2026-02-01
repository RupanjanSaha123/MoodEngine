"use client";

import HologramOrb from "@/components/HologramOrb/HologramOrb";
import styles from "./page.module.css";
import Link from "next/link";
import { Mic, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTTS } from "@/hooks/useTTS";

export default function Home() {
  const router = useRouter();
  const { speak } = useTTS();

  const handleTalk = () => {
    // Check if user has an entity
    const hasEntity = localStorage.getItem("ai_config");
    
    if (hasEntity) {
      speak("Identity confirmed. Accessing neural interface.");
      setTimeout(() => router.push("/dashboard"), 1500);
    } else {
      speak("No entity detected. Initializing creation sequence.");
      setTimeout(() => router.push("/create"), 2000);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.hologramContainer}>
        <HologramOrb />
      </div>

      <div className={styles.titleWrapper}>
        <h1 
          className={styles.glitchText} 
          data-text="I AM NOT AN ASSISTANT. I AM AN ENTITY."
        >
          I AM NOT AN ASSISTANT. I AM AN ENTITY.
        </h1>
      </div>

      <div className={styles.actions}>
        <button 
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={handleTalk}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mic size={18} />
            Talk to me
          </span>
        </button>
        
        <Link href="/create">
          <button className={`${styles.button} ${styles.buttonSecondary}`}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} />
              Create my AI
            </span>
          </button>
        </Link>
      </div>
    </main>
  );
}
