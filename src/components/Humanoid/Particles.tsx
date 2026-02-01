"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Particles({ energy, mood }: { energy: number; mood: number }) {
  // Create a mesh reference
  const mesh = useRef<THREE.Points>(null!);
  
  // Generate random particles
  const count = 2000;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 1.5 + (Math.random() * 0.5); // Radius variation
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const speed = 0.1 + (energy / 100) * 0.5; // Faster if high energy
    
    // Rotate the whole cloud
    mesh.current.rotation.y = time * speed * 0.5;
    
    // Pulse effect scale
    const scale = 1 + Math.sin(time * 2) * 0.05 * (energy / 50);
    mesh.current.scale.set(scale, scale, scale);
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]} 
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={mood > 50 ? "#00f3ff" : "#ff003c"}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}
