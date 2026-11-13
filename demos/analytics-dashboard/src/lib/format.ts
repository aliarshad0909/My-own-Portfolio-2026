export const money = (cents: number, compact = false): string => {
  const v = cents / 100;
  if (compact && Math.abs(v) >= 1000) {
    const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
    for (const [n, s] of units) if (Math.abs(v) >= n) return `$${(v / n).toFixed(Math.abs(v / n) >= 100 ? 0 : 1)}${s}`;
  }
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const number = (n: number) => n.toLocaleString("en-US");

export const percent = (n: number | null) => (n === null ? "—" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`);

export const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const monthLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
