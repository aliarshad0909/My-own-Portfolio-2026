import type { ReactNode } from "react";

/**
 * Editorial placeholder. Visible in development only, so missing content is
 * obvious while editing but never shown to visitors in production.
 */
export function EditorNote({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <p className="editor-note">
      <strong>Editor note (not shown in production):</strong> {children}
    </p>
  );
}
