import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/structured-data";

export type Crumb = { name: string; path: string };

/**
 * Visible breadcrumb navigation that also emits matching BreadcrumbList JSON-LD
 * from the same data, so the markup and the structured data cannot drift. The
 * last crumb is the current page and is not a link.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbSchema(items)} />
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol className="container">
          {items.map((c, i) => {
            const last = i === items.length - 1;
            return (
              <li key={c.path}>
                {last ? (
                  <span aria-current="page">{c.name}</span>
                ) : (
                  <Link href={c.path}>{c.name}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
