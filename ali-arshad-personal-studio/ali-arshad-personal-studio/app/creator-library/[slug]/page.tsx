import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OculusSoundExplorer } from "@/components/creator-library/OculusSoundExplorer";
import { ResourcePreviewMedia } from "@/components/creator-library/ResourcePreviewMedia";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Icon } from "@/components/ui/Icon";
import {
  CREATOR_LIBRARY_ITEMS,
  CREATOR_LIBRARY_PATH,
  SERVICE_LINK_LABELS,
  getCreatorResource,
  oculusSoundsForGroup,
  relatedCreatorResources,
} from "@/lib/creator-library";
import { pageMetadata } from "@/lib/seo";
import { siteBaseUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CREATOR_LIBRARY_ITEMS.map((item) => ({ slug: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getCreatorResource(slug);
  if (!item) return {};
  return pageMetadata({
    title: `${item.title} — Free Download | Creator Library`,
    description: `${item.summary} Format: ${item.fileFormat} (${item.sizeLabel}). License: ${item.licenseLabel}.`,
    path: `${CREATOR_LIBRARY_PATH}/${item.slug}`,
  });
}

export default async function CreatorResourceDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = getCreatorResource(slug);
  if (!item) notFound();

  const origin = siteBaseUrl().origin;
  const canonicalUrl = `${origin}${CREATOR_LIBRARY_PATH}/${item.slug}`;
  const related = relatedCreatorResources(item, 3);
  const oculusSounds = oculusSoundsForGroup(item.oculusGroupSlug);

  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    url: canonicalUrl,
    description: item.description,
    encodingFormat: item.fileFormat,
    contentSize: item.sizeLabel,
    license: item.licenseLabel,
    creator: {
      "@type": "Organization",
      name: item.creatorCredit,
    },
    publisher: { "@id": `${origin}/#studio` },
    isPartOf: {
      "@type": "CollectionPage",
      url: `${origin}${CREATOR_LIBRARY_PATH}`,
      name: "Ali Arshad Studio — Creator Resource Library",
    },
    distribution: {
      "@type": "DataDownload",
      contentUrl: item.downloadUrl,
      encodingFormat: item.fileFormat,
      contentSize: item.sizeLabel,
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Creator Resource Library", path: CREATOR_LIBRARY_PATH },
          { name: item.title, path: `${CREATOR_LIBRARY_PATH}/${item.slug}` },
        ]}
      />

      <section className="section section--tight" aria-labelledby="resource-title">
        <div className="container">
          <Link href={CREATOR_LIBRARY_PATH} className="back-link">
            <span aria-hidden="true">←</span>
            <span>Back to Creator Resource Library</span>
          </Link>

          <div className="clib-detail-grid">
            <div className="clib-detail__media">
              <ResourcePreviewMedia item={item} mode="detail" />

              {item.previewAudio.length > 1 ? (
                <div className="panel clib-detail__audio-list">
                  <p className="label" style={{ marginBottom: "10px" }}>
                    Audio previews from this package
                  </p>
                  <ul className="clib-preview-tracks">
                    {item.previewAudio.map((tr) => (
                      <li key={tr.src}>
                        <div className="clib-preview-tracks__head">
                          <strong>{tr.label}</strong>
                          <span>{tr.durationSec}s</span>
                        </div>
                        <audio controls preload="none" className="clib-stage__audio-el" aria-label={`Play ${tr.label}`}>
                          <source src={tr.src} type="audio/mpeg" />
                        </audio>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="clib-detail__info">
              <div className="clib-card__top" style={{ marginBottom: "8px" }}>
                <span className="eyebrow eyebrow--plain" style={{ marginBottom: 0 }}>
                  {item.category}
                </span>
                <span className={`badge ${item.isThirdParty ? "badge--concept" : "badge--demo"}`}>
                  {item.isThirdParty ? "Curated Third-Party Asset" : "Ali Arshad Studio Original"}
                </span>
              </div>

              <h1 className="section-title" id="resource-title">
                {item.title}
              </h1>

              <p className="lead" style={{ marginTop: "12px" }}>
                {item.description}
              </p>

              <div className="hero__actions" style={{ marginTop: "20px" }}>
                <a
                  href={item.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={item.downloadFilename}
                  className="btn btn--primary btn--md"
                >
                  <span>Download {item.downloadFilename} ({item.sizeLabel})</span>
                  <Icon name="arrow-up-right" size={16} className="btn__icon" />
                </a>
              </div>

              <p className="notice" style={{ marginTop: "16px" }}>
                <Icon name="alert" size={18} />
                <span>{item.attributionNote}</span>
              </p>

              <dl className="panel clib-spec-table">
                <div>
                  <dt>File Format</dt>
                  <dd>{item.fileFormat}</dd>
                </div>
                <div>
                  <dt>Download Size</dt>
                  <dd>
                    {item.sizeLabel} ({item.sizeBytes.toLocaleString()} bytes)
                  </dd>
                </div>
                <div>
                  <dt>Software Compatibility</dt>
                  <dd>{item.compatibility}</dd>
                </div>
                <div>
                  <dt>Original Creator / Source</dt>
                  <dd>{item.creatorCredit}</dd>
                </div>
                <div>
                  <dt>License / Usage</dt>
                  <dd>{item.licenseLabel}</dd>
                </div>
                <div>
                  <dt>Original Source File</dt>
                  <dd>
                    <code>{item.sourceFilename}</code>
                  </dd>
                </div>
                <div>
                  <dt>SHA-256 Checksum</dt>
                  <dd>
                    <code>{item.sha256}</code>
                  </dd>
                </div>
                <div>
                  <dt>Files in Package</dt>
                  <dd>{item.fileCount.toLocaleString()}</dd>
                </div>
              </dl>

              <div className="panel clib-included">
                <p className="label">Included files &amp; contents</p>
                <ul className="plain-list">
                  {item.includedFiles.map((f) => (
                    <li key={f}>
                      <code>{f}</code>
                    </li>
                  ))}
                </ul>
              </div>

              <ul className="tag-list" aria-label="Resource tags" style={{ marginTop: "14px" }}>
                {item.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {oculusSounds.length > 0 ? (
        <section className="section section--tight" aria-label="Included Oculus sound effects index">
          <div className="container">
            <OculusSoundExplorer
              sounds={oculusSounds}
              heading={
                item.oculusGroupSlug === "ALL"
                  ? `Search all ${oculusSounds.length} included Oculus Audio Pack 01 sounds`
                  : `Browse all ${oculusSounds.length} sounds inside this pack`
              }
              showGroupLinks={item.oculusGroupSlug === "ALL"}
            />
          </div>
        </section>
      ) : null}

      {/* Connected Studio Services */}
      <section className="section section--surface section--tight" aria-labelledby="resource-services-title">
        <div className="container">
          <div className="panel home-directory-strip">
            <div>
              <p className="eyebrow eyebrow--plain">Related Ali Arshad Studio services</p>
              <h2 className="card-title" id="resource-services-title" style={{ marginTop: "4px" }}>
                Need bespoke editing, motion design, or 3D production using workflows like this?
              </h2>
            </div>
            <div className="location-pill-list">
              {item.relatedServices.map((href) => (
                <Link key={href} href={href} className="location-pill location-pill--all">
                  {SERVICE_LINK_LABELS[href] ?? href} →
                </Link>
              ))}
              <Link href="/contact?service=Creative%20Production" className="location-pill">
                Start a Creative Project
              </Link>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="section section--tight" aria-labelledby="related-resources-title">
          <div className="container">
            <div className="section-head">
              <p className="eyebrow eyebrow--plain">More in the library</p>
              <h2 className="section-title section-title--sm" id="related-resources-title">
                Related creator downloads
              </h2>
            </div>
            <ul className="hub-card-grid">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`${CREATOR_LIBRARY_PATH}/${r.slug}`} className="hub-link-card">
                    <span className="hub-link-card__kind">
                      {r.category} · {r.sizeLabel}
                    </span>
                    <span className="hub-link-card__title">
                      <span>{r.title}</span>
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                    <span className="hub-link-card__desc">{r.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <ContactCTA
        standalone
        eyebrow="Ali Arshad Personal Studio"
        title="Looking for custom video editing, motion graphics, or 3D product visuals?"
        text="Share your brief or timeline goals—I deliver bespoke creative production, web engineering, and automation directly."
        button="Discuss your project"
        href="/contact?service=Creative%20Production"
        secondaryHref={CREATOR_LIBRARY_PATH}
        secondaryLabel="Browse full Creator Library"
      />
    </>
  );
}
