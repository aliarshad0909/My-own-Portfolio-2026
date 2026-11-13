import type { Channel, Order, Product, Region } from "../lib/types.ts";

/**
 * Deterministic synthetic dataset. Same seed, same numbers, every run —
 * so screenshots, tests and the dashboard always agree.
 *
 * This is INVENTED DATA for a demonstration. It is not any real company's
 * trading history, and the figures should not be read as benchmarks.
 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const CHANNELS: Channel[] = ["Direct", "Marketplace", "Wholesale", "Retail partner", "Subscription"];
const CHANNEL_WEIGHT = [0.3, 0.26, 0.18, 0.16, 0.1];
const REGIONS: Region[] = ["West", "Midwest", "South", "Northeast", "Canada", "International"];
const REGION_WEIGHT = [0.24, 0.18, 0.2, 0.19, 0.11, 0.08];

const CATALOGUE: [name: string, category: string, price: number, cost: number][] = [
  ["Aster Desk Lamp", "Lighting", 8900, 3400],
  ["Brio Floor Lamp", "Lighting", 18900, 7600],
  ["Cove Wall Sconce", "Lighting", 11900, 4800],
  ["Dune Table Lamp", "Lighting", 9900, 4100],
  ["Ember Shelf Unit", "Storage", 24900, 11200],
  ["Flint Storage Box", "Storage", 3900, 1500],
  ["Grove Bookcase", "Storage", 32900, 15400],
  ["Haven Drawer Set", "Storage", 17900, 8300],
  ["Iris Side Table", "Furniture", 21900, 9900],
  ["Juniper Stool", "Furniture", 12900, 5600],
  ["Kite Coffee Table", "Furniture", 38900, 18700],
  ["Larch Bench", "Furniture", 29900, 14100],
  ["Moss Planter Large", "Garden", 6900, 2600],
  ["Nettle Planter Set", "Garden", 10900, 4300],
  ["Olive Trellis", "Garden", 7900, 3100],
  ["Pine Watering Can", "Garden", 4900, 1800],
  ["Quartz Mirror", "Decor", 15900, 6900],
  ["Reed Basket", "Decor", 5900, 2200],
  ["Slate Tray", "Decor", 3400, 1200],
  ["Thistle Throw", "Decor", 8900, 3600],
  ["Umber Rug 5x7", "Decor", 42900, 20800],
  ["Vine Hook Rail", "Storage", 4400, 1600],
  ["Willow Chair", "Furniture", 34900, 16900],
  ["Yarrow Cushion", "Decor", 4900, 1900],
];

const pick = <T,>(items: T[], weights: number[], r: number): T => {
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += weights[i];
    if (r < acc) return items[i];
  }
  return items[items.length - 1];
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** The dataset ends on this fixed day so the demo never drifts. */
export const DATA_END = "2026-06-30";
export const DATA_START = "2025-01-01";

export function buildDataset(): { products: Product[]; orders: Order[] } {
  const rand = rng(20260630);
  const products: Product[] = CATALOGUE.map(([name, category, unitPrice, unitCost], i) => ({
    id: `sku-${String(i + 1).padStart(3, "0")}`,
    name,
    category,
    unitPrice,
    unitCost,
    onHand: 20 + Math.floor(rand() * 420),
  }));

  const orders: Order[] = [];
  const seen = new Set<string>();
  const start = new Date(`${DATA_START}T00:00:00Z`);
  const end = new Date(`${DATA_END}T00:00:00Z`);
  let n = 0;

  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = iso(d);
    const day = d.getUTCDay();
    const monthIndex = (d.getUTCFullYear() - 2025) * 12 + d.getUTCMonth();
    // Gentle growth, a weekly rhythm and a Q4 lift — shaped like a real business.
    const growth = 1 + monthIndex * 0.035;
    const weekly = day === 0 || day === 6 ? 0.62 : day === 2 || day === 3 ? 1.12 : 1;
    const seasonal = d.getUTCMonth() === 10 || d.getUTCMonth() === 11 ? 1.55 : d.getUTCMonth() === 0 ? 0.78 : 1;
    const count = Math.max(1, Math.round((7 + rand() * 7) * growth * weekly * seasonal));

    for (let i = 0; i < count; i++) {
      const product = products[Math.floor(rand() * products.length)];
      const units = 1 + Math.floor(rand() * (product.unitPrice > 25000 ? 2 : 4));
      const channel = pick(CHANNELS, CHANNEL_WEIGHT, rand());
      // Wholesale buys more units at a lower price; subscription is steady and small.
      const discount = channel === "Wholesale" ? 0.72 : channel === "Marketplace" ? 0.94 : channel === "Subscription" ? 0.9 : 1;
      const qty = channel === "Wholesale" ? units * 4 : units;
      // The customer base grows over time, so new customers keep appearing
      // instead of all being created in the first weeks.
      const pool = 240 + monthIndex * 85;
      const returning = rand() < 0.55;
      const customerId = `c-${returning ? Math.floor(rand() * Math.max(1, pool - 85)) : Math.floor(rand() * pool)}`;
      const isNewCustomer = !seen.has(customerId);
      seen.add(customerId);
      orders.push({
        id: `ord-${String(++n).padStart(6, "0")}`,
        date,
        productId: product.id,
        units: qty,
        revenue: Math.round(product.unitPrice * qty * discount),
        channel,
        region: pick(REGIONS, REGION_WEIGHT, rand()),
        customerId,
        isNewCustomer,
      });
    }
  }
  return { products, orders };
}
