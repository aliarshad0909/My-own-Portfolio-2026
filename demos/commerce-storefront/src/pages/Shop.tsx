import { useEffect, useMemo, useState } from "react";
import { Empty, ProductCard, swatchStyle } from "../components/ui.tsx";
import { GLAZES } from "../data/products.ts";
import { EMPTY_FILTERS, filterProducts, sortProducts, type Filters, type SortKey } from "../lib/catalog.ts";
import { formatMoney } from "../lib/money.ts";
import { useLocation } from "../lib/router.ts";
import { useStore } from "../lib/store.ts";
import { CATEGORIES, type Category } from "../lib/types.ts";

const PRICE_STEPS = [2500, 3500, 5000, 7500];

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export function Shop() {
  const products = useStore((s) => s.products);
  const { query } = useLocation();
  const urlCategory = query.get("category");
  const urlQuery = query.get("q") ?? "";

  const fromUrl = (): Filters => ({
    ...EMPTY_FILTERS,
    query: urlQuery,
    categories: urlCategory && (CATEGORIES as readonly string[]).includes(urlCategory) ? [urlCategory as Category] : [],
  });
  const [filters, setFilters] = useState<Filters>(fromUrl);
  const [sort, setSort] = useState<SortKey>("featured");

  // Header search and category links update the URL; keep the filters in step.
  useEffect(() => {
    setFilters(fromUrl());
  }, [urlCategory, urlQuery]);

  const results = useMemo(() => sortProducts(filterProducts(products, filters), sort), [products, filters, sort]);
  const activeCount = filters.categories.length + filters.glazes.length + (filters.maxPrice !== null ? 1 : 0) + (filters.inStockOnly ? 1 : 0) + (filters.query ? 1 : 0);

  return (
    <div className="wrap section shop">
      <header className="shop__head">
        <div>
          <h1>Shop all</h1>
          <p className="muted" role="status" aria-live="polite">
            {results.length} of {products.length} products{filters.query ? ` matching “${filters.query}”` : ""}
          </p>
        </div>
        <label className="select">
          <span>Sort by</span>
          <select value={sort} onChange={(e: { target: { value: string } }) => setSort(e.target.value as SortKey)}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </header>

      <div className="shop__body">
        <aside className="filters" aria-label="Filters">
          <label className="field">
            <span>Search</span>
            <input type="search" value={filters.query} placeholder="e.g. bowl, 12 oz" onChange={(e: { target: { value: string } }) => setFilters({ ...filters, query: e.target.value })} />
          </label>

          <fieldset>
            <legend>Category</legend>
            {CATEGORIES.map((c) => (
              <label key={c} className="check">
                <input type="checkbox" checked={filters.categories.includes(c)} onChange={() => setFilters({ ...filters, categories: toggle(filters.categories, c) })} />
                <span>{c}</span>
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Glaze</legend>
            <div className="swatches swatches--lg">
              {GLAZES.map((g) => (
                <button key={g.id} type="button" className={`swatch ${filters.glazes.includes(g.id) ? "is-on" : ""}`} style={swatchStyle(g.hex)} aria-pressed={filters.glazes.includes(g.id)} aria-label={g.name} title={g.name} onClick={() => setFilters({ ...filters, glazes: toggle(filters.glazes, g.id) })} />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Price</legend>
            <label className="check">
              <input type="radio" name="price" checked={filters.maxPrice === null} onChange={() => setFilters({ ...filters, maxPrice: null })} />
              <span>Any price</span>
            </label>
            {PRICE_STEPS.map((p) => (
              <label key={p} className="check">
                <input type="radio" name="price" checked={filters.maxPrice === p} onChange={() => setFilters({ ...filters, maxPrice: p })} />
                <span>Up to {formatMoney(p)}</span>
              </label>
            ))}
          </fieldset>

          <label className="check">
            <input type="checkbox" checked={filters.inStockOnly} onChange={() => setFilters({ ...filters, inStockOnly: !filters.inStockOnly })} />
            <span>In stock only</span>
          </label>

          <button type="button" className="btn btn--ghost btn--sm" disabled={activeCount === 0} onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </aside>

        {results.length > 0 ? (
          <div className="grid grid--3">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty title="No products match those filters" text="Try removing a filter or searching for something else.">
            <button type="button" className="btn" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all filters
            </button>
          </Empty>
        )}
      </div>
    </div>
  );
}
