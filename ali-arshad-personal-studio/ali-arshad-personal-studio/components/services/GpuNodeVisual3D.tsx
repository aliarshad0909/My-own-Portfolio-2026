"use client";

import { useState, type PointerEvent } from "react";

/**
 * Selective, ultra-lightweight CSS 3D visual emblem for the RTX GPU Compute service.
 * Pure CSS perspective (<2 KB JS, zero Three.js/WebGL cost), static fallback on
 * mobile viewports and under `prefers-reduced-motion: reduce`.
 * Never displays invented hardware specs or live telemetry.
 */
export function GpuNodeVisual3D() {
  const [tilt, setTilt] = useState({ rx: -6, ry: 8 });

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: Number((-y * 14).toFixed(2)), ry: Number((x * 18).toFixed(2)) });
  }

  function onPointerLeave() {
    setTilt({ rx: -6, ry: 8 });
  }

  return (
    <div
      className="gpu-node3d"
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="gpu-node3d__stage"
        style={{
          transform: `perspective(920px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <div className="gpu-node3d__layer gpu-node3d__layer--back">
          <span className="gpu-node3d__tag">03 · CAPACITY CHECK &amp; QUOTE</span>
        </div>
        <div className="gpu-node3d__layer gpu-node3d__layer--mid">
          <span className="gpu-node3d__tag">02 · TECHNICAL FIT MEETING</span>
        </div>
        <div className="gpu-node3d__layer gpu-node3d__layer--front">
          <span className="gpu-node3d__dot" />
          <span className="gpu-node3d__tag">01 · CONSULTATION-LED RTX COMPUTE</span>
          <strong className="gpu-node3d__title">Scoped Hourly Allocation</strong>
          <span className="gpu-node3d__sub">AI Inference · Model Testing · Cycles 3D Rendering</span>
        </div>
      </div>
    </div>
  );
}
