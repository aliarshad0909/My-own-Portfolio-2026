import type { Metadata } from "next";
import { FictionalCustomerShowcase } from "@/components/locations/FictionalCustomerShowcase";
import { ContactCTA } from "@/components/sections/ContactCTA";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/ui/PageHero";
import { FICTIONAL_DEMO_PROFILES } from "@/lib/geo/fictional-profiles";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Fictional Demo Customer Scenarios (Not Real Clients)",
  description:
    "Three transparently fictional demo organizations illustrating how Ali Arshad Personal Studio services, demos, and workflows apply to retail, B2B supply, and remote SaaS operations.",
  path: "/demo-scenarios",
  index: false,
});

export default function FictionalScenariosIndexPage() {
  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Locations", path: "/locations" },
          { name: "Fictional Demo Scenarios", path: "/demo-scenarios" },
        ]}
      />
      <PageHero
        eyebrow="Illustrative Walkthroughs · Not Real Clients"
        title="Fictional demo customer scenarios"
        lead="Inspect three completely invented organizations — complete with synthetic regional map markers and AI-illustrated fictional team hierarchies — showing how studio software and workflows fit real operating models."
      >
        <div className="hero__actions">
          <ButtonLink href="/project-planner">Launch Visual Project Planner</ButtonLink>
          <ButtonLink href="/locations" variant="secondary" icon={null}>
            Remote US Coverage
          </ButtonLink>
        </div>
      </PageHero>

      <section className="section section--flush-top">
        <div className="container">
          <FictionalCustomerShowcase locationLabel="US remote engagements" profiles={FICTIONAL_DEMO_PROFILES} />
        </div>
      </section>

      <ContactCTA standalone />
    </>
  );
}
