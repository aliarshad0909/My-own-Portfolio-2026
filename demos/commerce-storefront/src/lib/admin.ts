import { parseMoney } from "./money.ts";
import { CATEGORIES, type Category, type Product, type Shape } from "./types.ts";

export type ProductDraft = {
  name: string;
  category: string;
  shape: string;
  price: string;
  description: string;
  glazes: string[];
  featured: boolean;
  stock: Record<string, string>;
};

export type DraftErrors = Partial<Record<"name" | "category" | "price" | "description" | "glazes" | "stock", string>>;

export const SHAPES: Shape[] = ["mug", "tumbler", "bowl", "plate", "vase", "planter", "pitcher", "platter"];

export function validateDraft(d: ProductDraft, others: Product[]): DraftErrors {
  const e: DraftErrors = {};
  const name = d.name.trim();
  if (name.length < 3) e.name = "Enter a product name of at least 3 characters.";
  else if (others.some((p) => p.name.toLowerCase() === name.toLowerCase())) e.name = "Another product already uses this name.";
  if (!(CATEGORIES as readonly string[]).includes(d.category)) e.category = "Choose a category.";
  const cents = parseMoney(d.price);
  if (cents === null || cents < 100) e.price = "Enter a price of at least $1.00, like 28 or 28.50.";
  if (d.description.trim().length < 10) e.description = "Add a short description (at least 10 characters).";
  if (d.glazes.length === 0) e.glazes = "Select at least one glaze.";
  if (Object.values(d.stock).some((v) => !/^\d{1,4}$/.test(v.trim()))) e.stock = "Stock must be a whole number from 0 to 9999.";
  return e;
}

/** Apply a validated draft to a product (existing or new). */
export function applyDraft(base: Product, d: ProductDraft, slug: string): Product {
  const stock: Record<string, number> = {};
  for (const g of d.glazes) for (const s of base.sizes) {
    const key = `${g}|${s.id}`;
    stock[key] = Number((d.stock[key] ?? "0").trim()) || 0;
  }
  return {
    ...base,
    slug,
    name: d.name.trim(),
    category: d.category as Category,
    shape: d.shape as Shape,
    basePrice: parseMoney(d.price) ?? base.basePrice,
    description: d.description.trim(),
    glazes: [...d.glazes],
    featured: d.featured,
    stock,
  };
}
