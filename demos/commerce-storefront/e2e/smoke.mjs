// End-to-end check of the main shopping journeys against a running build.
// Usage: npx playwright install chromium && node e2e/smoke.mjs http://localhost:5173
import { chromium } from "playwright";

const base = (process.argv[2] ?? "http://localhost:5173").replace(/\/$/, "");
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  [${extra}]` : ""}`);

const browser = await chromium.launch();
const errors = [];

for (const width of [360, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  page.on("pageerror", (e) => errors.push(String(e)));
  const bad = [];
  for (const route of ["/", "/shop", "/product/morning-mug", "/cart", "/wishlist", "/checkout", "/orders", "/admin", "/nope"]) {
    await page.goto(`${base}/#${route}`);
    await page.waitForTimeout(120);
    const m = await page.evaluate(() => {
      window.scrollTo(9999, 0);
      const scrolled = window.scrollX;
      window.scrollTo(0, 0);
      return { scrolled, h1: document.querySelectorAll("h1,.empty h2").length };
    });
    if (m.scrolled > 0 || m.h1 < 1) bad.push(`${route}:scrollX=${m.scrolled},h1=${m.h1}`);
  }
  check(`no horizontal overflow at ${width}px on 9 routes`, bad.length === 0, bad.join(" "));
  await page.close();
}

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => errors.push(String(e)));
const count = (sel) => page.locator(sel).count();
const text = (sel) => page.locator(sel).first().innerText();

// Catalogue, search and filters
await page.goto(`${base}/#/shop`);
check("shop lists 16 products", (await count(".grid .card")) === 16);
await page.getByLabel("Bowls").check();
check("category filter → 3 bowls", (await count(".grid .card")) === 3);
await page.locator(".filters input[type=search]").fill("ramen");
check("search within category → 1", (await count(".grid .card")) === 1);
await page.locator(".filters input[type=search]").fill("zzzz");
check("no results shows empty state", (await count(".empty")) === 1);
await page.getByRole("button", { name: "Clear all filters" }).click();
check("clear filters restores 16", (await count(".grid .card")) === 16);
await page.locator(".select select").selectOption("price-asc");
const prices = await page.locator(".card__price").allInnerTexts();
const nums = prices.map((p) => Number(p.replace(/[^0-9.]/g, "")));
check("sort by price ascending", nums.every((n, i) => i === 0 || nums[i - 1] <= n));
await page.locator("#site-search").fill("vase");
await page.locator("#site-search").press("Enter");
await page.waitForTimeout(150);
check("header search → 2 vases", (await count(".grid .card")) === 2);

// Product page, variants, wishlist
await page.goto(`${base}/#/product/morning-mug`);
const p1 = await text(".pdp__price");
await page.locator(".pdp__info").getByRole("button", { name: /14 oz/ }).click();
const p2 = await text(".pdp__price");
check("size variant changes price", p1 === "$28.00" && p2 === "$32.00", `${p1} → ${p2}`);
const fillBefore = await page.locator('.pdp__media [data-part="body"]').getAttribute("fill");
await page.locator(".pdp__info").getByRole("button", { name: "Ink" }).click();
const fillAfter = await page.locator('.pdp__media [data-part="body"]').getAttribute("fill");
check("glaze variant recolours the illustration", fillAfter === "#2E3A44" && fillBefore !== "#2E3A44", `${fillBefore} → ${fillAfter}`);
const swatchPainted = await page.evaluate(() => {
  const el = document.querySelector(".pdp__info .swatch");
  const bg = getComputedStyle(el, "::before").backgroundColor;
  return { bg, varValue: getComputedStyle(el).getPropertyValue("--c").trim() };
});
check("glaze swatches paint their colour", swatchPainted.bg !== "rgba(0, 0, 0, 0)" && swatchPainted.bg !== "rgb(204, 204, 204)" && swatchPainted.varValue !== "", JSON.stringify(swatchPainted));
await page.getByRole("button", { name: "Save to wishlist" }).click();
check("wishlist count in header", (await text('a[aria-label^="Wishlist"] .count')) === "1");

// Cart
await page.locator(".pdp__info").getByRole("button", { name: "Increase quantity" }).click();
await page.locator(".pdp__info").getByRole("button", { name: /Add to cart/ }).click();
check("cart badge shows 2", (await text('a[aria-label^="Cart"] .count')) === "2");
await page.goto(`${base}/#/cart`);
check("cart line total 2 × $32", (await text(".line__total")) === "$64.00");
check("summary: $64 + $6 shipping + $5.12 tax", (await text(".summary__total dd")) === "$75.12");
await page.locator(".promo input").fill("bogus");
await page.getByRole("button", { name: "Apply" }).click();
check("invalid promo shows an error", (await count("#promo-error")) === 1);
await page.locator(".promo input").fill("demo10");
await page.getByRole("button", { name: "Apply" }).click();
check("DEMO10 → total $68.21", (await text(".summary__total dd")) === "$68.21", await text(".summary__total dd"));
await page.reload();
check("cart and promo persist after reload", (await text(".summary__total dd")) === "$68.21");

