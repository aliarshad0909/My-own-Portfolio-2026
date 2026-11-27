/**
 * Explicitly synthetic demo fixtures used ONLY when `ADMIN_DEMO_MODE=true`.
 * Every record carries `isDemo: true` (or `source: "demo"`) and clearly fictional
 * names/domains so demo mode can never be mistaken for real client inquiries,
 * real collaborators, or connected production accounts.
 */
import type {
  AdminContactInquiry,
  AdminStudioApplication,
  AdminWorkflowItem,
  GmailMessageSummary,
  ListmonkCampaign,
  ListmonkList,
  PostizChannel,
  PostizPost,
  TwentyCompany,
  TwentyOpportunity,
  TwentyPerson,
  TwentyTask,
} from "@/lib/admin/types";

export const DEMO_INQUIRIES: AdminContactInquiry[] = [
  {
    id: "demo_inq_1",
    name: "Sample Contact — Priya Nair (Demo)",
    email: "priya.demo@example.invalid",
    company: "Alder & Loom Home Goods (Fictional Demo)",
    service: "Web & Software Development",
    description:
      "[DEMO DATA] Looking to replace manual inventory spreadsheets with a custom Next.js + PostgreSQL operations console connected to our Shopify catalog.",
    budget: "$5,000 to $15,000",
    timeline: "1 to 3 months",
    status: "new",
    notes: "Demo record only — not a real inquiry.",
    deliveryChannel: "demo",
    receivedAt: "2026-11-24T14:20:00.000Z",
    isDemo: true,
  },
  {
    id: "demo_inq_2",
    name: "Sample Contact — Elena Morales (Demo)",
    email: "elena.demo@example.invalid",
    company: "Beaconfield Supply (Fictional Demo)",
    service: "AI Agents & Workflow Automation",
    description:
      "[DEMO DATA] Exploring a self-hosted n8n lead-routing workflow with CRM deduplication and Slack alerts for incoming quote requests.",
    budget: "$1,000 to $5,000",
    timeline: "Within 1 month",
    status: "reviewing",
    notes: "Demo record only — not a real inquiry.",
    deliveryChannel: "demo",
    receivedAt: "2026-11-23T09:15:00.000Z",
    isDemo: true,
  },
];

export const DEMO_APPLICATIONS: AdminStudioApplication[] = [
  {
    id: "demo_app_1",
    name: "Sample Applicant — Devon Park (Demo)",
    email: "devon.demo@example.invalid",
    locationTimezone: "Chicago, IL (US Central)",
    skills: ["Full-Stack Web / Next.js", "AI Agents & Workflow Automation (n8n)"],
    portfolioUrl: "https://example.invalid/devon-demo",
    availability: "Project-based / Part-time",
    introduction:
      "[DEMO DATA] Synthetic sample application showing how private Studio Network registrations appear before manual verification and moderation.",
    publicListingOptIn: false,
    approximateRegion: "",
    moderationStatus: "private_pending",
    notes: "Demo record only — private by default.",
    receivedAt: "2026-11-24T11:05:00.000Z",
    isDemo: true,
  },
];

export const DEMO_WORKFLOW_ITEMS: AdminWorkflowItem[] = [
  {
    id: "demo_wf_1",
    title: "[Demo] Publish FinanceOS architecture walkthrough on Studio Blog",
    kind: "content",
    status: "in_progress",
    linkedSlug: "financeos-accounting-suite",
    dueDate: "2026-12-02",
    notes: "Synthetic demo task — connect Neon PostgreSQL to persist real studio workflow items.",
    updatedAt: "2026-11-24T16:00:00.000Z",
    isDemo: true,
  },
  {
    id: "demo_wf_2",
    title: "[Demo] Prepare Q1 n8n Automation case-study newsletter draft",
    kind: "campaign_idea",
    status: "backlog",
    linkedSlug: "inbound-lead-qualification-workflow",
    dueDate: "2026-12-10",
    notes: "Synthetic demo task — draft in Listmonk once connected.",
    updatedAt: "2026-11-22T10:30:00.000Z",
    isDemo: true,
  },
];

