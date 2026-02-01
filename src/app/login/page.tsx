"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./login.module.css";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
        setMessage("Neural Link (Supabase) not configured.");
        setLoading(false);
        return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setMessage(`Connection Failed: ${error.message}`);
    } else {
      setMessage("Neural Link Request Sent. Check your comms (email) to confirm identity.");
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.card}>
        <h1 className={styles.title}>NEURAL LINK</h1>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="ENTER PRIMARY EMAIL"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "ESTABLISHING..." : "INITIATE LINK"}
          </button>
        </form>

        {message && (
          <div style={{ marginTop: "1.5rem", color: message.includes("Failed") ? "#ff003c" : "#00f3ff" }}>
            {message}
          </div>
        )}

        <a onClick={() => router.push("/")} className={styles.backLink}>
          ABORT SEQUENCE
        </a>
      </div>
    </div>
  );
}
