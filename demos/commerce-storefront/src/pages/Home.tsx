import { ProductArt } from "../components/ProductArt.tsx";
import { Link, ProductCard } from "../components/ui.tsx";
import { FREE_SHIPPING_THRESHOLD } from "../lib/cart.ts";
import { formatMoney } from "../lib/money.ts";
import { useStore } from "../lib/store.ts";
import { CATEGORIES, type Shape } from "../lib/types.ts";

const CATEGORY_ART: Record<string, [Shape, string]> = {
  "Mugs & Cups": ["mug", "#C2643F"],
  Bowls: ["bowl", "#9DB09A"],
  Plates: ["plate", "#E3D5BC"],
  Vases: ["vase", "#A9C0CC"],
  Planters: ["planter", "#C2643F"],
  Serveware: ["pitcher", "#2E3A44"],
};

export function Home() {
  const products = useStore((s) => s.products);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="wrap hero__in">
          <div>
            <p className="kicker">Small-batch stoneware</p>
            <h1>Everyday pieces, made to be used.</h1>
            <p className="lede">Mugs, bowls and vases in six house glazes. Thrown in small batches, finished by hand, and built for the dishwasher.</p>
            <div className="row">
              <Link to="/shop" className="btn">
                Shop the collection
              </Link>
              <Link to="/shop?category=Vases" className="btn btn--ghost">
                Explore vases
              </Link>
            </div>
            <p className="muted small">Free standard shipping over {formatMoney(FREE_SHIPPING_THRESHOLD)} (demo rates).</p>
          </div>
          <div className="hero__art" aria-hidden="true">
            <ProductArt shape="vase" color="#C2643F" seed="hero-1" />
            <ProductArt shape="mug" color="#9DB09A" seed="hero-2" />
            <ProductArt shape="bowl" color="#2E3A44" seed="hero-3" />
          </div>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="cat-title">
        <h2 id="cat-title">Shop by category</h2>
        <ul className="cats">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <Link to={`/shop?category=${encodeURIComponent(c)}`} className="cat">
                <ProductArt shape={CATEGORY_ART[c][0]} color={CATEGORY_ART[c][1]} seed={c} />
                <span>{c}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap section" aria-labelledby="fav-title">
        <div className="section__head">
          <h2 id="fav-title">Studio favourites</h2>
          <Link to="/shop" className="text-link">
            View all products
          </Link>
        </div>
        <div className="grid">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
