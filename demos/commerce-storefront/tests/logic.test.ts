import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seedProducts } from "../src/data/products.ts";
import { applyDraft, validateDraft, type ProductDraft } from "../src/lib/admin.ts";
import { addToCart, computeTotals, findPromo, removeLine, resolveCart, setQuantity } from "../src/lib/cart.ts";
import { EMPTY_FILTERS, defaultVariant, filterProducts, priceRange, sortProducts, stockFor, totalStock, unitPrice } from "../src/lib/catalog.ts";
import { placeOrder, validateAddress } from "../src/lib/checkout.ts";
import { formatMoney, parseMoney } from "../src/lib/money.ts";
import { matchPath } from "../src/lib/paths.ts";
import type { Address, Product } from "../src/lib/types.ts";

const products = seedProducts();
const mug = products.find((p) => p.slug === "morning-mug") as Product;
const withStock = (p: Product, key: string, n: number): Product => ({ ...p, stock: { ...p.stock, [key]: n } });
const address: Address = { fullName: "Sam Rivera", email: "sam@example.com", line1: "12 Market Street", line2: "", city: "Portland", region: "OR", postalCode: "97201", country: "United States" };

describe("money", () => {
  it("formats cents", () => {
    assert.equal(formatMoney(0), "$0.00");
    assert.equal(formatMoney(2805), "$28.05");
    assert.equal(formatMoney(123456789), "$1,234,567.89");
    assert.equal(formatMoney(-500), "-$5.00");
  });
  it("parses valid amounts and rejects invalid ones", () => {
    assert.equal(parseMoney("28"), 2800);
    assert.equal(parseMoney("$1,200.5"), 120050);
    assert.equal(parseMoney("19.99"), 1999);
    for (const bad of ["", "abc", "-5", "1.999", "1e3"]) assert.equal(parseMoney(bad), null);
  });
});

describe("catalogue", () => {
  it("seeds 16 products with unique ids and slugs and stock for every variant", () => {
    assert.equal(products.length, 16);
    assert.equal(new Set(products.map((p) => p.id)).size, 16);
    assert.equal(new Set(products.map((p) => p.slug)).size, 16);
    for (const p of products) assert.equal(Object.keys(p.stock).length, p.glazes.length * p.sizes.length);
  });
  it("prices variants by size", () => {
    assert.equal(unitPrice(mug, "s"), 2800);
    assert.equal(unitPrice(mug, "l"), 3200);
    assert.deepEqual(priceRange(mug), [2800, 3200]);
  });
  it("filters by category, glaze, price, stock and search text together", () => {
    assert.equal(filterProducts(products, EMPTY_FILTERS).length, 16);
    const bowls = filterProducts(products, { ...EMPTY_FILTERS, categories: ["Bowls"] });
    assert.deepEqual(bowls.map((p) => p.name).sort(), ["Breakfast Bowl", "Nesting Bowl", "Ramen Bowl"]);
    assert.ok(filterProducts(products, { ...EMPTY_FILTERS, glazes: ["moss"] }).every((p) => p.glazes.includes("moss")));
    assert.ok(filterProducts(products, { ...EMPTY_FILTERS, maxPrice: 2500 }).every((p) => p.basePrice <= 2500));
    assert.deepEqual(filterProducts(products, { ...EMPTY_FILTERS, query: "ramen" }).map((p) => p.name), ["Ramen Bowl"]);
    assert.equal(filterProducts(products, { ...EMPTY_FILTERS, query: "zzz" }).length, 0);
    assert.equal(filterProducts(products, { ...EMPTY_FILTERS, categories: ["Bowls"], query: "noodles", glazes: ["ink"] }).length, 1);
    const soldOut: Product = { ...mug, stock: Object.fromEntries(Object.keys(mug.stock).map((k) => [k, 0])) };
    assert.equal(filterProducts([soldOut], { ...EMPTY_FILTERS, inStockOnly: true }).length, 0);
  });
  it("sorts", () => {
    const asc = sortProducts(products, "price-asc");
    for (let i = 1; i < asc.length; i++) assert.ok(asc[i - 1].basePrice <= asc[i].basePrice);
    assert.equal(sortProducts(products, "price-desc")[0].basePrice, Math.max(...products.map((p) => p.basePrice)));
    assert.equal(sortProducts(products, "featured")[0].featured, true);
    assert.equal(sortProducts(products, "name")[0].name, "Breakfast Bowl");
  });
  it("picks an in-stock default variant", () => {
    const p = withStock(withStock(mug, "oat|s", 0), "oat|l", 0);
    const v = defaultVariant(p);
    assert.ok(stockFor(p, v.glaze, v.size) > 0);
  });
});

