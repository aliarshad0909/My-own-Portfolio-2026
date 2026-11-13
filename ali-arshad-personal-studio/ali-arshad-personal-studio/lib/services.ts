import type { IconName } from "@/components/ui/Icon";
import { PROJECTS, isLive, type Project } from "@/lib/projects";

export type Service = {
  /** Used as the anchor on /services, e.g. /services#creative-production */
  id: string;
  title: string;
  /** Short label used on cards and in the contact form. */
  shortTitle: string;
  icon: IconName;
  /** One-line summary for the homepage dashboard. */
  summary: string;
  /** Commercial description for the services page. */
  description: string;
  capabilities: string[];
  clients: string[];
  /** Example deliverables — illustrative scopes, not past client work. */
  examples: string[];
  /**
   * One line on where this service sits commercially. Used as the standfirst
   * on /services, above the longer description.
   */
  positioning: string;
  /** Client problems this service exists to solve. Phrased as the client would say them. */
  problems: string[];
  /**
   * Slugs from lib/projects.ts that demonstrate this service. The project data
   * itself is never duplicated here — `projectsForService` resolves these
   * against PROJECTS so there is one source of truth.
   */
  projectSlugs: string[];
  /** Partner-delivered capability rather than Ali's direct specialism. */
  partnerDelivered?: boolean;
  /** Extra caveat shown with the service (e.g. legal limits on sourcing). */
  note?: string;
  /** Shown on the homepage dashboard. */
  featured: boolean;
};

export const SERVICES: Service[] = [
  {
    id: "creative-production",
    title: "Creative Production",
    shortTitle: "Creative Production",
    icon: "clapperboard",
    summary: "3D, video, motion and graphic design",
    description:
      "Visual content that makes a product easy to understand and hard to scroll past — from 3D product renders in Blender to edited video, motion graphics and campaign-ready graphics.",
    capabilities: [
      "Blender 3D visualization",
      "Product visualization",
      "Video editing",
      "Motion graphics",
      "Brand advertisements",
      "Social media video production",
      "Graphic design",
    ],
    clients: ["Product and e-commerce brands", "Founders preparing a launch", "Marketing teams needing extra production capacity"],
    positioning:
      "Visual storytelling that makes a product easy to understand and hard to scroll past.",
    problems: [
      "Our product is hard to explain in a photograph",
      "We need launch content faster than an agency can turn it around",
      "Our social ads look homemade next to our competitors'",
      "We have no product photography and no budget for a shoot",
    ],
    projectSlugs: [
      "blender-product-visualisation",
      "motion-production-pipeline",
    ],
    examples: [
      "A set of 3D product renders for a store or crowdfunding page",
      "Short-form ad edits cut for Reels, TikTok and Shorts",
      "An animated logo sting and motion templates for a brand",
    ],
    featured: true,
  },
  {
    id: "web-development",
    title: "Web & Software Development",
    shortTitle: "Web & App Development",
    icon: "code",
    summary: "Websites, dashboards and business apps",
    description:
      "Fast, maintainable websites and web applications built around how your business actually works — with clean frontends, dependable backends and the integrations that connect them.",
    capabilities: [
      "Responsive websites",
      "Frontend development",
      "Backend development",
      "APIs and integrations",
      "Custom dashboards",
      "Business applications",
      "E-commerce solutions",
    ],
    clients: ["Small and growing businesses", "Brands replacing an outdated site", "Teams that need an internal tool or dashboard"],
    positioning:
      "Digital products built around how your business actually works, not around a template.",
    problems: [
      "Our website looks dated and we cannot update it ourselves",
      "We are running the business out of spreadsheets",
      "Our tools do not talk to each other",
      "We need a storefront that handles our real stock and shipping rules",
    ],
    projectSlugs: [
      "tessera-clayworks-storefront",
      "northwind-analytics-dashboard",
      "meridian-inventory-operations",
    ],
    examples: [
      "A marketing website with a CMS-ready content structure",
      "An internal dashboard pulling data from existing tools",
      "A storefront connected to inventory and order workflows",
    ],
    featured: true,
  },
  {
    id: "ai-automation",
    title: "AI Agents & Automation",
    shortTitle: "AI Agents & Automation",
    icon: "bot",
    summary: "n8n workflows, AI agents and CRM automation",
    description:
      "Automation that removes repetitive work from sales, support and operations — designed around your existing tools, with clear hand-offs to people where judgement matters.",
    capabilities: [
      "n8n workflows",
      "Custom AI agents",
      "Sales voice agents",
      "Inbound customer-service automation",
      "Lead qualification",
      "CRM integrations",
      "Automated business operations",
    ],
    clients: ["Service businesses handling high inquiry volume", "Sales teams following up leads manually", "Operators running work across disconnected tools"],
    positioning:
      "Automation that takes repetitive work off people, with clear hand-offs where judgement matters.",
    problems: [
      "We answer the same support questions every day",
      "Leads sit untouched because nobody has time to qualify them",
      "Someone copies data between two systems by hand every morning",
      "Our reporting takes a day to assemble each month",
    ],
    projectSlugs: [
      "tideline-support-agent",
      "kestrel-voice-sales-agent",
      "inbound-lead-qualification-workflow",
    ],
    examples: [
      "An inquiry workflow that qualifies leads and updates the CRM",
      "A first-line support agent with escalation to a person",
      "Automated reporting that collects data from several apps",
    ],
    featured: true,
  },
  {
    id: "brand-growth",
    title: "Brand Management & Growth",
    shortTitle: "Brand & Growth",
    icon: "trending",
    summary: "Brand strategy, social, email and content",
    description:
      "Hands-on brand management that keeps messaging consistent and marketing moving — strategy, content and the day-to-day coordination that turns plans into published work.",
    capabilities: [
      "Brand strategy",
      "Social media management",
      "Email marketing",
      "Advertising coordination",
      "Content strategy",
      "Sales support",
      "Marketing operations",
    ],
    clients: ["Brands entering or growing in the US market", "Founders who need a marketing lead without a full team", "Businesses relaunching their positioning"],
    positioning:
      "Consistent brand execution — strategy, creative and the coordination that gets work published.",
    problems: [
      "Our brand looks different on every channel",
      "We have a plan but nothing ships on schedule",
      "We need a marketing lead without hiring a full team",
      "Our email list is sitting there doing nothing",
    ],
    projectSlugs: [
      "halcyon-brand-system",
    ],
    examples: [
      "A monthly content plan with production and publishing",
      "An email programme with welcome and re-engagement flows",
      "Campaign coordination across creative, ads and sales",
    ],
    featured: true,
  },
  {
    id: "global-sourcing",
    title: "Global Sourcing & Supply Chain",
    shortTitle: "Global Sourcing",
    icon: "globe",
    summary: "Supplier discovery and logistics coordination",
    description:
      "Practical sourcing support grounded in supply chain management — finding and vetting suppliers in China, coordinating samples and orders, and keeping shipments on track.",
    capabilities: [
      "China-based supplier discovery",
      "Product sourcing coordination",
      "Procurement research",
      "Supplier communication",
      "Shipping and logistics coordination",
      "International supply chain support",
    ],
    clients: ["E-commerce sellers developing new products", "Brands looking for alternative suppliers", "Businesses importing for the first time"],
    positioning:
      "Sourcing and supply chain support grounded in a supply chain management background.",
    problems: [
      "We do not know whether our supplier's quote is competitive",
      "We are importing for the first time and do not know the real landed cost",
      "Our current supplier has become unreliable and we need alternatives",
      "Samples and orders stall because nobody is chasing them",
    ],
    projectSlugs: [
      "lantern-sourcing-platform",
      "meridian-inventory-operations",
    ],
    examples: [
      "A supplier shortlist with quotes and sample coordination",
      "Order follow-up and communication through to shipment",
      "Research on landed cost and shipping options",
    ],
    note: "Every sourcing request is subject to product, import and export restrictions in the countries involved. Feasibility is confirmed before any commitment.",
    featured: true,
  },
  {
    id: "specialist-collaboration",
    title: "Specialist Technical Collaboration",
    shortTitle: "Specialist Collaboration",
    icon: "users",
    summary: "Blockchain, security and specialist engineering with partners",
    description:
      "Some projects need deep specialist expertise. For these, I bring in qualified partners and manage the collaboration, so you keep one point of contact while the specialist work is done by people who do it every day.",
    capabilities: [
      "Blockchain-related development",
      "Cybersecurity-related project support",
      "Specialist engineering collaboration",
    ],
    clients: ["Projects with a specialist component inside a wider build", "Businesses that want one accountable coordinator"],
    positioning:
      "A single point of contact for projects that need expertise outside my own.",
    problems: [
      "Part of our build needs a specialist we do not have",
      "We want one person accountable rather than three vendors",
      "We need a security review before launch",
    ],
    projectSlugs: [
      "ledgerlight-block-explorer",
      "sentryline-security-posture",
    ],
    examples: [
      "Scoping a blockchain feature with a partner developer",
      "Arranging a security review before a product launch",
    ],
    partnerDelivered: true,
    note: "These capabilities are delivered with trusted partners, not as my own direct specialism. Partner involvement is always agreed with you upfront.",
    featured: false,
  },
];

