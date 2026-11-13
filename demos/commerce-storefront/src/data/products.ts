import type { Category, Glaze, Product, Shape, Size } from "../lib/types.ts";

/** All catalogue data is fictional and exists only for this demonstration. */
export const GLAZES: Glaze[] = [
  { id: "oat", name: "Oat", hex: "#E3D5BC" },
  { id: "sage", name: "Sage", hex: "#9DB09A" },
  { id: "clay", name: "Terracotta", hex: "#C2643F" },
  { id: "ink", name: "Ink", hex: "#2E3A44" },
  { id: "sky", name: "Mist Blue", hex: "#A9C0CC" },
  { id: "moss", name: "Moss", hex: "#56704F" },
];

const size = (id: string, label: string, note: string, priceDelta: number): Size => ({ id, label, note, priceDelta });
const ONE: Size[] = [size("one", "One size", "", 0)];
const SML: Size[] = [size("s", "Small", "", 0), size("m", "Medium", "", 800), size("l", "Large", "", 1800)];

type Seed = [name: string, category: Category, shape: Shape, price: number, glazes: string[], sizes: Size[], description: string, details: string[], featured?: boolean];

const SEEDS: Seed[] = [
  ["Morning Mug", "Mugs & Cups", "mug", 2800, ["oat", "sage", "clay", "ink"], [size("s", "10 oz", "", 0), size("l", "14 oz", "", 400)], "A rounded everyday mug with a thumb-rest handle and a satin glaze.", ["Stoneware", "Dishwasher safe", "Holds 10 or 14 oz"], true],
  ["Espresso Cup", "Mugs & Cups", "tumbler", 1600, ["oat", "ink", "sky"], ONE, "A small handleless cup sized for a double shot.", ["Stoneware", "3 oz", "Sold individually"]],
  ["Ridge Tumbler", "Mugs & Cups", "tumbler", 2200, ["sage", "sky", "moss", "oat"], ONE, "A tapered tumbler with a hand-carved ridge for grip.", ["Stoneware", "12 oz", "Microwave safe"], true],
  ["Latte Bowl Cup", "Mugs & Cups", "mug", 3200, ["oat", "clay"], ONE, "A wide, low cup made for milk drinks and soup alike.", ["Stoneware", "16 oz", "Dishwasher safe"]],
  ["Nesting Bowl", "Bowls", "bowl", 2400, ["oat", "sage", "ink", "sky"], SML, "Stackable bowls in three sizes, from pinch bowl to salad bowl.", ["Stoneware", "Nests with other sizes", "Oven safe to 220°C"], true],
  ["Ramen Bowl", "Bowls", "bowl", 3800, ["ink", "clay", "moss"], ONE, "A deep bowl with a wide rim for noodles and broth.", ["Stoneware", "38 oz", "Dishwasher safe"]],
  ["Breakfast Bowl", "Bowls", "bowl", 2600, ["oat", "sky", "sage"], ONE, "The right depth for cereal, yoghurt or a small salad.", ["Stoneware", "20 oz", "Microwave safe"]],
  ["Dinner Plate", "Plates", "plate", 3200, ["oat", "sage", "ink"], ONE, "A flat dinner plate with a gently raised lip.", ["Stoneware", "27 cm", "Dishwasher safe"], true],
  ["Side Plate", "Plates", "plate", 2200, ["oat", "sage", "ink", "clay"], ONE, "A smaller plate for bread, dessert or starters.", ["Stoneware", "19 cm", "Dishwasher safe"]],
  ["Pasta Plate", "Plates", "plate", 3400, ["oat", "sky"], ONE, "A shallow, coupe-style plate that holds sauce.", ["Stoneware", "24 cm", "Oven safe to 220°C"]],
  ["Bud Vase", "Vases", "vase", 3400, ["clay", "oat", "sky", "moss"], ONE, "A narrow-necked vase for a single stem or a few sprigs.", ["Stoneware", "14 cm tall", "Watertight"], true],
  ["Column Vase", "Vases", "vase", 6800, ["oat", "ink", "sage"], [size("m", "Medium", "24 cm", 0), size("l", "Large", "34 cm", 2600)], "A tall statement vase with a soft shoulder.", ["Stoneware", "Watertight", "Wipe clean"]],
  ["Herb Planter", "Planters", "planter", 3000, ["clay", "oat", "moss"], SML, "A tapered planter with a drainage hole and matching saucer.", ["Stoneware", "Drainage hole and saucer", "Plant not included"], true],
  ["Hanging Planter", "Planters", "planter", 4200, ["oat", "sage"], ONE, "A rounded planter with a cotton hanging cord.", ["Stoneware", "15 cm", "Cord included"]],
  ["Pour Pitcher", "Serveware", "pitcher", 5400, ["oat", "sky", "ink"], ONE, "A one-litre pitcher with a clean-pouring spout.", ["Stoneware", "1 litre", "Dishwasher safe"], true],
  ["Serving Platter", "Serveware", "platter", 6200, ["oat", "sage", "clay"], [size("m", "Medium", "32 cm", 0), size("l", "Large", "42 cm", 2200)], "An oval platter for sharing dishes.", ["Stoneware", "Oven safe to 220°C", "Dishwasher safe"]],
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Deterministic pseudo-random stock so the demo always starts in the same state. */
function seedStock(index: number, glazes: string[], sizes: Size[]): Record<string, number> {
  const stock: Record<string, number> = {};
  let n = 0;
  for (const g of glazes) {
    for (const s of sizes) {
      const v = (index * 7 + n * 5) % 11;
      stock[`${g}|${s.id}`] = v === 3 ? 0 : v <= 1 ? 2 : v + 3; // a few sold-out and low-stock variants
      n++;
    }
  }
  return stock;
}

export function seedProducts(): Product[] {
  return SEEDS.map(([name, category, shape, basePrice, glazes, sizes, description, details, featured], i) => ({
    id: `p${String(i + 1).padStart(2, "0")}`,
    slug: slugify(name),
    name,
    category,
    shape,
    description,
    details,
    basePrice,
    glazes,
    sizes,
    stock: seedStock(i, glazes, sizes),
    featured: featured === true,
    addedOrder: (i * 5) % SEEDS.length,
  }));
}

export { slugify };
