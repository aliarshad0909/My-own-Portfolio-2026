import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio Admin Console",
  description: "Private operations console for Ali Arshad Personal Studio.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="adm-root">{children}</div>;
}
