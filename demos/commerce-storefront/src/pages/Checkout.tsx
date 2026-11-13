import { useRef, useState, type FormEvent } from "react";
import { Empty, Link, glazeOf } from "../components/ui.tsx";
import { SHIPPING_RATES, computeTotals, findPromo, resolveCart } from "../lib/cart.ts";
import { EMPTY_ADDRESS, placeOrder, validateAddress, type AddressErrors } from "../lib/checkout.ts";
import { formatMoney } from "../lib/money.ts";
import { navigate } from "../lib/router.ts";
import { getState, setState, useStore } from "../lib/store.ts";
import type { Address, Order, ShippingMethod } from "../lib/types.ts";
import { Summary } from "./Cart.tsx";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Germany", "Australia", "United Arab Emirates", "Pakistan"];
const FIELDS: { key: keyof Address; label: string; autoComplete: string; type?: string; optional?: boolean; half?: boolean }[] = [
  { key: "fullName", label: "Full name", autoComplete: "name" },
  { key: "email", label: "Email", autoComplete: "email", type: "email" },
  { key: "line1", label: "Street address", autoComplete: "address-line1" },
  { key: "line2", label: "Apartment, suite, etc.", autoComplete: "address-line2", optional: true },
  { key: "city", label: "City", autoComplete: "address-level2", half: true },
  { key: "region", label: "State / region", autoComplete: "address-level1", half: true },
  { key: "postalCode", label: "Postal code", autoComplete: "postal-code", half: true },
];

