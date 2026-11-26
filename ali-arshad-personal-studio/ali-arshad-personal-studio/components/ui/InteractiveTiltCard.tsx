"use client";

import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  label?: string;
  maxTilt?: number;
};

/**
 * Selective, ultra-lightweight CSS 3D tilt card (<2 KB JS, zero WebGL cost).
 * Supports mouse pointer tracking, touch tap feedback, and keyboard arrow tilt,
 * while automatically staying flat under `prefers-reduced-motion: reduce`.
 */
export function InteractiveTiltCard({ children, className = "", label, maxTilt = 7 }: Props) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: Number(((0.5 - py) * maxTilt * 2).toFixed(2)),
      ry: Number(((px - 0.5) * maxTilt * 2).toFixed(2)),
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
      active: true,
    });
  }

  function reset() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setTilt((t) => ({ ...t, ry: -maxTilt, active: true }));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setTilt((t) => ({ ...t, ry: maxTilt, active: true }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setTilt((t) => ({ ...t, rx: maxTilt, active: true }));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setTilt((t) => ({ ...t, rx: -maxTilt, active: true }));
    } else if (e.key === "Escape") {
      reset();
    }
  }

  return (
    <div
      className={`tilt3d ${tilt.active ? "is-active" : ""} ${className}`.trim()}
      tabIndex={0}
      role="region"
      aria-label={label ?? "Interactive studio preview card"}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      onFocus={() => setTilt((t) => ({ ...t, rx: 2.5, ry: -3, active: true }))}
      onBlur={reset}
      onKeyDown={onKeyDown}
      style={
        {
          "--tilt-rx": `${tilt.rx}deg`,
          "--tilt-ry": `${tilt.ry}deg`,
          "--tilt-gx": `${tilt.gx}%`,
          "--tilt-gy": `${tilt.gy}%`,
        } as React.CSSProperties
      }
    >
      <div className="tilt3d__inner">{children}</div>
    </div>
  );
}