export const getService = (id: string) => SERVICES.find((s) => s.id === id);

/** Services shown in the page navigation and on the homepage dashboard. */
export const featuredServices = () => SERVICES.filter((s) => s.featured);

/**
 * Resolve a service's demonstrations against the real project records.
 *
 * Slugs that no longer exist are dropped rather than rendered as a dead link,
 * so deleting a project from lib/projects.ts can never leave a broken card
 * behind on /services.
 */
export function projectsForService(id: string, { liveOnly = false } = {}): Project[] {
  const service = getService(id);
  if (!service) return [];
  return service.projectSlugs
    .map((slug) => PROJECTS.find((p) => p.slug === slug))
    .filter((p): p is Project => p !== undefined)
    .filter((p) => (liveOnly ? isLive(p) : true));
}

/** The reverse lookup: which services a project demonstrates. Used on case studies. */
export const servicesForProject = (slug: string): Service[] =>
  SERVICES.filter((s) => s.projectSlugs.includes(slug));

/** Deep link to the contact form with the service pre-selected. */
export const contactHref = (service: Service) => `/contact?service=${encodeURIComponent(service.title)}`;

/**
 * Where "View related work" points. A service with a single demonstration goes
 * straight to that project; otherwise to the filtered gallery.
 */
export function relatedWorkHref(service: Service): string {
  const projects = projectsForService(service.id);
  if (projects.length === 1) return `/work/${projects[0].slug}`;
  return `/work?service=${encodeURIComponent(service.id)}`;
}
