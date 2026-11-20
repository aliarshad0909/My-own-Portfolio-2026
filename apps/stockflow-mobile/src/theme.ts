export const colors = {
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  ink: "#0f172a",
  inkSecondary: "#475569",
  inkMuted: "#64748b",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  primary: "#059669",
  primaryDark: "#047857",
  primarySoft: "#ecfdf5",
  primaryBorder: "#a7f3d0",
  navy: "#0f172a",
  navyLight: "#1e293b",
  amber: "#d97706",
  amberSoft: "#fffbeb",
  amberBorder: "#fde68a",
  danger: "#dc2626",
  dangerSoft: "#fef2f2",
  dangerBorder: "#fecaca",
  blue: "#2563eb",
  blueSoft: "#eff6ff",
  blueBorder: "#bfdbfe",
  white: "#ffffff",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

