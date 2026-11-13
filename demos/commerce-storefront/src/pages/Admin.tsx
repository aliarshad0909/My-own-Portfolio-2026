import { useRef, useState, type FormEvent } from "react";
import { ProductArt } from "../components/ProductArt.tsx";
import { glazeOf, toast } from "../components/ui.tsx";
import { GLAZES, slugify } from "../data/products.ts";
import { SHAPES, applyDraft, validateDraft, type DraftErrors, type ProductDraft } from "../lib/admin.ts";
import { totalStock } from "../lib/catalog.ts";
import { formatMoney } from "../lib/money.ts";
import { resetDemo, setState, useStore } from "../lib/store.ts";
import { CATEGORIES, type Product } from "../lib/types.ts";

const blank = (): Product => ({
  id: "",
  slug: "",
  name: "",
  category: "Mugs & Cups",
  shape: "mug",
  description: "",
  details: ["Stoneware"],
  basePrice: 0,
  glazes: ["oat"],
  sizes: [{ id: "one", label: "One size", note: "", priceDelta: 0 }],
  stock: {},
  featured: false,
  addedOrder: 999,
});

const toDraft = (p: Product): ProductDraft => ({
  name: p.name,
  category: p.category,
  shape: p.shape,
  price: p.basePrice ? (p.basePrice / 100).toFixed(2) : "",
  description: p.description,
  glazes: [...p.glazes],
  featured: p.featured,
  stock: Object.fromEntries(Object.entries(p.stock).map(([k, v]) => [k, String(v)])),
});

