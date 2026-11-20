"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

const ToastContext = createContext<{ toast: (message: string, kind?: ToastKind) => void }>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm shadow-lg ${
              item.kind === "error"
                ? "border-red-200 bg-red-50 text-red-900"
                : item.kind === "info"
                  ? "border-teal-200 bg-teal-50 text-teal-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {item.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            ) : item.kind === "info" ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span className="flex-1 leading-snug font-medium">{item.message}</span>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== item.id))}
              aria-label="Dismiss notification"
              className="rounded p-0.5 opacity-60 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

