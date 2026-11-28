import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CreatorLibraryBrowser } from "@/components/creator-library/CreatorLibraryBrowser";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/ui/PageHero";
import {
  CREATOR_LIBRARY_CATEGORIES,
  CREATOR_LIBRARY_EXCEPTIONS,
  CREATOR_LIBRARY_ITEMS,
  CREATOR_LIBRARY_PATH,
  CREATOR_LIBRARY_STATS,
} from "@/lib/creator-library";
import { INTERVIEW_FEATURE } from "@/lib/interview-feature";
import { pageMetadata } from "@/lib/seo";
import { siteBaseUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Creator Resource Library — Free Blender Scenes, AE Templates & 508 SFX",
  description: `Browse and download ${CREATOR_LIBRARY_STATS.totalResources} curated creator resources — Blender 3D scenes & CC0 models, After Effects & Premiere templates, transitions, all ${CREATOR_LIBRARY_STATS.totalOculusSounds} Oculus Audio Pack 01 sound effects (CC BY 4.0), lossless voiceover cues, and starter packs.`,
  path: CREATOR_LIBRARY_PATH,
});

export default function CreatorLibraryPage() {
  const origin = siteBaseUrl().origin;

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ali Arshad Studio — Creator Resource Library",
    url: `${origin}${CREATOR_LIBRARY_PATH}`,
    description: `Curated, searchable library of ${CREATOR_LIBRARY_STATS.totalResources} downloadable resources spanning Blender scenes, After Effects templates, Premiere transitions, ${CREATOR_LIBRARY_STATS.totalOculusSounds} Oculus Audio Pack 01 sound effects, voiceover WAV cues, high-resolution photography, and video editing starter packs.`,
    isPartOf: { "@id": `${origin}/#website` },
    publisher: { "@id": `${origin}/#studio` },
    numberOfItems: CREATOR_LIBRARY_STATS.totalResources,
    inLanguage: "en",
  };

  return (
    <>
      <JsonLd data={collectionSchema} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Creator Resource Library", path: CREATOR_LIBRARY_PATH },
        ]}
      />

      <PageHero
        eyebrow={`Ali Arshad Studio · ${CREATOR_LIBRARY_STATS.totalResources} Downloadable Packages · ${CREATOR_LIBRARY_STATS.totalOculusSounds} Indexed SFX`}
        title={
          <>
            Creator <span className="accent">Resource Library</span>
          </>
        }
        lead={`Free, verified downloads for video editors, motion designers, and 3D artists — spanning Blender splash & CC0 scenes, After Effects & Premiere templates, transitions, all ${CREATOR_LIBRARY_STATS.totalOculusSounds} Oculus Audio Pack 01 sound effects, voiceover cues, stock plates, and an all-in-one editing starter library.`}
      >
        <div className="hero__actions">
          <a href="#browse-library" className="btn btn--primary btn--md">
            <span>Browse all {CREATOR_LIBRARY_STATS.totalResources} resources</span>
            <Icon name="arrow-right" size={16} className="btn__icon" />
          </a>
          <ButtonLink href="/services/creative-production" variant="secondary" icon={null}>
            Video &amp; Motion Services
          </ButtonLink>
          <ButtonLink href="/services/creative-production#motion-examples" variant="secondary" icon={null}>
            Watch 14 Portfolio Videos
          </ButtonLink>
          <ButtonLink href={`/about#${INTERVIEW_FEATURE.anchorId}`} variant="secondary" icon={null}>
            Meet Ali ({INTERVIEW_FEATURE.durationLabel})
          </ButtonLink>
        </div>
      </PageHero>

      {/* Transparent Attribution & External Storage Disclosure */}
      <section className="container" aria-label="Library stats and third-party attribution notice">
        <dl className="clib-stats panel">
          <div>
            <dt>Download Packages</dt>
            <dd>
              <strong>{CREATOR_LIBRARY_STATS.totalResources}</strong>
              <span>Across {CREATOR_LIBRARY_CATEGORIES.length} categories</span>
            </dd>
          </div>
          <div>
            <dt>Oculus SFX Indexed</dt>
            <dd>
              <strong>{CREATOR_LIBRARY_STATS.totalOculusSounds}</strong>
              <span>OGG &amp; 48 kHz WAV packs</span>
            </dd>
          </div>
          <div>
            <dt>Total Library Weight</dt>
            <dd>
              <strong>{CREATOR_LIBRARY_STATS.totalDownloadSizeLabel}</strong>
              <span>Hosted off-bundle via CDN</span>
            </dd>
          </div>
          <div>
            <dt>Access Model</dt>
            <dd>
              <strong>Direct</strong>
              <span>Zero email walls or gates</span>
            </dd>
          </div>
        </dl>

        <p className="notice notice--wide" style={{ marginTop: "16px" }}>
          <Icon name="alert" size={18} />
          <span>
            <strong>Curated library &amp; creator attribution notice:</strong> This hub is curated and hosted by{" "}
            <strong>Ali Arshad Personal Studio</strong>, but third-party assets (including Oculus Audio Pack 01 by Oculus VR, LLC under CC BY 4.0,
            Poly Haven CC0 3D models, Graphic Foundry CC0 After Effects files, Blender Foundation / Erindale Woodford scenes, Mixkit templates, and
            editorial photography) are <strong>not claimed as Ali Arshad&rsquo;s original creations</strong>. Original creator credits, intact project
            files, and license files are preserved on every resource page.
          </span>
        </p>
      </section>

      <section className="section section--tight" id="browse-library" aria-labelledby="browse-library-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Search, preview &amp; download</p>
            <h2 className="section-title section-title--sm" id="browse-library-title">
              Filter by category, software format, or creator source
            </h2>
            <p className="section-sub">
              Every card links to a dedicated detail page with full SHA-256 verification, verified compatibility notes, original creator credit,
              included file breakdown, and a direct intact download.
            </p>
          </div>

          <CreatorLibraryBrowser items={CREATOR_LIBRARY_ITEMS} />
        </div>
      </section>

      {/* Transparent Exceptions & Audit Log */}
      <section className="section section--surface section--tight" aria-labelledby="library-exceptions-title">
        <div className="container">
          <details className="panel clib-exceptions">
            <summary id="library-exceptions-title">
              <span>
                Source inventory audit &amp; excluded files ({CREATOR_LIBRARY_EXCEPTIONS.length} non-publishable duplicates &amp; incomplete downloads)
              </span>
            </summary>
            <p className="fine-print" style={{ marginTop: "10px" }}>
              Out of {CREATOR_LIBRARY_STATS.totalTopLevelSourceFiles} top-level files inspected in the source folder, all{" "}
              {CREATOR_LIBRARY_STATS.publishedUniqueTopLevelSources} unique usable source files (plus extracted standalone assets and 10 thematic
              Oculus SFX packs) are published above. Only exact SHA-256 duplicates and incomplete browser <code>.crdownload</code> files were
              excluded:
            </p>
            <ul className="plain-list" style={{ marginTop: "12px" }}>
              {CREATOR_LIBRARY_EXCEPTIONS.map((ex) => (
                <li key={ex.filename}>
                  <code>{ex.filename}</code> ({ex.sizeLabel}, SHA-256 <code>{ex.sha256}</code>) — {ex.reason}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      {/* Featured First-Party Studio Work: Meet Ali Personal Intro */}
      <section className="section section--tight" aria-labelledby="library-meet-ali-title">
        <div className="container">
          <div className="panel meet-ali-teaser">
            <Link
              href={`/about#${INTERVIEW_FEATURE.anchorId}`}
              className="meet-ali-teaser__media"
              aria-label={`Watch ${INTERVIEW_FEATURE.title}`}
            >
              <Image
                src={INTERVIEW_FEATURE.posterSrc}
                alt={INTERVIEW_FEATURE.posterAlt}
                width={1280}
                height={720}
                loading="eager"
                unoptimized
                sizes="(min-width: 768px) 168px, 148px"
                className="meet-ali-teaser__img"
              />
              <span className="meet-ali-teaser__play" aria-hidden="true">
                <Icon name="play" size={16} />
              </span>
            </Link>
            <div className="meet-ali-teaser__copy">
              <div className="meet-ali-teaser__meta">
                <span className="eyebrow eyebrow--plain" style={{ marginBottom: 0 }}>
                  First-Party Studio Showcase
                </span>
                <span className="badge badge--verified">{INTERVIEW_FEATURE.durationLabel} · 1080p HD</span>
              </div>
              <h2 className="card-title" id="library-meet-ali-title">
                {INTERVIEW_FEATURE.title}
              </h2>
              <p className="fine-print">
                See Ali&rsquo;s own Premiere Pro, After Effects, and motion graphics showcase introducing the personal studio behind this library —
                complete with verbatim English captions and transcript.
              </p>
            </div>
            <div className="meet-ali-teaser__actions">
              <Link href={`/about#${INTERVIEW_FEATURE.anchorId}`} className="btn btn--primary btn--sm">
                <span>Watch on About</span>
                <Icon name="play" size={14} className="btn__icon" />
              </Link>
              <Link href="/services/creative-production#motion-examples" className="arrow-link meet-ali-teaser__about">
                <span>All 14 portfolio videos</span>
                <Icon name="arrow-up-right" size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Natural Connection to Studio Services */}
      <section className="section section--tight" aria-labelledby="library-services-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow eyebrow--plain">Need custom production instead of templates?</p>
            <h2 className="section-title section-title--sm" id="library-services-title">
              Connect these creative disciplines directly to a tailored studio build
            </h2>
          </div>

          <ul className="hub-card-grid">
            <li>
              <Link href="/services/creative-production/video-editing" className="hub-link-card">
                <span className="hub-link-card__kind">Video Editing</span>
                <span className="hub-link-card__title">
                  <span>Brand &amp; Creator Video Editing</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Hook-first long-form documentaries, founder explainers, and 9:16 Reels cutdowns delivered with probed web encodes.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/services/creative-production/motion" className="hub-link-card">
                <span className="hub-link-card__kind">Motion Graphics</span>
                <span className="hub-link-card__title">
                  <span>Custom Motion Graphics &amp; Explainers</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Bespoke UI animations, animated brand lockups, and Remotion/After Effects explainers aligned to your brand tokens.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/services/creative-production" className="hub-link-card">
                <span className="hub-link-card__kind">Creative Production Hub</span>
                <span className="hub-link-card__title">
                  <span>14 Playable Videos, 3 VO Cues &amp; 4 Visual Demos</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Inspect Ali&rsquo;s personal studio intro, finished client edits, studio motion reels, Photoshop retouching, Illustrator vectors, and 3D concepts.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/services/gpu-compute" className="hub-link-card">
                <span className="hub-link-card__kind">GPU &amp; Render Compute</span>
                <span className="hub-link-card__title">
                  <span>Quote-Led Single-Host Blender &amp; Linux Compute</span>
                  <Icon name="arrow-up-right" size={16} />
                </span>
                <span className="hub-link-card__desc">
                  Need dedicated workstation compute to render heavy Blender scenes or batch ffmpeg encodes? Request a scoped quote.
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Custom creative & technical studio"
        title="Want custom video edits, motion graphics, or 3D visuals built for your brand?"
        text="Templates and starter packs are great for exploration—when you need bespoke editing, custom motion graphics, or reproducible 3D product visuals, let's scope it directly."
        button="Discuss a creative project"
        href="/contact?service=Creative%20Production"
        secondaryHref="/services/creative-production"
        secondaryLabel="Explore Creative Production"
      />
    </>
  );
}
