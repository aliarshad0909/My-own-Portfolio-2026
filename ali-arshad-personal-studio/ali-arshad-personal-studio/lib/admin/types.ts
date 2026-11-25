/**
 * Shared TypeScript contracts for the Private Studio Admin Console (/admin).
 * Safe to import from both client and server modules — no secrets or Node APIs.
 */

export type ServiceHealthState = "connected" | "needs_setup" | "offline" | "error";

export type IntegrationStatusSummary = {
  id:
    | "database"
    | "redis"
    | "resend"
    | "listmonk"
    | "postiz"
    | "twenty"
    | "gmail"
    | "github";
  name: string;
  category: "infrastructure" | "email" | "social" | "crm" | "platform";
  state: ServiceHealthState;
  detail: string;
  baseUrlHost?: string;
  docsAnchor: string;
  checkedAt: string;
};

export type InquiryStatus = "new" | "reviewing" | "replied" | "archived";

export type AdminContactInquiry = {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  description: string;
  budget: string;
  timeline: string;
  status: InquiryStatus;
  notes: string;
  deliveryChannel: string;
  receivedAt: string;
  isDemo?: boolean;
};

export type ApplicationModerationStatus =
  | "private_pending"
  | "verified_private"
  | "approved_public"
  | "rejected"
  | "archived";

export type AdminStudioApplication = {
  id: string;
  name: string;
  email: string;
  locationTimezone: string;
  skills: string[];
  portfolioUrl: string;
  availability: string;
  introduction: string;
  publicListingOptIn: boolean;
  approximateRegion: string;
  moderationStatus: ApplicationModerationStatus;
  notes: string;
  receivedAt: string;
  isDemo?: boolean;
};

export type WorkflowKind = "project" | "content" | "campaign_idea" | "ops_task";
export type WorkflowStatus = "backlog" | "in_progress" | "review" | "scheduled" | "done" | "archived";

export type AdminWorkflowItem = {
  id: string;
  title: string;
  kind: WorkflowKind;
  status: WorkflowStatus;
  linkedSlug: string;
  dueDate: string;
  notes: string;
  updatedAt: string;
  isDemo?: boolean;
};

export type ListmonkList = {
  id: number;
  name: string;
  type: string;
  subscriberCount: number;
  isDemo?: boolean;
};

export type ListmonkCampaign = {
  id: number;
  name: string;
  subject: string;
  status: string;
  contentType: string;
  lists: { id: number; name: string }[];
  sendAt: string | null;
  createdAt: string;
  views: number;
  clicks: number;
  sent: number;
  body?: string;
  isDemo?: boolean;
};

export type PostizChannel = {
  id: string;
  name: string;
  provider: string;
  picture?: string;
  disabled?: boolean;
  isDemo?: boolean;
};

export type PostizPost = {
  id: string;
  content: string;
  state: string;
  publishDate: string | null;
  channelId: string;
  channelName: string;
  provider: string;
  releaseUrl?: string;
  isDemo?: boolean;
};

export type TwentyPerson = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  city: string;
  createdAt: string;
  source: "twenty" | "demo";
};

export type TwentyCompany = {
  id: string;
  name: string;
  domain: string;
  employees: number | null;
  city: string;
  source: "twenty" | "demo";
};

export type TwentyOpportunity = {
  id: string;
  name: string;
  stage: string;
  amountUsd: number | null;
  closeDate: string | null;
  companyName: string;
  source: "twenty" | "demo";
};

export type TwentyTask = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
  source: "twenty" | "demo";
};

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  labels: string[];
  gmailUrl: string;
  isDemo?: boolean;
};

export type PlatformAccountCard = {
  id: "instagram" | "linkedin" | "facebook" | "upwork" | "github";
  name: string;
  profileUrl: string;
  connectionState: ServiceHealthState;
  connectionNote: string;
  supportedViaConsole: string[];
  nativeOnlyActions: string[];
  nativeActionLinks: { label: string; href: string }[];
};

export type AdminPreferences = {
  timezone: string;
  compactMode: boolean;
  defaultListmonkTimezone: string;
  updatedAt: string;
};

export type AdminSessionPublic = {
  email: string;
  csrfToken: string;
  expiresAt: string;
  demoMode: boolean;
};
