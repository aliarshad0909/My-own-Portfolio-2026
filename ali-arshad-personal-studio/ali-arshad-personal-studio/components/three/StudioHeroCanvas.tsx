"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Lightweight, ambient React Three Fiber geometric sculpture for the Homepage Hero.
 *
 * Design & performance discipline:
 *  - Pure primitive Three.js geometry (zero external GLB downloads, zero textures).
 *  - Subtle obsidian-and-coral wireframe prism + precision orbital rings gently
 *    responding to pointer movement in the hero's open negative space.
 *  - Always rendered strictly behind hero copy and Ali's portrait (`pointer-events: none`)
 *    and automatically bypassed on mobile viewports, non-WebGL devices, or when
 *    `prefers-reduced-motion: reduce` is enabled.
 */
function StudioSculpture({ pointer }: { pointer: React.MutableRefObject<{ x: number; y: number }> }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringARef = useRef<THREE.Mesh>(null);
  const ringBRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      const targetRx = -0.14 + pointer.current.y * 0.22;
      const targetRy = 0.28 + pointer.current.x * 0.32 + t * 0.08;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRx, dt * 3.2);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRy, dt * 3.2);
      groupRef.current.position.y = Math.sin(t * 0.6) * 0.08;
    }
    if (ringARef.current) {
      ringARef.current.rotation.z = t * 0.14;
    }
    if (ringBRef.current) {
      ringBRef.current.rotation.x = 1.15 + Math.sin(t * 0.35) * 0.12;
      ringBRef.current.rotation.y = -t * 0.11;
    }
  });

  return (
    <group ref={groupRef} position={[0.45, 0.05, 0]}>
      {/* Inner faceted obsidian core */}
      <mesh>
        <icosahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#151b26" metalness={0.72} roughness={0.34} />
      </mesh>
      {/* Subtle coral structural wireframe */}
      <mesh scale={1.12}>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshBasicMaterial color="#ff7a5c" wireframe transparent opacity={0.24} />
      </mesh>
      {/* Precision orbital ring A */}
      <mesh ref={ringARef} rotation={[1.25, 0.25, 0]}>
        <torusGeometry args={[1.75, 0.012, 12, 96]} />
        <meshBasicMaterial color="#ff947a" transparent opacity={0.34} />
      </mesh>
      {/* Precision orbital ring B */}
      <mesh ref={ringBRef} rotation={[0.5, -0.55, 0.3]}>
        <torusGeometry args={[2.18, 0.008, 12, 96]} />
        <meshBasicMaterial color="#b3bcc9" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

export default function StudioHeroCanvas() {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="hero__r3f" aria-hidden="true">
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 0, 5.4], fov: 40 }}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 4, 4]} intensity={1.35} color="#ff8e73" />
        <directionalLight position={[-4, -2, 3]} intensity={0.55} color="#94a3b8" />
        <StudioSculpture pointer={pointer} />
      </Canvas>
    </div>
  );
}
