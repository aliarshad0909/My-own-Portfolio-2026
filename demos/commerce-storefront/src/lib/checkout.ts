import { variantKey } from "./catalog.ts";
import { computeTotals, resolveCart, type Promo } from "./cart.ts";
import type { Address, CartLine, Order, Product, ShippingMethod } from "./types.ts";

export const EMPTY_ADDRESS: Address = { fullName: "", email: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "" };

export type AddressErrors = Partial<Record<keyof Address, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateAddress(a: Address): AddressErrors {
  const e: AddressErrors = {};
  if (a.fullName.trim().length < 2) e.fullName = "Enter your full name.";
  if (!EMAIL_RE.test(a.email.trim())) e.email = "Enter a valid email address, like name@example.com.";
  if (a.line1.trim().length < 3) e.line1 = "Enter a street address.";
  if (a.city.trim().length < 2) e.city = "Enter a city.";
  if (a.region.trim().length < 2) e.region = "Enter a state, province or region.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test(a.postalCode.trim())) e.postalCode = "Enter a valid postal code.";
  if (a.country.trim().length < 2) e.country = "Choose a country.";
  return e;
}

export type PlaceOrderResult =
  | { ok: true; order: Order; products: Product[] }
  | { ok: false; reason: "empty" | "invalid" | "stock"; message: string };

/**
 * Create an order from the cart and decrement stock.
 * Simulated: nothing is charged and nothing leaves the browser.
 */
export function placeOrder(input: {
  cart: CartLine[];
  products: Product[];
  address: Address;
  shippingMethod: ShippingMethod;
  promo: Promo | null;
  now: Date;
  sequence: number;
}): PlaceOrderResult {
  const lines = resolveCart(input.cart, input.products);
  if (lines.length === 0) return { ok: false, reason: "empty", message: "Your cart is empty." };
  if (Object.keys(validateAddress(input.address)).length > 0) return { ok: false, reason: "invalid", message: "Please check your delivery details." };
  const short = lines.find((l) => l.qty > l.available);
  if (short) {
    return { ok: false, reason: "stock", message: `Only ${short.available} of ${short.product.name} left in that option. Please update your cart.` };
  }

  const products = input.products.map((p) => {
    const mine = lines.filter((l) => l.productId === p.id);
    if (mine.length === 0) return p;
    const stock = { ...p.stock };
    for (const l of mine) stock[variantKey(l.glaze, l.size)] = l.available - l.qty;
    return { ...p, stock };
  });

  const d = input.now;
  const stamp = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const order: Order = {
    id: `TC-${stamp}-${String(input.sequence).padStart(4, "0")}`,
    placedAt: d.toISOString(),
    lines: lines.map((l) => ({ productId: l.productId, name: l.product.name, glaze: l.glaze, size: l.size, qty: l.qty, unitPrice: l.unitPrice })),
    totals: computeTotals(lines, input.shippingMethod, input.promo),
    address: { ...input.address },
    shippingMethod: input.shippingMethod,
    promoCode: input.promo ? input.promo.code : "",
  };
  return { ok: true, order, products };
}
