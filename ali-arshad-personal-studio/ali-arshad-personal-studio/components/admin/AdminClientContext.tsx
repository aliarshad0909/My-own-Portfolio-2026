"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AdminSessionPublic } from "@/lib/admin/types";

type AdminContextValue = {
  session: AdminSessionPublic;
  adminFetch: (input: string, init?: RequestInit) => Promise<Response>;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminClientProvider({
  session,
  children,
}: {
  session: AdminSessionPublic;
  children: ReactNode;
}) {
  const router = useRouter();

  const adminFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      const method = (init.method ?? "GET").toUpperCase();
      if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        headers.set("x-csrf-token", session.csrfToken);
        if (init.body && !headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
      }

      const res = await fetch(input, {
        ...init,
        headers,
        cache: "no-store",
        credentials: "same-origin",
      });

      if (res.status === 401) {
        router.replace("/admin/login?expired=1");
      }
      return res;
    },
    [router, session.csrfToken],
  );

  return <AdminContext.Provider value={{ session, adminFetch }}>{children}</AdminContext.Provider>;
}

export function useAdminClient(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdminClient must be used inside AdminClientProvider.");
  return ctx;
}
