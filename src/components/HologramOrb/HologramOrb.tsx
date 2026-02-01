"use client";

import styles from "./HologramOrb.module.css";
import React from "react";

export default function HologramOrb() {
  return (
    <div className={styles.container}>
      <div className={styles.orbCore}></div>
      <div className={`${styles.ring} ${styles.ring1}`}></div>
      <div className={`${styles.ring} ${styles.ring2}`}></div>
      <div className={`${styles.ring} ${styles.ring3}`}></div>
      <div className={styles.glitchLine}></div>
    </div>
  );
}
