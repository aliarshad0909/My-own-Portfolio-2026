import type { AppDatabase } from "@/db";
import {
  activityLogs,
  cannedResponses,
  customers,
  kbArticles,
  ticketMessages,
  tickets,
  users,
} from "@/db/schema";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";

type SeedOptions = {
  usersOnly?: boolean;
  skipUsers?: boolean;
};

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3_600_000);
}

function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 3_600_000);
}

export async function seedDemoData(db: AppDatabase, options: SeedOptions = {}): Promise<void> {
  if (!options.skipUsers) {
    await db
      .insert(users)
      .values([
        {
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: DEMO_ACCOUNT.role,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          avatarColor: "#2563eb",
        },
        {
          email: "admin@supportos.studio",
          name: "Daniel Okafor",
          role: "admin",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#1e1b4b",
        },
        {
          email: "priya@supportos.studio",
          name: "Priya Nair",
          role: "agent",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#0284c7",
        },
        {
          email: "carlos@supportos.studio",
          name: "Carlos Vega",
          role: "agent",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#4f46e5",
        },
        {
          email: "customer@acme-cloud.io",
          name: "Elena Rostova",
          role: "customer",
          passwordHash: hashPassword(generateLockedPassword()),
          avatarColor: "#0f766e",
        },
      ])
      .onConflictDoNothing({ target: users.email });
  }

  if (options.usersOnly) return;

  const seededCustomers = await db
    .insert(customers)
    .values([
      {
        name: "Elena Rostova",
        email: "elena@acme-cloud.io",
        company: "Acme Cloud Systems",
        planTier: "enterprise",
        notes: "Strategic enterprise tenant with 24/7 SLA addendum and dedicated SAML SSO.",
      },
      {
        name: "Marcus Vance",
        email: "marcus@northstarfin.com",
        company: "Northstar Fintech",
        planTier: "enterprise",
        notes: "SOC 2 audit in progress; prefers concise technical logs in public replies.",
      },
      {
        name: "Hannah Abbott",
        email: "hannah@vervecommerce.co",
        company: "Verve Commerce",
        planTier: "growth",
        notes: "Migrating 45 support seats from legacy help desk.",
      },
      {
        name: "Devon Brooks",
        email: "devon@kilnlabs.dev",
        company: "Kiln Developer Labs",
        planTier: "growth",
        notes: "Heavy REST webhook and API integration customer.",
      },
      {
        name: "Sora Takahashi",
        email: "sora@harborhealth.org",
        company: "Harbor Health Ops",
        planTier: "enterprise",
        notes: "HIPAA-conscious workflows; escalations routed to Priya or Maya.",
      },
      {
        name: "Liam O'Connor",
        email: "liam@brightleaf.studio",
        company: "Brightleaf Creative",
        planTier: "starter",
        notes: "Small design studio exploring automated ticket macros.",
      },
    ])
    .returning();

  const [elena, marcus, hannah, devon, sora, liam] = seededCustomers;

  const seededTickets = await db
    .insert(tickets)
    .values([
      {
        ticketNumber: "SUP-1001",
        customerId: elena.id,
        subject: "Production SAML SSO callback returning HTTP 500 for EU region",
        description:
          "Since 08:15 UTC, employees authenticating via Okta SAML in eu-west-1 receive an HTTP 500 error after assertion validation. Existing sessions still work, but new sign-ins are blocked.",
        category: "incident",
        priority: "urgent",
        status: "in_progress",
        assignedAgentName: "Maya Lin (Lead Agent)",
        slaDueAt: hoursFromNow(0.45), // At risk
        firstRespondedAt: hoursAgo(0.4),
        createdAt: hoursAgo(0.75),
        updatedAt: hoursAgo(0.2),
      },
      {
        ticketNumber: "SUP-1002",
        customerId: marcus.id,
        subject: "Duplicate enterprise invoice charge on October statement",
        description:
          "Our finance team noticed two identical $2,400 charges for invoice #INV-8842 on our corporate card after we added 10 analyst seats mid-cycle. Can you issue a refund for the duplicate charge and send an updated PDF receipt?",
        category: "billing",
        priority: "high",
        status: "open",
        assignedAgentName: "Maya Lin (Lead Agent)",
        slaDueAt: hoursAgo(0.6), // Breached!
        firstRespondedAt: null,
        createdAt: hoursAgo(4.6),
        updatedAt: hoursAgo(4.6),
      },
      {
        ticketNumber: "SUP-1003",
        customerId: devon.id,
        subject: "Webhook signature verification failing with rotated signing secret",
        description:
          "After rotating our webhook signing key in Settings > Developers, HMAC-SHA256 verification fails on our Node.js consumer. Are both the old and new headers sent during the 24h overlap window?",
        category: "technical",
        priority: "high",
        status: "waiting_customer",
        assignedAgentName: "Priya Nair",
        slaDueAt: hoursFromNow(1.8),
        firstRespondedAt: hoursAgo(1.9),
        createdAt: hoursAgo(2.2),
        updatedAt: hoursAgo(1.1),
      },
      {
        ticketNumber: "SUP-1004",
        customerId: hannah.id,
        subject: "Bulk CSV import & team seat provisioning for 45 onboarding agents",
        description:
          "We are migrating our customer care team this Friday. Can we upload a CSV to pre-provision agent roles and map department queues before sending welcome invites?",
        category: "onboarding",
        priority: "medium",
        status: "open",
        assignedAgentName: "Carlos Vega",
        slaDueAt: hoursFromNow(7.5),
        firstRespondedAt: null,
        createdAt: hoursAgo(4.5),
        updatedAt: hoursAgo(4.5),
      },
      {
        ticketNumber: "SUP-1005",
        customerId: sora.id,
        subject: "Audit log retention export in NDJSON format for quarterly compliance",
        description:
          "Our security team needs automated quarterly exports of ticket audit logs and internal note timestamps in NDJSON format rather than CSV. Is this on the roadmap?",
        category: "feature_request",
        priority: "low",
        status: "open",
        assignedAgentName: "Daniel Okafor",
        slaDueAt: hoursFromNow(18),
        firstRespondedAt: hoursAgo(4.2),
        createdAt: hoursAgo(6),
        updatedAt: hoursAgo(4.2),
      },
      {
        ticketNumber: "SUP-1006",
        customerId: liam.id,
        subject: "Custom domain DNS CNAME not verifying for help.brightleaf.studio",
        description:
          "We added the CNAME record pointing help.brightleaf.studio to portal.supportos.app 3 hours ago, but the SSL badge in Settings still shows Pending Verification.",
        category: "technical",
        priority: "medium",
        status: "in_progress",
        assignedAgentName: "Priya Nair",
        slaDueAt: hoursFromNow(5.5),
        firstRespondedAt: hoursAgo(5.8),
        createdAt: hoursAgo(6.5),
        updatedAt: hoursAgo(2.0),
      },
      {
        ticketNumber: "SUP-1007",
        customerId: elena.id,
        subject: "Configure regional SLA schedules for APAC and EMEA support pods",
        description:
          "We want Urgent SLA timers to follow 24/7 coverage while Medium/Low tickets pause outside regional business hours for our EMEA pod.",
        category: "onboarding",
        priority: "medium",
        status: "resolved",
        assignedAgentName: "Carlos Vega",
        slaDueAt: hoursAgo(14),
        firstRespondedAt: hoursAgo(23.2),
        resolvedAt: hoursAgo(18),
        createdAt: hoursAgo(26),
        updatedAt: hoursAgo(18),
      },
      {
        ticketNumber: "SUP-1008",
        customerId: marcus.id,
        subject: "Update billing contact email and add PO number to annual renewal",
        description:
          "Please update our billing recipient to ap@northstarfin.com and attach PO-2026-0419 to our upcoming enterprise renewal invoice.",
        category: "billing",
        priority: "low",
        status: "resolved",
        assignedAgentName: "Maya Lin (Lead Agent)",
        slaDueAt: hoursAgo(24),
        firstRespondedAt: hoursAgo(46.5),
        resolvedAt: hoursAgo(42),
        createdAt: hoursAgo(48),
        updatedAt: hoursAgo(42),
      },
      {
        ticketNumber: "SUP-1009",
        customerId: devon.id,
        subject: "API pagination cursor skipping records when tickets are updated concurrently",
        description:
          "When polling GET /v1/tickets with cursor pagination during high volume, a few tickets updated mid-page appear duplicated on the next page.",
        category: "technical",
        priority: "high",
        status: "resolved",
        assignedAgentName: "Priya Nair",
        slaDueAt: hoursAgo(28),
        firstRespondedAt: hoursAgo(31.4),
        resolvedAt: hoursAgo(29),
        createdAt: hoursAgo(32),
        updatedAt: hoursAgo(29),
      },
      {
        ticketNumber: "SUP-1010",
        customerId: sora.id,
        subject: "SSO group-to-role mapping setup for Clinical Operations",
        description:
          "Need confirmation that IdP group claims automatically demote users to read-only viewers when removed from the Support-Agents group.",
        category: "onboarding",
        priority: "medium",
        status: "closed",
        assignedAgentName: "Daniel Okafor",
        slaDueAt: hoursAgo(60),
        firstRespondedAt: hoursAgo(70.5),
        resolvedAt: hoursAgo(65),
        createdAt: hoursAgo(72),
        updatedAt: hoursAgo(64),
      },
    ])
    .returning();

  const [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10] = seededTickets;

  await db.insert(ticketMessages).values([
    {
      ticketId: t1.id,
      authorName: elena.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "Since 08:15 UTC, employees authenticating via Okta SAML in eu-west-1 receive an HTTP 500 error after assertion validation. Existing sessions still work, but new sign-ins are blocked.",
      createdAt: hoursAgo(0.75),
    },
    {
      ticketId: t1.id,
      authorName: "Maya Lin (Lead Agent)",
      authorRole: "agent",
      isInternalNote: true,
      body: "Internal triage: Checked EU IdP certificate cache — Acme rotated their Okta signing cert 20 minutes ago. Checking secondary cert fallback flag with Infra before replying.",
      createdAt: hoursAgo(0.55),
    },
    {
      ticketId: t1.id,
      authorName: "Maya Lin (Lead Agent)",
      authorRole: "agent",
      isInternalNote: false,
      body: "Hi Elena — we confirmed the HTTP 500 on eu-west-1 SAML callbacks and traced it to a rotated Okta X.509 signing certificate. Our engineering team is refreshing the metadata cache now; could you confirm if Okta cert rotation ran around 08:00 UTC?",
      createdAt: hoursAgo(0.4),
    },
    {
      ticketId: t2.id,
      authorName: marcus.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "Our finance team noticed two identical $2,400 charges for invoice #INV-8842 on our corporate card after we added 10 analyst seats mid-cycle. Can you issue a refund for the duplicate charge and send an updated PDF receipt?",
      createdAt: hoursAgo(4.6),
    },
    {
      ticketId: t2.id,
      authorName: "Daniel Okafor",
      authorRole: "agent",
      isInternalNote: true,
      body: "Billing ledger confirms duplicate idempotency retry on Stripe charge ch_3Q9x. Approved for immediate full refund of the second $2,400 charge once Maya replies.",
      createdAt: hoursAgo(1.2),
    },
    {
      ticketId: t3.id,
      authorName: devon.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "After rotating our webhook signing key in Settings > Developers, HMAC-SHA256 verification fails on our Node.js consumer. Are both the old and new headers sent during the 24h overlap window?",
      createdAt: hoursAgo(2.2),
    },
    {
      ticketId: t3.id,
      authorName: "Priya Nair",
      authorRole: "agent",
      isInternalNote: false,
      body: "Hi Devon! During the 24-hour key rotation window, SupportOS sends comma-separated `v1` signatures in `X-SupportOS-Signature`. Make sure your verifier splits the header on `,` and accepts a match against any valid `v1=` digest. Let me know if updating the parser clears the error.",
      createdAt: hoursAgo(1.9),
    },
    {
      ticketId: t4.id,
      authorName: hannah.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "We are migrating our customer care team this Friday. Can we upload a CSV to pre-provision agent roles and map department queues before sending welcome invites?",
      createdAt: hoursAgo(4.5),
    },
    {
      ticketId: t5.id,
      authorName: sora.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "Our security team needs automated quarterly exports of ticket audit logs and internal note timestamps in NDJSON format rather than CSV. Is this on the roadmap?",
      createdAt: hoursAgo(6),
    },
    {
      ticketId: t5.id,
      authorName: "Daniel Okafor",
      authorRole: "agent",
      isInternalNote: false,
      body: "Thanks Sora! Scheduled NDJSON audit exports are tracked under Roadmap Item #RD-412 for Q3. I have attached Harbor Health Ops as an Enterprise sponsor so you get early beta access.",
      createdAt: hoursAgo(4.2),
    },
    {
      ticketId: t6.id,
      authorName: liam.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "We added the CNAME record pointing help.brightleaf.studio to portal.supportos.app 3 hours ago, but the SSL badge in Settings still shows Pending Verification.",
      createdAt: hoursAgo(6.5),
    },
    {
      ticketId: t6.id,
      authorName: "Priya Nair",
      authorRole: "agent",
      isInternalNote: false,
      body: "Hi Liam — DNS lookup shows Cloudflare proxy (orange cloud) is currently enabled on the CNAME, which blocks our automated ACME TLS challenge. Switching that record to DNS-only (grey cloud) will complete verification within 5 minutes.",
      createdAt: hoursAgo(5.8),
    },
    {
      ticketId: t7.id,
      authorName: elena.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "We want Urgent SLA timers to follow 24/7 coverage while Medium/Low tickets pause outside regional business hours for our EMEA pod.",
      createdAt: hoursAgo(26),
    },
    {
      ticketId: t7.id,
      authorName: "Carlos Vega",
      authorRole: "agent",
      isInternalNote: false,
      body: "Configured separate Business Hours calendars for EMEA (08:00–18:00 CET) and enabled 24/7 override strictly for Urgent tickets. Verified with two test tickets.",
      createdAt: hoursAgo(23.2),
    },
    {
      ticketId: t8.id,
      authorName: marcus.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "Please update our billing recipient to ap@northstarfin.com and attach PO-2026-0419 to our upcoming enterprise renewal invoice.",
      createdAt: hoursAgo(48),
    },
    {
      ticketId: t8.id,
      authorName: "Maya Lin (Lead Agent)",
      authorRole: "agent",
      isInternalNote: false,
      body: "All set! Billing recipient is now ap@northstarfin.com and PO-2026-0419 is attached to your renewal invoice PDF.",
      createdAt: hoursAgo(46.5),
    },
    {
      ticketId: t9.id,
      authorName: devon.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "When polling GET /v1/tickets with cursor pagination during high volume, a few tickets updated mid-page appear duplicated on the next page.",
      createdAt: hoursAgo(32),
    },
    {
      ticketId: t9.id,
      authorName: "Priya Nair",
      authorRole: "agent",
      isInternalNote: false,
      body: "Passing `order=created_at:asc` along with keyset cursors guarantees deterministic pages even during concurrent status updates. Added an example to our API Pagination guide.",
      createdAt: hoursAgo(31.4),
    },
    {
      ticketId: t10.id,
      authorName: sora.name,
      authorRole: "customer",
      isInternalNote: false,
      body: "Need confirmation that IdP group claims automatically demote users to read-only viewers when removed from the Support-Agents group.",
      createdAt: hoursAgo(72),
    },
    {
      ticketId: t10.id,
      authorName: "Daniel Okafor",
      authorRole: "agent",
      isInternalNote: false,
      body: "Confirmed — SCIM & SAML group sync automatically downgrades removed members to Viewer on next assertion or SCIM push.",
      createdAt: hoursAgo(70.5),
    },
  ]);

  await db
    .insert(cannedResponses)
    .values([
      {
        title: "Duplicate Billing & Refund Confirmation",
        shortcut: "/billing-refund",
        category: "billing",
        body: "Hi there — I verified the duplicate charge in our billing ledger and initiated a full refund to your original payment method. Refunds typically settle within 3–5 business days, and I have emailed an updated PDF receipt to your billing contact.",
      },
      {
        title: "SAML / Okta SSO Certificate Rotation Guide",
        shortcut: "/sso-cert",
        category: "incident",
        body: "When rotating your IdP X.509 certificate in Okta or Azure AD, upload the new certificate as a Secondary Signing Certificate in SupportOS Security Settings before deactivating the primary cert. This guarantees zero-downtime login transitions.",
      },
      {
        title: "Webhook Signature Verification Checklist",
        shortcut: "/webhook-sig",
        category: "technical",
        body: "To verify SupportOS webhooks reliably during key rotation: 1) Read the raw unparsed request body, 2) Split `X-SupportOS-Signature` on commas, and 3) Compare your HMAC-SHA256 hex digest using a constant-time equality check against any `v1=` entry.",
      },
      {
        title: "Team CSV Onboarding & Queue Provisioning",
        shortcut: "/csv-onboard",
        category: "onboarding",
        body: "You can bulk-import up to 500 agents via Settings > Team > Import CSV. Leave `send_invite=false` in your CSV to stage roles and department queues silently, then trigger welcome emails in one click on launch day.",
      },
      {
        title: "Feature Request Logged for Product Review",
        shortcut: "/feature-logged",
        category: "feature_request",
        body: "Thank you for this thoughtful suggestion! I have linked your organization to our Product Engineering tracking board with your use-case notes so our PM team can factor it into upcoming sprint planning.",
      },
      {
        title: "Closing Follow-up & CSAT Check",
        shortcut: "/resolve-check",
        category: "technical",
        body: "Glad we could get this resolved! I am marking this ticket as Resolved for now — if anything else comes up, simply reply to reopen the conversation automatically.",
      },
    ])
    .onConflictDoNothing({ target: cannedResponses.shortcut });

  await db
    .insert(kbArticles)
    .values([
      {
        slug: "saml-sso-certificate-rotation-troubleshooting",
        title: "SAML SSO & Okta Certificate Rotation Troubleshooting",
        category: "incident",
        summary:
          "Resolve HTTP 500 SAML callback failures by uploading rotated IdP X.509 certificates as secondary certs before cutover.",
        body: "When an Identity Provider (Okta, Entra ID, or OneLogin) rotates its SAML signing certificate, assertions signed by the new key fail validation until SupportOS refreshes its metadata cache.\n\n1. Open Admin > Security > Single Sign-On.\n2. Paste the new X.509 PEM certificate into the Secondary Certificate slot or click Refresh Metadata URL.\n3. Verify login in an incognito window before removing the expired certificate.\n\nEnterprise workspaces also support automatic metadata polling every 15 minutes.",
        views: 418,
        published: true,
      },
      {
        slug: "billing-invoices-proration-and-refunds",
        title: "Understanding Prorated Invoices, Seat Additions & Refunds",
        category: "billing",
        summary:
          "How mid-cycle seat upgrades are prorated, how to download updated PDF receipts, and how duplicate charge refunds settle.",
        body: "When adding agent seats mid-billing cycle, SupportOS calculates prorated charges down to the day and consolidates them on your next statement or immediate adjustment invoice.\n\nTo update billing recipients or attach a Purchase Order (PO) number, visit Settings > Billing > Invoice Profile. Duplicate payment retries are automatically flagged and refunded within 3–5 business days once confirmed by Support.",
        views: 312,
        published: true,
      },
      {
        slug: "verifying-webhook-hmac-signatures-during-key-rotation",
        title: "Verifying Webhook HMAC-SHA256 Signatures During Key Rotation",
        category: "technical",
        summary:
          "Handle zero-downtime webhook secret rotation by validating comma-separated v1 signatures against raw payloads.",
        body: "Every outbound webhook request from SupportOS includes an `X-SupportOS-Signature` header formatted as `t=<unix_ts>,v1=<hex_hmac>`.\n\nDuring a 24-hour key rotation window, SupportOS appends a second `v1=` signature generated with the new secret. Always verify against the raw UTF-8 request body using `crypto.timingSafeEqual` and accept the event if any `v1` signature matches your active secret.",
        views: 289,
        published: true,
      },
      {
        slug: "bulk-agent-provisioning-and-sla-calendars",
        title: "Bulk Agent CSV Provisioning & Regional SLA Calendars",
        category: "onboarding",
        summary:
          "Stage agent roles, department queues, and regional business-hour SLA timers before inviting your support organization.",
        body: "Teams migrating from legacy help desks can pre-stage up to 500 agents via CSV upload (`name,email,role,queue,send_invite`).\n\nPair staged queues with Regional SLA Policies so Urgent priority tickets enforce 24/7 1-hour response targets while Medium and Low tickets pause cleanly outside local business hours.",
        views: 204,
        published: true,
      },
      {
        slug: "custom-help-center-domain-and-ssl-verification",
        title: "Custom Help Center Domains & TLS/SSL Verification",
        category: "technical",
        summary:
          "Point your CNAME record to portal.supportos.app and disable DNS proxying during initial ACME certificate issuance.",
        body: "To serve the SupportOS Customer Portal on `help.yourdomain.com`, add a CNAME record pointing to `portal.supportos.app`.\n\nIf you use Cloudflare or another reverse-proxy DNS provider, temporarily switch the record to DNS-only (grey cloud) so automated TLS certificate issuance succeeds within 5 minutes.",
        views: 176,
        published: true,
      },
      {
        slug: "submitting-and-tracking-product-feature-requests",
        title: "How Customer Feature Requests Feed Into the Product Roadmap",
        category: "feature_request",
        summary:
          "Track linked customer enhancements, enterprise sponsor tags, and quarterly beta export availability.",
        body: "Every feature request submitted via the Customer Portal or Shared Inbox is categorized and linked to your organization profile.\n\nSupport agents tag affected accounts and plan tiers so Product Engineering can prioritize high-impact workflows and notify sponsors automatically when features enter beta.",
        views: 143,
        published: true,
      },
    ])
    .onConflictDoNothing({ target: kbArticles.slug });

  await db.insert(activityLogs).values([
    {
      actorName: "Maya Lin (Lead Agent)",
      action: "ticket.replied",
      entityType: "ticket",
      entityId: t1.id,
      summary: "Sent public SAML triage reply on SUP-1001 (Acme Cloud Systems)",
      createdAt: hoursAgo(0.4),
    },
    {
      actorName: "Daniel Okafor",
      action: "ticket.internal_note",
      entityType: "ticket",
      entityId: t2.id,
      summary: "Added internal billing approval note on SUP-1002 ($2,400 refund)",
      createdAt: hoursAgo(1.2),
    },
    {
      actorName: "Priya Nair",
      action: "ticket.status_changed",
      entityType: "ticket",
      entityId: t3.id,
      summary: "Moved SUP-1003 to Waiting on Customer after webhook rotation guidance",
      createdAt: hoursAgo(1.8),
    },
    {
      actorName: "Carlos Vega",
      action: "ticket.resolved",
      entityType: "ticket",
      entityId: t7.id,
      summary: "Resolved SUP-1007 (EMEA regional SLA schedules configured)",
      createdAt: hoursAgo(18),
    },
  ]);
}
