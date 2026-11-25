import type { Metadata } from "next";
import { ProjectPlanner } from "@/components/planner/ProjectPlanner";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHero } from "@/components/ui/PageHero";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Visual Project Planner & Discovery Brief Builder",
  description:
    "Explore layout styles, palettes, typography, features, and integrations in real time — then export a structured, privacy-safe exploratory discovery brief for your project.",
  path: "/project-planner",
});

export default function ProjectPlannerPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Project Planner", path: "/project-planner" },
        ]}
      />

      <PageHero
        eyebrow="Interactive Discovery Tool · Local-Only Privacy"
        title={
          <>
            Shape your project visually before <span className="accent">writing a single spec</span>
          </>
        }
        lead="Not sure how to describe the look, structure, or technical scope you want? Step through goals, features, color palettes, typography, and layout patterns while watching a live mockup adapt in real time."
      />

      <section className="section section--flush-top" aria-label="Interactive Project Planner">
        <div className="container">
          <ProjectPlanner />
        </div>
      </section>

      <ContactCTA
        standalone
        eyebrow="Ready to turn this brief into a real scope?"
        title="Bring your discovery brief to a short, practical scoping conversation."
        text="Paste your exported brief into the contact form or share it on LinkedIn or Upwork. I reply personally with honest thoughts on sequence, trade-offs, and realistic v1 boundaries."
        button="Discuss your brief"
      />
    </>
  );
}
