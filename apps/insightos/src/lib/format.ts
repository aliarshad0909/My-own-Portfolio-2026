export function formatMetricValue(value: number, fieldName?: string): string {
  if (!Number.isFinite(value)) return "0";
  const lower = (fieldName || "").toLowerCase();
  if (lower.includes("pct") || lower.includes("rate") || lower.includes("margin") || lower.includes("churn")) {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  }
  if (
    lower.includes("usd") ||
    lower.includes("revenue") ||
    lower.includes("spend") ||
    lower.includes("ebitda") ||
    lower.includes("mrr") ||
    lower.includes("value") ||
    lower.includes("cac") ||
    lower.includes("deal_size") ||
    lower.includes("expense")
  ) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
    }).format(value);
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatFieldLabel(field: string): string {
  return field
    .replace(/_usd$/i, " (USD)")
    .replace(/_pct$/i, " (%)")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function formatCategoryBadge(category: string): string {
  const labels: Record<string, string> = {
    sales: "Sales",
    marketing: "Marketing",
    inventory: "Inventory",
    financial: "Financial",
    customer: "Customer",
    custom: "Custom CSV",
  };
  return labels[category] || category;
}