// Checkout
await page.goto(`${base}/#/checkout`);
await page.getByRole("button", { name: /Place demo order/ }).click();
check("empty checkout shows 7 field errors and focuses the first", (await count(".field .error")) === 7 && (await page.evaluate(() => document.activeElement?.getAttribute("name"))) === "fullName");
check("no card or payment fields exist", (await count('input[autocomplete^="cc-"], input[name*="card" i]')) === 0);
const fill = { fullName: "Sam Rivera", email: "sam@example.com", line1: "12 Market Street", city: "Portland", region: "OR", postalCode: "97201" };
for (const [k, v] of Object.entries(fill)) await page.locator(`[name="${k}"]`).fill(v);
await page.locator('[name="country"]').selectOption("United States");
await page.getByText("Express").click();
check("express shipping updates the total", (await text(".summary__total dd")) === "$76.21", await text(".summary__total dd"));
const stockBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("tessera-demo-v1")).products.find((p) => p.slug === "morning-mug").stock["ink|l"]);
await page.getByRole("button", { name: /Place demo order/ }).click();
await page.waitForSelector("text=Demo order confirmed");
const orderId = (await text(".lede strong")).trim();
check("order confirmation with order number", /^TC-\d{6}-0001$/.test(orderId), orderId);
const after = await page.evaluate(() => JSON.parse(localStorage.getItem("tessera-demo-v1")));
check("stock reduced by 2 and cart emptied", after.products.find((p) => p.slug === "morning-mug").stock["ink|l"] === stockBefore - 2 && after.cart.length === 0, `${stockBefore} → ${stockBefore - 2}`);
await page.goto(`${base}/#/orders`);
check("order appears in history", (await count(".orders > li")) === 1 && (await text(".orders h2")) === orderId);

// Stock cap
await page.goto(`${base}/#/product/morning-mug?glaze=ink`);
await page.locator(".pdp__info").getByRole("button", { name: /14 oz/ }).click();
for (let i = 0; i < 30; i++) {
  const b = page.locator(".pdp__info").getByRole("button", { name: "Increase quantity" });
  if (await b.isDisabled()) break;
  await b.click();
}
await page.locator(".pdp__info").getByRole("button", { name: /Add to cart/ }).click();
check("cannot add more than the stock on hand", await page.locator(".pdp__info").getByRole("button", { name: /All available stock is in your cart/ }).isDisabled());

// Admin CRUD
await page.goto(`${base}/#/admin`);
await page.getByRole("button", { name: "Add product" }).click();
await page.getByRole("button", { name: "Create product" }).click();
check("admin validation blocks an empty product", (await count(".admin-form .error")) >= 3);
await page.locator(".admin-form input").first().fill("Test Carafe");
await page.locator(".admin-form select").first().selectOption("Serveware");
await page.locator(".admin-form select").nth(1).selectOption("pitcher");
await page.locator('.admin-form input[inputmode="decimal"]').fill("48");
await page.locator(".admin-form textarea").fill("A carafe created by the end-to-end test.");
await page.locator('.stock-grid input').first().fill("5");
await page.getByRole("button", { name: "Create product" }).click();
check("admin creates a product", (await count('.table tbody tr')) === 17);
await page.goto(`${base}/#/shop?q=carafe`);
check("new product is live in the shop", (await count(".grid .card")) === 1 && (await text(".card__price")) === "$48.00");
await page.goto(`${base}/#/admin`);
await page.getByRole("button", { name: "Edit Test Carafe" }).click();
await page.locator('.admin-form input[inputmode="decimal"]').fill("52.50");
await page.getByRole("button", { name: "Save changes" }).click();
check("admin edits a price", (await page.locator(".table tbody tr").first().innerText()).includes("$52.50"));
await page.getByRole("button", { name: "Delete Test Carafe" }).click();
await page.getByRole("button", { name: "Confirm delete" }).click();
check("admin deletes after confirmation", (await count(".table tbody tr")) === 16);
await page.getByRole("button", { name: "Reset demo data" }).click();
await page.getByRole("button", { name: "Confirm reset" }).click();
await page.goto(`${base}/#/orders`);
check("reset clears demo orders", (await count(".empty")) === 1);

// Keyboard
await page.goto(`${base}/#/`);
await page.reload();
await page.waitForTimeout(150);
await page.keyboard.press("Tab");
check("skip link is the first tab stop", (await page.evaluate(() => document.activeElement?.className)) === "skip");
const small = await page.evaluate(() => [...document.querySelectorAll("a,button,input,select")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40) && !e.closest(".footer p,.lede,.card__title,.sr") && !e.classList.contains("skip"); }).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
check("interactive targets are at least 40px", small.length === 0, small.slice(0, 4).join(" "));

check("no runtime errors", errors.length === 0, errors.slice(0, 2).join(" | "));
await browser.close();
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
