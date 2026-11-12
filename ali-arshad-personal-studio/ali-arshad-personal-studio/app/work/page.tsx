import type { Metadata } from "next";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { PageHero } from "@/components/ui/PageHero";
import { WorkGallery } from "@/components/work/WorkGallery";
import { PROJECTS } from "@/lib/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description: "Portfolio of creative production, 3D and motion, branding, web and software, AI automation and business projects by Ali Arshad.",
  path: "/work",
});

export default function WorkPage() {
  const hasPlaceholders = PROJECTS.some((p) => p.status === "placeholder");
  return (
    <>
      <PageHero
        eyebrow="Work"
        title={
          <>
            Projects across <span className="accent">creative, technical and business</span> work
          </>
        }
        lead="Browse by discipline. Each project shows what was made and the part I played in it."
      />
      <section className="section section--flush-top" aria-label="Projects">
        <div className="container">
          {hasPlaceholders ? (
            <p className="notice notice--wide">
              Cards marked &ldquo;Placeholder&rdquo; use sample artwork to preview this gallery. They are not client projects — verified work is being added.
            </p>
          ) : null}
          <WorkGallery projects={PROJECTS} />
        </div>
      </section>
      <ContactCTA standalone />
    </>
  );
}
