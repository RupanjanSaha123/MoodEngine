"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Particles } from "./Particles";
import { Suspense } from "react";

export default function HumanoidCanvas({ energy, mood }: { energy: number; mood: number }) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Suspense fallback={null}>
          <Particles energy={energy} mood={mood} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate speed={0.5} />
      </Canvas>
    </div>
  );
}
