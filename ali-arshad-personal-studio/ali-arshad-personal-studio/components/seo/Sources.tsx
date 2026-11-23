import type { LocalSource } from "@/lib/geo/local-content-types";

/**
 * Renders a citation list for local claims. External links are nofollow and
 * open in a new tab; each entry shows publisher and the date the claim was
 * last checked, so a reviewer can verify it.
 */
export function Sources({ items, heading = "Sources" }: { items: LocalSource[]; heading?: string }) {
  if (!items.length) return null;
  return (
    <aside className="sources" aria-label={heading}>
      <h2 className="sources__heading">{heading}</h2>
      <ol className="sources__list">
        {items.map((s, i) => (
          <li key={i} className="sources__item" id={`source-${i + 1}`}>
            <a className="sources__link" href={s.url} target="_blank" rel="nofollow noopener noreferrer">
              {s.title}
            </a>
            <span className="sources__meta">
              {s.publisher}. Accessed <time dateTime={s.accessed}>{s.accessed}</time>.
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