export function Admin() {
  const products = useStore((s) => s.products);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(toDraft(blank()));
  const [errors, setErrors] = useState<DraftErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const open = (p: Product) => {
    setEditing(p);
    setDraft(toDraft(p));
    setErrors({});
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("input")?.focus());
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const found = validateDraft(draft, products.filter((p) => p.id !== editing.id));
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const isNew = editing.id === "";
    const id = isNew ? `p${Date.now().toString(36)}` : editing.id;
    let slug = slugify(draft.name);
    if (products.some((p) => p.slug === slug && p.id !== id)) slug = `${slug}-${id}`;
    const next = applyDraft({ ...editing, id }, draft, slug);
    setState({ products: isNew ? [next, ...products] : products.map((p) => (p.id === id ? next : p)) });
    toast(`${isNew ? "Created" : "Saved"} ${next.name}`);
    setEditing(null);
  };

  const remove = (p: Product) => {
    setState((s) => ({ products: s.products.filter((x) => x.id !== p.id), wishlist: s.wishlist.filter((id) => id !== p.id), cart: s.cart.filter((l) => l.productId !== p.id) }));
    setConfirmDelete(null);
    toast(`Deleted ${p.name}`);
  };

  const toggleGlaze = (g: string) => setDraft((d) => ({ ...d, glazes: d.glazes.includes(g) ? d.glazes.filter((x) => x !== g) : [...d.glazes, g] }));

  return (
    <div className="wrap section">
      <div className="section__head">
        <div>
          <h1>Product admin</h1>
          <p className="muted">Create, edit and delete products. Changes update the storefront immediately and are saved in this browser only. There is no sign-in because this is a demonstration.</p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={() => open(blank())}>
            Add product
          </button>
          {confirmReset ? (
            <>
              <button type="button" className="btn btn--danger" onClick={() => { resetDemo(); setConfirmReset(false); setEditing(null); toast("Demo data reset"); }}>
                Confirm reset
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
              Reset demo data
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form ref={formRef} className="panel admin-form" onSubmit={save} noValidate aria-labelledby="edit-title">
          <h2 id="edit-title">{editing.id ? `Edit ${editing.name}` : "New product"}</h2>
          <div className="admin-form__grid">
            <div className="form-grid">
              <label className="field">
                <span>Name</span>
                <input value={draft.name} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, name: e.target.value })} aria-invalid={errors.name ? true : undefined} />
                {errors.name ? <span className="error small">{errors.name}</span> : null}
              </label>
              <label className="field field--half">
                <span>Category</span>
                <select value={draft.category} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {errors.category ? <span className="error small">{errors.category}</span> : null}
              </label>
              <label className="field field--half">
                <span>Illustration shape</span>
                <select value={draft.shape} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, shape: e.target.value })}>
                  {SHAPES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="field field--half">
                <span>Base price (USD)</span>
                <input inputMode="decimal" value={draft.price} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, price: e.target.value })} aria-invalid={errors.price ? true : undefined} />
                {errors.price ? <span className="error small">{errors.price}</span> : null}
              </label>
              <label className="check field--half">
                <input type="checkbox" checked={draft.featured} onChange={() => setDraft({ ...draft, featured: !draft.featured })} />
                <span>Studio favourite</span>
              </label>
              <label className="field">
                <span>Description</span>
                <textarea rows={3} value={draft.description} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, description: e.target.value })} aria-invalid={errors.description ? true : undefined} />
                {errors.description ? <span className="error small">{errors.description}</span> : null}
              </label>
              <fieldset className="field">
                <legend>Glazes</legend>
                <div className="pills">
                  {GLAZES.map((g) => (
                    <label key={g.id} className={`pill ${draft.glazes.includes(g.id) ? "is-on" : ""}`}>
                      <input type="checkbox" className="sr" checked={draft.glazes.includes(g.id)} onChange={() => toggleGlaze(g.id)} />
                      <span className="dot" style={{ background: g.hex }} /> {g.name}
                    </label>
                  ))}
                </div>
                {errors.glazes ? <span className="error small">{errors.glazes}</span> : null}
              </fieldset>
              <fieldset className="field">
                <legend>Stock on hand</legend>
                <div className="stock-grid">
                  {draft.glazes.flatMap((g) =>
                    editing.sizes.map((s) => {
                      const key = `${g}|${s.id}`;
                      return (
                        <label key={key} className="field">
                          <span>
                            {glazeOf(g).name}
                            {editing.sizes.length > 1 ? ` · ${s.label}` : ""}
                          </span>
                          <input inputMode="numeric" value={draft.stock[key] ?? "0"} onChange={(e: { target: { value: string } }) => setDraft({ ...draft, stock: { ...draft.stock, [key]: e.target.value } })} />
                        </label>
                      );
                    }),
                  )}
                </div>
                {errors.stock ? <span className="error small">{errors.stock}</span> : null}
              </fieldset>
            </div>
            <div className="admin-form__preview" aria-hidden="true">
              <ProductArt shape={(SHAPES as string[]).includes(draft.shape) ? (draft.shape as Product["shape"]) : "mug"} color={glazeOf(draft.glazes[0] ?? "oat").hex} seed={editing.id || "new"} />
              <p className="muted small">Live preview</p>
            </div>
          </div>
          <div className="row">
            <button type="submit" className="btn">
              {editing.id ? "Save changes" : "Create product"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="table-wrap">
        <table className="table">
          <caption className="sr">Products</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Price</th>
              <th scope="col">Variants</th>
              <th scope="col">Stock</th>
              <th scope="col">
                <span className="sr">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = totalStock(p);
              return (
                <tr key={p.id}>
                  <th scope="row">
                    <span className="table__art">
                      <ProductArt shape={p.shape} color={glazeOf(p.glazes[0]).hex} seed={p.id} />
                    </span>
                    {p.name}
                  </th>
                  <td>{p.category}</td>
                  <td>{formatMoney(p.basePrice)}</td>
                  <td>{p.glazes.length * p.sizes.length}</td>
                  <td>
                    <span className={`stock ${stock === 0 ? "stock--out" : stock <= 8 ? "stock--low" : ""}`}>{stock}</span>
                  </td>
                  <td className="table__actions">
                    {confirmDelete === p.id ? (
                      <>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => remove(p)}>
                          Confirm delete
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => open(p)}>
                          Edit<span className="sr"> {p.name}</span>
                        </button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(p.id)}>
                          Delete<span className="sr"> {p.name}</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