export function Checkout() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const promo = findPromo(useStore((s) => s.promoCode));
  const lines = resolveCart(cart, products);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [errors, setErrors] = useState<AddressErrors>({});
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const totals = computeTotals(lines, method, promo);

  if (lines.length === 0) {
    return (
      <div className="wrap section">
        <h1>Checkout</h1>
        <Empty title="There's nothing to check out" text="Add a product to your cart first.">
          <Link to="/shop" className="btn">
            Go to the shop
          </Link>
        </Empty>
      </div>
    );
  }

  const set = (key: keyof Address, value: string) => {
    setAddress((a) => ({ ...a, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const found = validateAddress(address);
    setErrors(found);
    setProblem("");
    const first = (Object.keys(found) as (keyof Address)[])[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setBusy(true);
    // Short delay stands in for a payment round-trip. Nothing is sent anywhere.
    setTimeout(() => {
      const s = getState();
      const result = placeOrder({ cart: s.cart, products: s.products, address, shippingMethod: method, promo, now: new Date(), sequence: s.orders.length + 1 });
      setBusy(false);
      if (!result.ok) {
        setProblem(result.message);
        return;
      }
      setState({ products: result.products, orders: [result.order, ...s.orders], cart: [], promoCode: "" });
      navigate(`/order/${result.order.id}`);
    }, 700);
  };

  return (
    <div className="wrap section">
      <h1>Checkout</h1>
      <form ref={form} className="cart" onSubmit={submit} noValidate aria-busy={busy}>
        <div className="checkout">
          <section className="panel" aria-labelledby="co-1">
            <h2 id="co-1">1. Delivery details</h2>
            <div className="form-grid">
              {FIELDS.map((f) => (
                <label key={f.key} className={`field ${f.half ? "field--half" : ""}`}>
                  <span>
                    {f.label} {f.optional ? <em>(optional)</em> : null}
                  </span>
                  <input name={f.key} type={f.type ?? "text"} autoComplete={f.autoComplete} value={address[f.key]} required={!f.optional} onChange={(e: { target: { value: string } }) => set(f.key, e.target.value)} aria-invalid={errors[f.key] ? true : undefined} aria-describedby={errors[f.key] ? `${f.key}-err` : undefined} />
                  {errors[f.key] ? (
                    <span className="error small" id={`${f.key}-err`}>
                      {errors[f.key]}
                    </span>
                  ) : null}
                </label>
              ))}
              <label className="field field--half">
                <span>Country</span>
                <select name="country" autoComplete="country-name" value={address.country} required onChange={(e: { target: { value: string } }) => set("country", e.target.value)} aria-invalid={errors.country ? true : undefined} aria-describedby={errors.country ? "country-err" : undefined}>
                  <option value="">Select a country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {errors.country ? (
                  <span className="error small" id="country-err">
                    {errors.country}
                  </span>
                ) : null}
              </label>
            </div>
          </section>

          <section className="panel" aria-labelledby="co-2">
            <h2 id="co-2">2. Shipping method</h2>
            <div className="radios" role="radiogroup" aria-labelledby="co-2">
              {(Object.keys(SHIPPING_RATES) as ShippingMethod[]).map((m) => {
                const price = computeTotals(lines, m, promo).shipping;
                return (
                  <label key={m} className={`radio ${method === m ? "is-on" : ""}`}>
                    <input type="radio" name="shipping" checked={method === m} onChange={() => setMethod(m)} />
                    <span>
                      <strong>{SHIPPING_RATES[m].label}</strong>
                      <small>{SHIPPING_RATES[m].eta}</small>
                    </span>
                    <span>{price === 0 ? "Free" : formatMoney(price)}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="panel" aria-labelledby="co-3">
            <h2 id="co-3">3. Payment</h2>
            <div className="notice">
              <strong>Simulated payment.</strong> This demonstration does not collect card details or charge anything. Placing the order creates a sample order in this browser and reduces the demo stock.
            </div>
          </section>
        </div>

        <aside className="panel" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="mini">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.glaze}-${l.size}`}>
                <span>
                  {l.qty} × {l.product.name} <small className="muted">({glazeOf(l.glaze).name})</small>
                </span>
                <span>{formatMoney(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <Summary totals={totals} promo={promo} method={method} />
          {problem ? (
            <p className="error" role="alert">
              {problem} <Link to="/cart">Review cart</Link>
            </p>
          ) : null}
          <button type="submit" className="btn btn--wide" disabled={busy}>
            {busy ? "Placing order…" : `Place demo order · ${formatMoney(totals.total)}`}
          </button>
          <Link to="/cart" className="text-link">
            Back to cart
          </Link>
        </aside>
      </form>
    </div>
  );
}

function OrderLines({ order }: { order: Order }) {
  return (
    <ul className="mini">
      {order.lines.map((l) => (
        <li key={`${l.productId}-${l.glaze}-${l.size}`}>
          <span>
            {l.qty} × {l.name} <small className="muted">({glazeOf(l.glaze).name})</small>
          </span>
          <span>{formatMoney(l.unitPrice * l.qty)}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrderPage({ id }: { id: string }) {
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  if (!order) {
    return (
      <div className="wrap section">
        <Empty title="Order not found" text="Orders are stored only in the browser that placed them.">
          <Link to="/orders" className="btn">
            View order history
          </Link>
        </Empty>
      </div>
    );
  }
  const a = order.address;
  return (
    <div className="wrap section narrow">
      <p className="kicker">Demo order confirmed</p>
      <h1>Thank you, {a.fullName.split(" ")[0]}.</h1>
      <p className="lede">
        Order <strong>{order.id}</strong> was created in this browser. This is a demonstration, so nothing has been charged and nothing will be shipped.
      </p>
      <div className="panel">
        <h2>Items</h2>
        <OrderLines order={order} />
        <Summary totals={order.totals} promo={order.promoCode ? { code: order.promoCode, label: "", percentOff: 0, freeShipping: false } : null} method={order.shippingMethod} />
      </div>
      <div className="panel">
        <h2>Delivery</h2>
        <p>
          {a.fullName}
          <br />
          {a.line1}
          {a.line2 ? `, ${a.line2}` : ""}
          <br />
          {a.city}, {a.region} {a.postalCode}
          <br />
          {a.country}
        </p>
        <p className="muted small">Confirmation would be emailed to {a.email} in a live store. No email is sent from this demo.</p>
      </div>
      <div className="row">
        <Link to="/shop" className="btn">
          Continue shopping
        </Link>
        <Link to="/orders" className="btn btn--ghost">
          Order history
        </Link>
      </div>
    </div>
  );
}

export function Orders() {
  const orders = useStore((s) => s.orders);
  return (
    <div className="wrap section narrow">
      <h1>Order history</h1>
      <p className="muted">Demo orders placed in this browser.</p>
      {orders.length === 0 ? (
        <Empty title="No orders yet" text="Place a demo order and it will appear here.">
          <Link to="/shop" className="btn">
            Start shopping
          </Link>
        </Empty>
      ) : (
        <ul className="orders">
          {orders.map((o) => (
            <li key={o.id} className="panel">
              <div className="section__head">
                <h2>
                  <Link to={`/order/${o.id}`}>{o.id}</Link>
                </h2>
                <p className="muted small">
                  {new Date(o.placedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · {o.totals.itemCount} {o.totals.itemCount === 1 ? "item" : "items"} · <strong>{formatMoney(o.totals.total)}</strong>
                </p>
              </div>
              <OrderLines order={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
