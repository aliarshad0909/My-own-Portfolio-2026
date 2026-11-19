import type { FlowStep } from "@/components/services/FlowDiagram";
import type { FaqItem } from "@/lib/structured-data";
import type { PublicationState } from "@/lib/seo/publication";

export type SpokeDeliverable = { title: string; detail: string };

export type ServiceSpoke = {
  /** Last path segment: /services/<hubSlug>/<slug>. */
  slug: string;
  keywordId: string;
  title: string;
  h1: string;
  lead: string;
  /** Concise positioning context shown beneath the hero lead. */
  body: string[];
  /** Specific client bottlenecks this specialization solves. */
  problems: string[];
  /** Concrete deliverables produced in this specialization. */
  deliverables: SpokeDeliverable[];
  /** Visual 4-step workflow sequence rendered via FlowDiagram. */
  workflow: {
    title: string;
    caption: string;
    steps: FlowStep[];
  };
  /** Relevant technologies, platforms or frameworks. */
  stack: string[];
  /** Optional candid caveat or scope boundary. */
  scopeNotice?: string;
  /** Optional related calculator or guide path. */
  relatedTool?: { href: string; label: string };
  /** Search-intent FAQs rendered with FAQPage JSON-LD. */
  faqs: FaqItem[];
  projectSlugs: string[];
  publicationState: PublicationState;
};

