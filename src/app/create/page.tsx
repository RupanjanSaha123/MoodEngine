"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./create.module.css";
import HologramOrb from "@/components/HologramOrb/HologramOrb";

type Personality = "friendly" | "aggressive" | "sarcastic" | "logical";
type Visual = "orb" | "humanoid" | "abstract";

interface AIConfig {
  name: string;
  personality: Personality;
  visual: Visual;
}

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<AIConfig>({
    name: "",
    personality: "friendly",
    visual: "orb",
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFinish = () => {
    // Save to local storage for now
    localStorage.setItem("ai_config", JSON.stringify(formData));
    router.push("/dashboard"); // We'll build dashboard next
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`${styles.stepDot} ${
                step === s ? styles.activeDot : step > s ? styles.completedDot : ""
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in">
            <h2 className={styles.title}>Initialize Entity</h2>
            <p className={styles.subtitle}>Give your AI a unique identifier.</p>
            
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter Name (e.g., Nova, Axiom)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                autoFocus
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <button 
                className={`${styles.btn} ${styles.primaryBtn}`}
                onClick={handleNext}
                disabled={!formData.name.trim()}
              >
                Proceed
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in">
            <h2 className={styles.title}>Core Personality</h2>
            <p className={styles.subtitle}>Define how your entity responds.</p>
            
            <div className={styles.grid}>
              <OptionCard
                selected={formData.personality === "friendly"}
                onClick={() => setFormData({ ...formData, personality: "friendly" })}
                emoji="🧘"
                label="Calm"
                desc="Supportive, patient, and clear."
              />
              <OptionCard
                selected={formData.personality === "aggressive"}
                onClick={() => setFormData({ ...formData, personality: "aggressive" })}
                emoji="⚔️"
                label="Aggressive"
                desc="Direct, high energy, no fluff."
              />
              <OptionCard
                selected={formData.personality === "sarcastic"}
                onClick={() => setFormData({ ...formData, personality: "sarcastic" })}
                emoji="😏"
                label="Sarcastic"
                desc="Witty, humorous, and sharp."
              />
              <OptionCard
                selected={formData.personality === "logical"}
                onClick={() => setFormData({ ...formData, personality: "logical" })}
                emoji="🧠"
                label="Logical"
                desc="Pure data. Zero emotion."
              />
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.btn} onClick={handleBack}>
                Back
              </button>
              <button 
                className={`${styles.btn} ${styles.primaryBtn}`}
                onClick={handleNext}
              >
                Confirm Logic
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in">
            <h2 className={styles.title}>Visual Form</h2>
            <p className={styles.subtitle}>Choose how your entity manifests.</p>
            
            <div className={styles.grid} style={{ gridTemplateColumns: '1fr' }}>
              <div 
                className={`${styles.optionCard} ${formData.visual === "orb" ? styles.selectedCard : ""}`}
                onClick={() => setFormData({ ...formData, visual: "orb" })}
                style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '1rem 2rem' }}
              >
                <div>
                  <div className={styles.label}>Hologram Orb</div>
                  <div className={styles.desc}>Standard core processor viz.</div>
                </div>
                {/* Mini preview */}
                <div style={{ transform: 'scale(0.3)', width: '60px', height: '60px' }}>
                  <HologramOrb />
                </div>
              </div>
              
              <OptionCard
                selected={formData.visual === "humanoid"}
                onClick={() => setFormData({ ...formData, visual: "humanoid" })}
                emoji="👤"
                label="Humanoid"
                desc="Advanced particle cloud entity."
              />
              
              <OptionCard
                selected={formData.visual === "abstract"}
                onClick={() => setFormData({ ...formData, visual: "abstract" })}
                emoji="✨"
                label="Abstract Light"
                desc="Minimalist energy field."
              />
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.btn} onClick={handleBack}>
                Back
              </button>
              <button 
                className={`${styles.btn} ${styles.primaryBtn}`}
                onClick={handleFinish}
              >
                Awaken Entity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({ selected, onClick, emoji, label, desc }: any) {
  return (
    <div 
      className={`${styles.optionCard} ${selected ? styles.selectedCard : ""}`}
      onClick={onClick}
    >
      <div className={styles.emoji}>{emoji}</div>
      <div className={styles.label}>{label}</div>
      <div className={styles.desc}>{desc}</div>
    </div>
  );
}
