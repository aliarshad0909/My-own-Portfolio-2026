export type Shape = "mug" | "tumbler" | "bowl" | "plate" | "vase" | "planter" | "pitcher" | "platter";

export const CATEGORIES = ["Mugs & Cups", "Bowls", "Plates", "Vases", "Planters", "Serveware"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Glaze = { id: string; name: string; hex: string };

export type Size = { id: string; label: string; note: string; priceDelta: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  shape: Shape;
  description: string;
  details: string[];
  /** Price of the smallest size, in cents. */
  basePrice: number;
  glazes: string[];
  sizes: Size[];
  /** Units on hand per variant, keyed by `${glaze}|${size}`. */
  stock: Record<string, number>;
  featured: boolean;
  /** Higher = newer. */
  addedOrder: number;
};

export type CartLine = { productId: string; glaze: string; size: string; qty: number };

export type ShippingMethod = "standard" | "express";

export type Address = {
  fullName: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type OrderLine = { productId: string; name: string; glaze: string; size: string; qty: number; unitPrice: number };

export type Totals = { subtotal: number; discount: number; shipping: number; tax: number; total: number; itemCount: number };

export type Order = {
  id: string;
  placedAt: string;
  lines: OrderLine[];
  totals: Totals;
  address: Address;
  shippingMethod: ShippingMethod;
  promoCode: string;
};
