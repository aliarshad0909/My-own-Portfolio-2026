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
    const wideEnough = window.matchMedia("(min-width: 1024px)").matches;
    if (reduceMotion || !wideEnough || !supportsWebGL()) return;

    let cancelled = false;
    let activated = false;
    let timerId: number | undefined;

    const activate = () => {
      if (cancelled || activated) return;
      activated = true;
      window.removeEventListener("pointermove", activate);
      window.removeEventListener("scroll", activate);
      setEnabled(true);
    };

    const arm = () => {
      // Load Three.js only on first desktop interaction or well after LCP/TBT settles.
      window.addEventListener("pointermove", activate, { once: true, passive: true });
      window.addEventListener("scroll", activate, { once: true, passive: true });
      timerId = window.setTimeout(activate, 3500);
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", arm);
      window.removeEventListener("pointermove", activate);
      window.removeEventListener("scroll", activate);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  if (!enabled) return null;

  return (
    <WebGLErrorBoundary>
      <LazyStudioHeroCanvas />
    </WebGLErrorBoundary>
  );
}
