import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArrowLink } from "@/components/ui/Button";
import { EditorNote } from "@/components/ui/EditorNote";
import { PageHero } from "@/components/ui/PageHero";
import { breadcrumbSchema, singleServiceSchema } from "@/lib/structured-data";
import { getProject } from "@/lib/projects";
import { SERVICE_HUBS, getHub, getSpoke } from "@/lib/seo/service-hubs";
import { isIndexable, shouldRender } from "@/lib/seo/publication";
import { pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ hub: string; spoke: string }> };

export function generateStaticParams() {
  const params: { hub: string; spoke: string }[] = [];
  for (const h of SERVICE_HUBS) {
    for (const s of h.spokes) {
      if (shouldRender(s.publicationState)) params.push({ hub: h.slug, spoke: s.slug });
    }
  }
  return params;
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hub, spoke } = await params;
  const record = getSpoke(hub, spoke);
  if (!record) return {};
  return pageMetadata({
    title: record.title,
    description: record.lead,
    path: `/services/${hub}/${spoke}`,
    index: isIndexable(record.publicationState),
  });
}

export default async function SpokePage({ params }: Props) {
  const { hub, spoke } = await params;
  const hubRecord = getHub(hub);
  const record = getSpoke(hub, spoke);
  if (!hubRecord || !record || !shouldRender(record.publicationState)) notFound();

  return (
    <>
      <JsonLd
        data={singleServiceSchema({
          name: record.h1,
          description: record.lead,
          path: `/services/${hub}/${spoke}`,
          serviceType: record.title,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
          { name: hubRecord.h1, path: `/services/${hub}` },
          { name: record.h1, path: `/services/${hub}/${spoke}` },
        ])}
      />

      <PageHero eyebrow={hubRecord.h1} title={record.h1} lead={record.lead} />

      {!isIndexable(record.publicationState) ? (
        <EditorNote>
          This specialism page is {record.publicationState}: preview-only,
          noindex, until it has unique copy and is set to Published.
        </EditorNote>
      ) : null}

      <section className="container section">
        {record.body.map((p, i) => (
          <p key={i} className="measure">
            {p}
          </p>
        ))}
        <p className="measure">
          <ArrowLink href={`/services/${hub}`}>Back to {hubRecord.h1.toLowerCase()}</ArrowLink>
        </p>
      </section>

      {record.projectSlugs.length > 0 ? (
        <section className="container section--tight">
          <h2 className="section-title">Related build</h2>
          <ul className="hub-links">
            {record.projectSlugs.map((slug) => {
              const p = getProject(slug);
              return p ? (
                <li key={slug}>
                  <ArrowLink href={`/work/${p.slug}`}>{p.title}</ArrowLink>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      ) : null}

      <ContactCTA />
    </>
  );
}
