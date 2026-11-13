import { useState, type FormEvent } from "react";
import { ProductArt } from "../components/ProductArt.tsx";
import { Empty, Link, ProductCard, QtyStepper, glazeOf, toast } from "../components/ui.tsx";
import { FREE_SHIPPING_THRESHOLD, computeTotals, findPromo, removeLine, resolveCart, setQuantity, type Promo } from "../lib/cart.ts";
import { formatMoney } from "../lib/money.ts";
import { setState, useStore } from "../lib/store.ts";
import type { ShippingMethod, Totals } from "../lib/types.ts";

export function Summary({ totals, promo, method }: { totals: Totals; promo: Promo | null; method: ShippingMethod }) {
  return (
    <dl className="summary">
      <div>
        <dt>Subtotal ({totals.itemCount} {totals.itemCount === 1 ? "item" : "items"})</dt>
        <dd>{formatMoney(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 ? (
        <div>
          <dt>Discount ({promo?.code})</dt>
          <dd>−{formatMoney(totals.discount)}</dd>
        </div>
      ) : null}
      <div>
        <dt>Shipping ({method})</dt>
        <dd>{totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}</dd>
      </div>
      <div>
        <dt>Estimated tax (demo rate)</dt>
        <dd>{formatMoney(totals.tax)}</dd>
      </div>
      <div className="summary__total">
        <dt>Total</dt>
        <dd>{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}

export function Cart() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const promoCode = useStore((s) => s.promoCode);
  const lines = resolveCart(cart, products);
  const promo = findPromo(promoCode);
  const totals = computeTotals(lines, "standard", promo);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const applyCode = (e: FormEvent) => {
    e.preventDefault();
    const found = findPromo(code);
    if (!found) {
      setCodeError("That code isn't valid. Try DEMO10 or FREESHIP.");
      return;
    }
    setCodeError("");
    setCode("");
    setState({ promoCode: found.code });
    toast(`Code ${found.code} applied: ${found.label}`);
  };

  if (lines.length === 0) {
    return (
      <div className="wrap section">
        <h1>Your cart</h1>
        <Empty title="Your cart is empty" text="Browse the collection and add something you like.">
          <Link to="/shop" className="btn">
            Start shopping
          </Link>
        </Empty>
      </div>
    );
  }

  const toFree = FREE_SHIPPING_THRESHOLD - (totals.subtotal - totals.discount);

  return (
    <div className="wrap section">
      <h1>Your cart</h1>
      <div className="cart">
        <ul className="lines">
          {lines.map((l) => {
            const over = l.qty > l.available;
            return (
              <li key={`${l.productId}-${l.glaze}-${l.size}`} className="line">
                <Link to={`/product/${l.product.slug}?glaze=${l.glaze}`} className="line__art" aria-hidden="true" tabIndex={-1}>
                  <ProductArt shape={l.product.shape} color={glazeOf(l.glaze).hex} seed={l.product.id} />
                </Link>
                <div className="line__info">
                  <Link to={`/product/${l.product.slug}?glaze=${l.glaze}`} className="line__name">
                    {l.product.name}
                  </Link>
                  <p className="muted small">
                    {glazeOf(l.glaze).name}
                    {l.product.sizes.length > 1 ? ` · ${l.product.sizes.find((s) => s.id === l.size)?.label}` : ""} · {formatMoney(l.unitPrice)} each
                  </p>
                  {over ? <p className="error small">Only {l.available} available now. Please reduce the quantity.</p> : null}
                  <div className="row">
                    <QtyStepper value={l.qty} max={Math.max(l.available, 1)} label={`Quantity for ${l.product.name}`} onChange={(n) => setState({ cart: setQuantity(cart, l.product, l.glaze, l.size, Math.max(1, n)) })} />
                    <button type="button" className="text-link" onClick={() => { setState({ cart: removeLine(cart, l) }); toast(`Removed ${l.product.name} from your cart`); }}>
                      Remove<span className="sr"> {l.product.name}</span>
                    </button>
                  </div>
                </div>
                <p className="line__total">{formatMoney(l.lineTotal)}</p>
              </li>
            );
          })}
        </ul>

        <aside className="panel" aria-label="Order summary">
          <h2>Order summary</h2>
          <p className="muted small" role="status">
            {totals.shipping === 0 ? "You have free standard shipping." : `Add ${formatMoney(toFree)} more for free standard shipping.`}
          </p>
          <Summary totals={totals} promo={promo} method="standard" />
          {promo ? (
            <p className="small">
              Code <strong>{promo.code}</strong> applied.{" "}
              <button type="button" className="text-link" onClick={() => setState({ promoCode: "" })}>
                Remove code
              </button>
            </p>
          ) : (
            <form className="promo" onSubmit={applyCode} noValidate>
              <label className="field">
                <span>Promo code</span>
                <input value={code} onChange={(e: { target: { value: string } }) => setCode(e.target.value)} aria-invalid={codeError ? true : undefined} aria-describedby={codeError ? "promo-error" : "promo-hint"} autoComplete="off" />
              </label>
              <button type="submit" className="btn btn--ghost btn--sm">
                Apply
              </button>
              {codeError ? (
                <p className="error small" id="promo-error">
                  {codeError}
                </p>
              ) : (
                <p className="muted small" id="promo-hint">
                  Demo codes: DEMO10, FREESHIP
                </p>
              )}
            </form>
          )}
          <Link to="/checkout" className="btn btn--wide">
            Checkout
          </Link>
          <Link to="/shop" className="text-link">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}

export function Wishlist() {
  const products = useStore((s) => s.products);
  const ids = useStore((s) => s.wishlist);
  const saved = products.filter((p) => ids.includes(p.id));
  return (
    <div className="wrap section">
      <h1>Wishlist</h1>
      {saved.length === 0 ? (
        <Empty title="Nothing saved yet" text="Tap the heart on any product to save it here.">
          <Link to="/shop" className="btn">
            Browse products
          </Link>
        </Empty>
      ) : (
        <div className="grid">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
