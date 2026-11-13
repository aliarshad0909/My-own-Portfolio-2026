import { stockFor, unitPrice } from "./catalog.ts";
import type { CartLine, Product, ShippingMethod, Totals } from "./types.ts";

export const FREE_SHIPPING_THRESHOLD = 7500;
export const SHIPPING_RATES: Record<ShippingMethod, { label: string; eta: string; price: number }> = {
  standard: { label: "Standard", eta: "5–8 business days", price: 600 },
  express: { label: "Express", eta: "2–3 business days", price: 1400 },
};
/** Flat estimate used for the demonstration only. */
export const DEMO_TAX_RATE = 0.08;

export type Promo = { code: string; label: string; percentOff: number; freeShipping: boolean };
export const PROMOS: Promo[] = [
  { code: "DEMO10", label: "10% off your order", percentOff: 10, freeShipping: false },
  { code: "FREESHIP", label: "Free standard shipping", percentOff: 0, freeShipping: true },
];
export const findPromo = (code: string) => PROMOS.find((p) => p.code === code.trim().toUpperCase()) ?? null;

const sameLine = (a: CartLine, b: Pick<CartLine, "productId" | "glaze" | "size">) =>
  a.productId === b.productId && a.glaze === b.glaze && a.size === b.size;

export type AddResult = { cart: CartLine[]; added: number; capped: boolean };

/** Add to cart, never exceeding the stock on hand for that variant. */
export function addToCart(cart: CartLine[], product: Product, glaze: string, size: string, qty: number): AddResult {
  const available = stockFor(product, glaze, size);
  const existing = cart.find((l) => sameLine(l, { productId: product.id, glaze, size }));
  const current = existing ? existing.qty : 0;
  const want = Math.max(0, Math.floor(qty));
  const next = Math.min(available, current + want);
  const added = next - current;
  if (added <= 0) return { cart, added: 0, capped: want > 0 };
  const updated = existing
    ? cart.map((l) => (l === existing ? { ...l, qty: next } : l))
    : [...cart, { productId: product.id, glaze, size, qty: next }];
  return { cart: updated, added, capped: added < want };
}

/** Set a line's quantity (clamped to 0..stock). Quantity 0 removes the line. */
export function setQuantity(cart: CartLine[], product: Product, glaze: string, size: string, qty: number): CartLine[] {
  const clamped = Math.max(0, Math.min(stockFor(product, glaze, size), Math.floor(qty)));
  const key = { productId: product.id, glaze, size };
  if (clamped === 0) return cart.filter((l) => !sameLine(l, key));
  return cart.map((l) => (sameLine(l, key) ? { ...l, qty: clamped } : l));
}

export function removeLine(cart: CartLine[], key: Pick<CartLine, "productId" | "glaze" | "size">): CartLine[] {
  return cart.filter((l) => !sameLine(l, key));
}

export type ResolvedLine = CartLine & { product: Product; unitPrice: number; lineTotal: number; available: number };

/** Join cart lines to products. Lines whose product no longer exists are dropped. */
export function resolveCart(cart: CartLine[], products: Product[]): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const line of cart) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) continue;
    const price = unitPrice(product, line.size);
    out.push({ ...line, product, unitPrice: price, lineTotal: price * line.qty, available: stockFor(product, line.glaze, line.size) });
  }
  return out;
}

export function computeTotals(lines: Pick<ResolvedLine, "qty" | "lineTotal">[], method: ShippingMethod, promo: Promo | null): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
  const discount = promo ? Math.round((subtotal * promo.percentOff) / 100) : 0;
  const discounted = subtotal - discount;
  let shipping = 0;
  if (itemCount > 0) {
    const freeStandard = discounted >= FREE_SHIPPING_THRESHOLD || promo?.freeShipping === true;
    shipping = method === "standard" && freeStandard ? 0 : SHIPPING_RATES[method].price;
  }
  const tax = Math.round(discounted * DEMO_TAX_RATE);
  return { subtotal, discount, shipping, tax, total: discounted + shipping + tax, itemCount };
}
