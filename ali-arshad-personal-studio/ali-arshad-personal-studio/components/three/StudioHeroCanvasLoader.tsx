"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";

const LazyStudioHeroCanvas = dynamic(() => import("@/components/three/StudioHeroCanvas"), {
  ssr: false,
  loading: () => null,
});

class WebGLErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Progressive-enhancement loader for the single Homepage Hero React Three Fiber element.
 * Mounts only after hydration on desktop viewports when WebGL is supported and
 * `prefers-reduced-motion: reduce` is NOT active. Falls back silently to the
 * existing CSS obsidian-and-coral `.hero__accent` backdrop.
 */
export function StudioHeroCanvasLoader() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wideEnough = window.matchMedia("(min-width: 960px)").matches;
    if (!reduceMotion && wideEnough && supportsWebGL()) {
      const id = window.setTimeout(() => setEnabled(true), 120);
      return () => window.clearTimeout(id);
    }
  }, []);

  if (!enabled) return null;

  return (
    <WebGLErrorBoundary>
      <LazyStudioHeroCanvas />
    </WebGLErrorBoundary>
  );
}
