"use client";

import { useState, type PointerEvent } from "react";

/**
 * Selective, ultra-lightweight interactive 3D studio prism emblem.
 * Uses pure CSS 3D perspective transforms (<2 KB JS, zero Three.js bundle bloat),
 * degrades cleanly to a crisp static architectural mark on mobile/touch, and
 * disables motion automatically under `prefers-reduced-motion: reduce`.
 */
export function StudioEmblem3D() {
  const [tilt, setTilt] = useState({ rx: -6, ry: 8 });

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: Number((-y * 16).toFixed(2)), ry: Number((x * 20).toFixed(2)) });
  }

  function onPointerLeave() {
    setTilt({ rx: -6, ry: 8 });
  }

  return (
    <div
      className="emblem3d"
      aria-hidden="true"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        className="emblem3d__stage"
        style={{
          transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <div className="emblem3d__layer emblem3d__layer--back">
          <span className="emblem3d__tag">03 · CREATIVE &amp; MOTION</span>
          <span className="emblem3d__sub">Video · 3D · Brand Systems</span>
        </div>
        <div className="emblem3d__layer emblem3d__layer--mid">
          <span className="emblem3d__tag">02 · AI &amp; ANALYTICS</span>
          <span className="emblem3d__sub">n8n Workflows · Agents · BI</span>
        </div>
        <div className="emblem3d__layer emblem3d__layer--front">
          <span className="emblem3d__dot" />
          <span className="emblem3d__tag">01 · WEB &amp; SOFTWARE</span>
          <strong className="emblem3d__title">One Studio Architecture</strong>
          <span className="emblem3d__sub">Next.js · TypeScript · PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}
