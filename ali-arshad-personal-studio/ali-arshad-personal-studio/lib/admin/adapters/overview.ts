/**
 * Server-only health & operational overview aggregator for /admin and /admin/integrations.
 * Reports exact honest status across all infrastructure and self-hosted integrations;
 * never fabricates production metrics.
 */
import { envVar } from "@/lib/form-security";
import { isDemoModeEnabled } from "@/lib/admin/auth-core";
import { checkDatabaseStatus, listContactInquiries, listStudioApplications, listWorkflowItems } from "@/lib/admin/db";
import { checkUpstashStatus } from "@/lib/admin/rate-limit";
import { checkListmonkStatus } from "@/lib/admin/adapters/listmonk";
import { checkPostizStatus, listPostizChannels } from "@/lib/admin/adapters/postiz";
import { checkTwentyStatus } from "@/lib/admin/adapters/twenty";
import { checkGmailStatus } from "@/lib/admin/adapters/gmail";
import { buildPlatformCards, checkGitHubStatus } from "@/lib/admin/adapters/platforms";
import {
  DEMO_APPLICATIONS,
  DEMO_INQUIRIES,
  DEMO_WORKFLOW_ITEMS,
} from "@/lib/admin/demo-data";
import type { IntegrationStatusSummary, PlatformAccountCard, ServiceHealthState } from "@/lib/admin/types";
import { deliveryChannels } from "@/lib/inquiry-server";
import { PROJECTS } from "@/lib/projects";
import { BLOG_POSTS } from "@/lib/content/blog";

function checkResendStatus(): { state: ServiceHealthState; detail: string } {
  const ch = deliveryChannels();
  if (ch.email) {
    return {
      state: "connected",
      detail: `Configured to deliver Contact & Studio Network forms via Resend to ${envVar("INQUIRY_TO_EMAIL")}.`,
    };
  }
  if (ch.webhook) {
    return {
      state: "connected",
      detail: "Webhook delivery is configured for form submissions (Resend email env vars not set).",
    };
  }
  return {
    state: "needs_setup",
    detail: "Add RESEND_API_KEY, INQUIRY_TO_EMAIL, and INQUIRY_FROM_EMAIL so Contact & Studio Network forms deliver to Gmail.",
  };
}

export async function collectIntegrationHealth(): Promise<{
  integrations: IntegrationStatusSummary[];
  platforms: PlatformAccountCard[];
  gmailAccountEmail: string | null;
}> {
  const checkedAt = new Date().toISOString();
  const [db, redis, listmonk, postiz, postizChannelsRes, twenty, gmail, github] = await Promise.all([
    checkDatabaseStatus(),
    checkUpstashStatus(),
    checkListmonkStatus(),
    checkPostizStatus(),
    listPostizChannels(),
    checkTwentyStatus(),
    checkGmailStatus(),
    checkGitHubStatus(),
  ]);
  const resend = checkResendStatus();

  const integrations: IntegrationStatusSummary[] = [
    {
      id: "database",
      name: "Neon PostgreSQL",
      category: "infrastructure",
      state: db.state,
      detail: db.detail,
      docsAnchor: "#neon-postgresql",
      checkedAt,
    },
    {
      id: "redis",
      name: "Upstash Redis Rate Limiter",
      category: "infrastructure",
      state: redis.state,
      detail: redis.detail,
      docsAnchor: "#upstash-redis",
      checkedAt,
    },
    {
      id: "resend",
      name: "Resend Transactional Forms",
      category: "email",
      state: resend.state,
      detail: resend.detail,
      docsAnchor: "#resend-forms",
      checkedAt,
    },
    {
      id: "listmonk",
      name: "Listmonk Email Campaigns",
      category: "email",
      state: listmonk.state,
      detail: listmonk.detail,
      baseUrlHost: listmonk.baseUrlHost,
      docsAnchor: "#listmonk",
      checkedAt,
    },
    {
      id: "postiz",
      name: "Postiz Social Publishing",
      category: "social",
      state: postiz.state,
      detail: postiz.detail,
      baseUrlHost: postiz.baseUrlHost,
      docsAnchor: "#postiz",
      checkedAt,
    },
    {
      id: "twenty",
      name: "Twenty CRM",
      category: "crm",
      state: twenty.state,
      detail: twenty.detail,
      baseUrlHost: twenty.baseUrlHost,
      docsAnchor: "#twenty-crm",
      checkedAt,
    },
    {
      id: "gmail",
      name: "Gmail Inbox (Google OAuth)",
      category: "email",
      state: gmail.state,
      detail: gmail.detail,
      docsAnchor: "#gmail-oauth",
      checkedAt,
    },
    {
      id: "github",
      name: "GitHub (Read-Only API)",
      category: "platform",
      state: github.state,
      detail: github.detail,
      docsAnchor: "#github",
      checkedAt,
    },
  ];

  const liveChannels = postizChannelsRes.ok ? postizChannelsRes.channels : [];
  const platforms = buildPlatformCards(liveChannels, github);

  return {
    integrations,
    platforms,
    gmailAccountEmail: gmail.accountEmail ?? null,
  };
}

export async function collectAdminOverview() {
  const demoMode = isDemoModeEnabled();
  const [health, dbInquiries, dbApplications, dbWorkflow] = await Promise.all([
    collectIntegrationHealth(),
    listContactInquiries(false).catch(() => []),
    listStudioApplications(false).catch(() => []),
    listWorkflowItems(false).catch(() => []),
  ]);

  const inquiries = dbInquiries.length > 0 ? dbInquiries : demoMode ? DEMO_INQUIRIES : [];
  const applications = dbApplications.length > 0 ? dbApplications : demoMode ? DEMO_APPLICATIONS : [];
  const workflowItems = dbWorkflow.length > 0 ? dbWorkflow : demoMode ? DEMO_WORKFLOW_ITEMS : [];

  const connectedCount = health.integrations.filter((i) => i.state === "connected").length;
  const needsSetupCount = health.integrations.filter((i) => i.state === "needs_setup").length;
  const attentionCount = health.integrations.filter((i) => i.state === "offline" || i.state === "error").length;

  return {
    demoMode,
    generatedAt: new Date().toISOString(),
    summary: {
      connectedIntegrations: connectedCount,
      totalIntegrations: health.integrations.length,
      needsSetupIntegrations: needsSetupCount,
      attentionIntegrations: attentionCount,
      newInquiries: inquiries.filter((i) => i.status === "new").length,
      totalInquiries: inquiries.length,
      inquiriesAreDemo: inquiries.some((i) => i.isDemo),
      pendingApplications: applications.filter((a) => a.moderationStatus === "private_pending").length,
      totalApplications: applications.length,
      applicationsAreDemo: applications.some((a) => a.isDemo),
      activeWorkflowItems: workflowItems.filter((w) => w.status !== "done" && w.status !== "archived").length,
      workflowIsDemo: workflowItems.some((w) => w.isDemo),
      publicProjectsCount: PROJECTS.length,
      publicBlogPostsCount: BLOG_POSTS.length,
    },
    integrations: health.integrations,
    recentInquiries: inquiries.slice(0, 5),
    recentApplications: applications.slice(0, 5),
    upcomingWorkflow: workflowItems.filter((w) => w.status !== "archived").slice(0, 5),
    platforms: health.platforms,
  };
}
