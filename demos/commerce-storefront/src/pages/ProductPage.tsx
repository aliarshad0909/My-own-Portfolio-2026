import { useState } from "react";
import { ProductArt } from "../components/ProductArt.tsx";
import { Empty, Link, ProductCard, QtyStepper, WishlistButton, glazeOf, swatchStyle, toast } from "../components/ui.tsx";
import { addToCart } from "../lib/cart.ts";
import { defaultVariant, stockFor, unitPrice } from "../lib/catalog.ts";
import { formatMoney } from "../lib/money.ts";
import { useLocation } from "../lib/router.ts";
import { getState, setState, useStore } from "../lib/store.ts";

export function ProductPage({ slug }: { slug: string }) {
  const products = useStore((s) => s.products);
  const product = products.find((p) => p.slug === slug);
  const { query } = useLocation();
  const initial = product ? defaultVariant(product) : { glaze: "", size: "" };
  const requested = query.get("glaze");
  const [glaze, setGlaze] = useState(product && requested && product.glazes.includes(requested) ? requested : initial.glaze);
  const [size, setSize] = useState(initial.size);
  const [qty, setQty] = useState(1);
  const inCart = useStore((s) => s.cart.find((l) => product && l.productId === product.id && l.glaze === glaze && l.size === size)?.qty ?? 0);

  if (!product) {
    return (
      <div className="wrap section">
        <Empty title="Product not found" text="It may have been removed from the catalogue.">
          <Link to="/shop" className="btn">
            Back to the shop
          </Link>
        </Empty>
      </div>
    );
  }

  const stock = stockFor(product, glaze, size);
  const canAdd = Math.max(0, stock - inCart);
  const safeQty = Math.min(qty, Math.max(1, canAdd));
  const price = unitPrice(product, size);
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  const add = () => {
    const result = addToCart(getState().cart, product, glaze, size, safeQty);
    if (result.added === 0) {
      toast("That's all we have in this option.");
      return;
    }
    setState({ cart: result.cart });
    toast(`Added ${result.added} × ${product.name} (${glazeOf(glaze).name}) to your cart`);
    setQty(1);
  };

  return (
    <div className="wrap section">
      <nav aria-label="Breadcrumb" className="crumbs">
        <Link to="/shop">Shop</Link> <span aria-hidden="true">/</span> <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> <span aria-hidden="true">/</span> <span aria-current="page">{product.name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp__media">
          <ProductArt shape={product.shape} color={glazeOf(glaze).hex} seed={product.id} label={`${product.name} in ${glazeOf(glaze).name} glaze (illustration)`} />
        </div>

        <div className="pdp__info">
          <p className="card__cat">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="pdp__price">{formatMoney(price)}</p>
          <p className="lede">{product.description}</p>

          <fieldset className="opt">
            <legend>
              Glaze: <strong>{glazeOf(glaze).name}</strong>
            </legend>
            <div className="swatches swatches--lg">
              {product.glazes.map((g) => {
                const out = product.sizes.every((s) => stockFor(product, g, s.id) === 0);
                return (
                  <button key={g} type="button" className={`swatch ${g === glaze ? "is-on" : ""} ${out ? "is-out" : ""}`} style={swatchStyle(glazeOf(g).hex)} aria-pressed={g === glaze} aria-label={`${glazeOf(g).name}${out ? " (sold out)" : ""}`} title={glazeOf(g).name} onClick={() => { setGlaze(g); setQty(1); }} />
                );
              })}
            </div>
          </fieldset>

          {product.sizes.length > 1 ? (
            <fieldset className="opt">
              <legend>Size</legend>
              <div className="pills">
                {product.sizes.map((s) => {
                  const out = stockFor(product, glaze, s.id) === 0;
                  return (
                    <button key={s.id} type="button" className={`pill ${s.id === size ? "is-on" : ""}`} aria-pressed={s.id === size} onClick={() => { setSize(s.id); setQty(1); }}>
                      {s.label}
                      {s.note ? ` · ${s.note}` : ""}
                      {s.priceDelta > 0 ? ` (+${formatMoney(s.priceDelta)})` : ""}
                      {out ? " — sold out" : ""}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <p className={`stock ${stock === 0 ? "stock--out" : stock <= 3 ? "stock--low" : ""}`} role="status">
            {stock === 0 ? "Sold out in this option" : stock <= 3 ? `Only ${stock} left` : "In stock"}
            {inCart > 0 ? ` · ${inCart} in your cart` : ""}
          </p>

          <div className="row">
            <QtyStepper value={safeQty} max={Math.max(1, canAdd)} onChange={setQty} label="Quantity" />
            <button type="button" className="btn btn--wide" disabled={canAdd === 0} onClick={add}>
              {stock === 0 ? "Sold out" : canAdd === 0 ? "All available stock is in your cart" : `Add to cart · ${formatMoney(price * safeQty)}`}
            </button>
          </div>
          <WishlistButton product={product} withLabel />

          <ul className="details">
            {product.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="section" aria-labelledby="rel-title">
          <h2 id="rel-title">More {product.category.toLowerCase()}</h2>
          <div className="grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
