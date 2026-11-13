import type { Category, Product } from "./types.ts";

export const variantKey = (glaze: string, size: string) => `${glaze}|${size}`;

export function unitPrice(product: Product, sizeId: string): number {
  const size = product.sizes.find((s) => s.id === sizeId);
  return product.basePrice + (size ? size.priceDelta : 0);
}

export function stockFor(product: Product, glaze: string, size: string): number {
  return Math.max(0, product.stock[variantKey(glaze, size)] ?? 0);
}

export const totalStock = (product: Product) => Object.values(product.stock).reduce((a, b) => a + Math.max(0, b), 0);

export function priceRange(product: Product): [number, number] {
  const prices = product.sizes.map((s) => product.basePrice + s.priceDelta);
  return [Math.min(...prices), Math.max(...prices)];
}

/** First variant with stock, falling back to the first variant. */
export function defaultVariant(product: Product): { glaze: string; size: string } {
  for (const g of product.glazes) for (const s of product.sizes) if (stockFor(product, g, s.id) > 0) return { glaze: g, size: s.id };
  return { glaze: product.glazes[0], size: product.sizes[0].id };
}

export type SortKey = "featured" | "newest" | "price-asc" | "price-desc" | "name";

export type Filters = {
  query: string;
  categories: Category[];
  glazes: string[];
  /** Maximum starting price in cents; null = no limit. */
  maxPrice: number | null;
  inStockOnly: boolean;
};

export const EMPTY_FILTERS: Filters = { query: "", categories: [], glazes: [], maxPrice: null, inStockOnly: false };

export function filterProducts(products: Product[], f: Filters): Product[] {
  const terms = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  return products.filter((p) => {
    if (f.categories.length > 0 && !f.categories.includes(p.category)) return false;
    if (f.glazes.length > 0 && !p.glazes.some((g) => f.glazes.includes(g))) return false;
    if (f.maxPrice !== null && p.basePrice > f.maxPrice) return false;
    if (f.inStockOnly && totalStock(p) === 0) return false;
    if (terms.length > 0) {
      const haystack = `${p.name} ${p.category} ${p.description} ${p.details.join(" ")}`.toLowerCase();
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });
}

export function sortProducts(products: Product[], key: SortKey): Product[] {
  const list = [...products];
  switch (key) {
    case "price-asc":
      return list.sort((a, b) => a.basePrice - b.basePrice || a.name.localeCompare(b.name));
    case "price-desc":
      return list.sort((a, b) => b.basePrice - a.basePrice || a.name.localeCompare(b.name));
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return list.sort((a, b) => b.addedOrder - a.addedOrder);
    default:
      return list.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  }
}
