"use client";

import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Opt-in Framer Motion wrapper using `LazyMotion` + `domAnimation` (lightweight
 * feature subset) and enforcing `prefers-reduced-motion`. Not mounted in root
 * SiteChrome so initial page loads stay free of motion runtime overhead.
 */
export function StudioMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}

export function MotionReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={{ opacity: 0.92, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.36, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
