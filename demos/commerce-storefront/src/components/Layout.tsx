import { useState, type FormEvent, type ReactNode } from "react";
import { navigate, useLocation } from "../lib/router.ts";
import { useStore } from "../lib/store.ts";
import { Link, Toasts } from "./ui.tsx";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/orders", label: "Orders" },
  { to: "/admin", label: "Admin" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const cartCount = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const wishCount = useStore((s) => s.wishlist.length);
  const [q, setQ] = useState("");

  const search = (e: FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
  };

  return (
    <>
      <a className="skip" href="#main" onClick={(e: { preventDefault(): void }) => { e.preventDefault(); document.getElementById("main")?.focus(); }}>
        Skip to content
      </a>
      <p className="demo-bar">
        <strong>Demonstration store.</strong> Tessera Clayworks is a fictional brand. No real orders are placed and no payments are taken.
      </p>
      <header className="header">
        <div className="wrap header__in">
          <Link to="/" className="logo" aria-label="Tessera Clayworks home">
            <span className="logo__mark" aria-hidden="true" />
            Tessera <em>Clayworks</em>
          </Link>
          <nav aria-label="Primary" className="nav">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className={path.startsWith(n.to) ? "is-active" : ""} aria-current={path.startsWith(n.to) ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <form className="search" role="search" onSubmit={search}>
            <label className="sr" htmlFor="site-search">
              Search products
            </label>
            <input id="site-search" type="search" placeholder="Search products" value={q} onChange={(e: { target: { value: string } }) => setQ(e.target.value)} />
          </form>
          <Link to="/wishlist" className="icon-link" aria-label={`Wishlist, ${wishCount} saved`}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
            {wishCount > 0 ? <span className="count">{wishCount}</span> : null}
          </Link>
          <Link to="/cart" className="icon-link" aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path d="M5 8h14l-1.2 11a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8zM9 8V7a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            {cartCount > 0 ? <span className="count">{cartCount}</span> : null}
          </Link>
        </div>
      </header>
      <main id="main" tabIndex={-1} key={path}>
        {children}
      </main>
      <footer className="footer">
        <div className="wrap footer__in">
          <div>
            <p className="logo">
              <span className="logo__mark" aria-hidden="true" />
              Tessera <em>Clayworks</em>
            </p>
            <p className="muted">A fictional ceramics studio, built as a storefront demonstration by Ali Arshad.</p>
          </div>
          <nav aria-label="Footer" className="footer__nav">
            <Link to="/shop">Shop all</Link>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/orders">Order history</Link>
            <Link to="/admin">Product admin</Link>
          </nav>
          <p className="muted small">Product illustrations are drawn in code. Catalogue, prices, stock and orders are sample data stored only in this browser.</p>
        </div>
      </footer>
      <Toasts />
    </>
  );
}
