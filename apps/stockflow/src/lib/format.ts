export const PRODUCT_CATEGORIES = [
  "Audio Gear",
  "Electronics",
  "Packaging & Supplies",
  "Warehouse Hardware",
  "Home & Lifestyle",
  "General",
] as const;

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

export function formatShortDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