export const DEMO_LISTMONK_LISTS: ListmonkList[] = [
  { id: 101, name: "[Demo] Studio Dispatch Subscribers", type: "public", subscriberCount: 0, isDemo: true },
  { id: 102, name: "[Demo] B2B Automation Prospects", type: "private", subscriberCount: 0, isDemo: true },
];

export const DEMO_LISTMONK_CAMPAIGNS: ListmonkCampaign[] = [
  {
    id: 501,
    name: "[Demo Draft] November Engineering Notes",
    subject: "[Demo] Inside Our PostgreSQL SaaS Sandboxes & n8n Guardrails",
    status: "draft",
    contentType: "richtext",
    lists: [{ id: 101, name: "[Demo] Studio Dispatch Subscribers" }],
    sendAt: null,
    createdAt: "2026-11-23T12:00:00.000Z",
    views: 0,
    clicks: 0,
    sent: 0,
    body: "<p>[DEMO DRAFT] Connect your self-hosted Listmonk instance to manage real campaigns.</p>",
    isDemo: true,
  },
];

export const DEMO_POSTIZ_CHANNELS: PostizChannel[] = [
  { id: "demo_li", name: "LinkedIn (Demo Placeholder)", provider: "linkedin", isDemo: true },
  { id: "demo_ig", name: "Instagram (Demo Placeholder)", provider: "instagram", isDemo: true },
];

export const DEMO_POSTIZ_POSTS: PostizPost[] = [
  {
    id: "demo_post_1",
    content: "[DEMO DRAFT] Breakdown of how we tested 15 n8n workflow nodes locally with deterministic fixtures.",
    state: "DRAFT",
    publishDate: "2026-12-01T15:00:00.000Z",
    channelId: "demo_li",
    channelName: "LinkedIn (Demo Placeholder)",
    provider: "linkedin",
    isDemo: true,
  },
];

export const DEMO_TWENTY_PEOPLE: TwentyPerson[] = [
  {
    id: "demo_p_1",
    firstName: "Priya (Demo)",
    lastName: "Nair",
    email: "priya.demo@example.invalid",
    jobTitle: "Operations Director (Fictional)",
    companyName: "Alder & Loom (Demo)",
    city: "Austin, TX",
    createdAt: "2026-11-20T08:00:00.000Z",
    source: "demo",
  },
];

export const DEMO_TWENTY_COMPANIES: TwentyCompany[] = [
  {
    id: "demo_c_1",
    name: "Alder & Loom Home Goods (Demo)",
    domain: "alderloom.example.invalid",
    employees: 24,
    city: "Austin, TX",
    source: "demo",
  },
];

export const DEMO_TWENTY_OPPORTUNITIES: TwentyOpportunity[] = [
  {
    id: "demo_o_1",
    name: "[Demo] Custom Inventory Console Scope",
    stage: "PROPOSAL",
    amountUsd: 12000,
    closeDate: "2026-12-15",
    companyName: "Alder & Loom Home Goods (Demo)",
    source: "demo",
  },
];

export const DEMO_TWENTY_TASKS: TwentyTask[] = [
  {
    id: "demo_t_1",
    title: "[Demo] Send written phase-1 scope summary",
    status: "TODO",
    dueAt: "2026-11-28T17:00:00.000Z",
    source: "demo",
  },
];

export const DEMO_GMAIL_MESSAGES: GmailMessageSummary[] = [
  {
    id: "demo_msg_1",
    threadId: "demo_thr_1",
    from: "demo.sender@example.invalid",
    subject: "[Demo] Sample Gmail metadata preview (connect Google OAuth for live inbox)",
    date: "2026-11-24T13:00:00.000Z",
    snippet: "Synthetic placeholder shown only because ADMIN_DEMO_MODE=true.",
    labels: ["INBOX", "DEMO"],
    gmailUrl: "https://mail.google.com/mail/u/0/#inbox",
    isDemo: true,
  },
];
