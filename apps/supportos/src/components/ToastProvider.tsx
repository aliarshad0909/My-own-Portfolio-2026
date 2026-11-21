"use client";

import { CheckCircle2, Info, X, AlertCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  pushToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-3), { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.kind === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : toast.kind === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {toast.kind === "error" ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            ) : toast.kind === "info" ? (
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            )}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-current/60 hover:bg-black/5 hover:text-current"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