describe("cart", () => {
  const p = withStock(mug, "oat|s", 3);
  it("adds, merges lines and caps at stock", () => {
    let r = addToCart([], p, "oat", "s", 2);
    assert.deepEqual([r.added, r.capped, r.cart.length], [2, false, 1]);
    r = addToCart(r.cart, p, "oat", "s", 5);
    assert.deepEqual([r.added, r.capped, r.cart[0].qty], [1, true, 3]);
    r = addToCart(r.cart, p, "oat", "s", 1);
    assert.deepEqual([r.added, r.capped], [0, true]);
    assert.equal(addToCart([], withStock(mug, "oat|s", 0), "oat", "s", 1).added, 0);
  });
  it("keeps different variants as separate lines", () => {
    const r = addToCart(addToCart([], p, "oat", "s", 1).cart, p, "sage", "s", 1);
    assert.equal(r.cart.length, 2);
  });
  it("sets quantity with clamping and removes at zero", () => {
    const cart = addToCart([], p, "oat", "s", 1).cart;
    assert.equal(setQuantity(cart, p, "oat", "s", 99)[0].qty, 3);
    assert.equal(setQuantity(cart, p, "oat", "s", 0).length, 0);
    assert.equal(removeLine(cart, { productId: p.id, glaze: "oat", size: "s" }).length, 0);
  });
  it("drops lines whose product was deleted", () => {
    assert.equal(resolveCart([{ productId: "gone", glaze: "oat", size: "s", qty: 1 }], products).length, 0);
  });
  it("computes totals: shipping threshold, promos and tax", () => {
    const line = (lineTotal: number, qty = 1) => ({ lineTotal, qty });
    assert.deepEqual(computeTotals([], "standard", null), { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 });
    assert.deepEqual(computeTotals([line(2800)], "standard", null), { subtotal: 2800, discount: 0, shipping: 600, tax: 224, total: 3624, itemCount: 1 });
    assert.equal(computeTotals([line(7500)], "standard", null).shipping, 0);
    assert.equal(computeTotals([line(7500)], "express", null).shipping, 1400);
    const ten = computeTotals([line(8000, 2)], "standard", findPromo("demo10"));
    assert.deepEqual(ten, { subtotal: 8000, discount: 800, shipping: 600, tax: 576, total: 8376, itemCount: 2 }); // discount drops it below the free-shipping threshold
    assert.equal(computeTotals([line(2800)], "standard", findPromo("FREESHIP")).shipping, 0);
    assert.equal(computeTotals([line(2800)], "express", findPromo("FREESHIP")).shipping, 1400);
    assert.equal(findPromo("nope"), null);
  });
});

describe("checkout", () => {
  it("validates addresses", () => {
    assert.deepEqual(validateAddress(address), {});
    const e = validateAddress({ ...address, email: "nope", postalCode: "!", fullName: "" });
    assert.deepEqual(Object.keys(e).sort(), ["email", "fullName", "postalCode"]);
  });
  it("places an order, decrements stock and totals correctly", () => {
    const p = withStock(mug, "oat|l", 4);
    const list = products.map((x) => (x.id === p.id ? p : x));
    const r = placeOrder({ cart: [{ productId: p.id, glaze: "oat", size: "l", qty: 3 }], products: list, address, shippingMethod: "standard", promo: null, now: new Date("2026-03-09T10:00:00Z"), sequence: 7 });
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.order.id, "TC-260309-0007");
    assert.equal(r.order.totals.subtotal, 9600);
    assert.equal(r.order.totals.shipping, 0);
    assert.equal(r.order.totals.total, 9600 + 768);
    assert.equal(stockFor(r.products.find((x) => x.id === p.id) as Product, "oat", "l"), 1);
    assert.equal(totalStock(r.products.find((x) => x.id === p.id) as Product), totalStock(p) - 3);
  });
  it("refuses empty carts, invalid addresses and oversold lines", () => {
    const base = { products, address, shippingMethod: "standard" as const, promo: null, now: new Date(), sequence: 1 };
    assert.deepEqual([placeOrder({ ...base, cart: [] }).ok, (placeOrder({ ...base, cart: [] }) as { reason: string }).reason], [false, "empty"]);
    const cart = [{ productId: mug.id, glaze: "sage", size: "s", qty: 1 }];
    assert.equal((placeOrder({ ...base, cart, address: { ...address, email: "" } }) as { reason: string }).reason, "invalid");
    const over = [{ productId: mug.id, glaze: "sage", size: "s", qty: 999 }];
    assert.equal((placeOrder({ ...base, cart: over }) as { reason: string }).reason, "stock");
  });
});

describe("admin", () => {
  const draft: ProductDraft = { name: "Test Jug", category: "Serveware", shape: "pitcher", price: "45.50", description: "A jug used for testing.", glazes: ["oat"], featured: false, stock: { "oat|one": "5" } };
  it("validates drafts", () => {
    assert.deepEqual(validateDraft(draft, products), {});
    const bad = validateDraft({ ...draft, name: "Morning Mug", price: "0.5", glazes: [], description: "x", stock: { "oat|one": "-1" }, category: "Nope" }, products);
    assert.deepEqual(Object.keys(bad).sort(), ["category", "description", "glazes", "name", "price", "stock"]);
  });
  it("applies a draft", () => {
    const base = products.find((p) => p.slug === "pour-pitcher") as Product;
    const next = applyDraft(base, draft, "test-jug");
    assert.deepEqual([next.name, next.basePrice, next.slug, next.stock], ["Test Jug", 4550, "test-jug", { "oat|one": 5 }]);
  });
});

describe("router", () => {
  it("matches path patterns", () => {
    assert.deepEqual(matchPath("/product/:slug", "/product/morning-mug"), { slug: "morning-mug" });
    assert.equal(matchPath("/product/:slug", "/shop"), null);
    assert.deepEqual(matchPath("/", "/"), {});
  });
});
