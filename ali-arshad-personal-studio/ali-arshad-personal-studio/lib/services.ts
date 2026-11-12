import type { IconName } from "@/components/ui/Icon";

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
