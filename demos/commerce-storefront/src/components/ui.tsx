import { useEffect, useState, type ReactNode } from "react";
import { GLAZES } from "../data/products.ts";
import { priceRange, totalStock } from "../lib/catalog.ts";
import { formatMoney } from "../lib/money.ts";
import { navigate } from "../lib/router.ts";
import { setState, useStore } from "../lib/store.ts";
import type { Product } from "../lib/types.ts";
import { ProductArt } from "./ProductArt.tsx";

export const swatchStyle = (hex: string) => ({ "--c": hex }) as { [key: string]: string };

export const glazeOf = (id: string) => GLAZES.find((g) => g.id === id) ?? GLAZES[0];

/** Internal link that uses the router (works with keyboard, middle-click falls back to the hash URL). */
export function Link({ to, children, className, ...rest }: { to: string; children: ReactNode; className?: string; [k: string]: unknown }) {
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e: { preventDefault(): void; metaKey?: boolean; ctrlKey?: boolean }) => {
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

// ── Toasts ────────────────────────────────────────────────────────────────
type Toast = { id: number; text: string };
let toasts: Toast[] = [];
let nextId = 1;
const subs = new Set<() => void>();
export function toast(text: string) {
  const t = { id: nextId++, text };
  toasts = [...toasts, t].slice(-3);
  subs.forEach((s) => s());
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    subs.forEach((s) => s());
  }, 3200);
}
export function Toasts() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Wishlist ──────────────────────────────────────────────────────────────
export function toggleWishlist(product: Product) {
  setState((s) => {
    const has = s.wishlist.includes(product.id);
    toast(has ? `Removed ${product.name} from your wishlist` : `Saved ${product.name} to your wishlist`);
    return { wishlist: has ? s.wishlist.filter((id) => id !== product.id) : [...s.wishlist, product.id] };
  });
}

export function WishlistButton({ product, withLabel = false }: { product: Product; withLabel?: boolean }) {
  const saved = useStore((s) => s.wishlist.includes(product.id));
  return (
    <button type="button" className={`wish ${saved ? "is-on" : ""} ${withLabel ? "wish--label" : ""}`} aria-pressed={saved} aria-label={withLabel ? undefined : `${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} wishlist`} onClick={() => toggleWishlist(product)}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
      {withLabel ? <span>{saved ? "Saved to wishlist" : "Save to wishlist"}</span> : null}
    </button>
  );
}

// ── Product card ──────────────────────────────────────────────────────────
export function ProductCard({ product }: { product: Product }) {
  const [glaze, setGlaze] = useState(product.glazes[0]);
  const active = product.glazes.includes(glaze) ? glaze : product.glazes[0];
  const [min, max] = priceRange(product);
  const soldOut = totalStock(product) === 0;
  return (
    <article className="card">
      <div className="card__media">
        <Link to={`/product/${product.slug}?glaze=${active}`} aria-label={`${product.name} in ${glazeOf(active).name}`} tabIndex={-1}>
          <ProductArt shape={product.shape} color={glazeOf(active).hex} seed={product.id} />
        </Link>
        {soldOut ? <span className="tag tag--muted">Sold out</span> : product.featured ? <span className="tag">Studio favourite</span> : null}
        <WishlistButton product={product} />
      </div>
      <div className="card__body">
        <p className="card__cat">{product.category}</p>
        <h3 className="card__title">
          <Link to={`/product/${product.slug}?glaze=${active}`}>{product.name}</Link>
        </h3>
        <p className="card__price">{min === max ? formatMoney(min) : `From ${formatMoney(min)}`}</p>
        <div className="swatches" role="group" aria-label={`${product.name} glaze preview`}>
          {product.glazes.map((g) => (
            <button key={g} type="button" className={`swatch ${g === active ? "is-on" : ""}`} style={swatchStyle(glazeOf(g).hex)} aria-label={glazeOf(g).name} aria-pressed={g === active} onClick={() => setGlaze(g)} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function QtyStepper({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

export function Empty({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
