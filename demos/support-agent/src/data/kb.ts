import type { Article } from "../lib/retrieval.ts";

/**
 * Knowledge base for Tideline, a fictional project-management product.
 * Every article here is invented for the demonstration.
 */
export const ARTICLES: Article[] = [
  {
    id: "kb-01", category: "Billing", title: "How to cancel your subscription",
    questions: ["cancel my plan", "how do I stop being charged", "end my subscription"],
    answer: "Open **Settings → Billing → Cancel plan**. Cancellation takes effect at the end of the current billing period, so you keep access until then. You'll get a confirmation email once it's scheduled.",
    body: "Cancel subscription plan billing period access confirmation email scheduled downgrade workspace owner only",
  },
  {
    id: "kb-02", category: "Billing", title: "Refund policy",
    questions: ["can I get a refund", "I was charged twice", "money back"],
    answer: "Annual plans are refundable pro rata within 30 days of renewal. Monthly plans aren't refunded for part-months, but we always refund a duplicate charge. If you were charged twice, a human can sort that out — just ask.",
    body: "Refund policy annual pro rata thirty days renewal monthly duplicate charge billing error reimburse",
  },
  {
    id: "kb-03", category: "Billing", title: "Download invoices and receipts",
    questions: ["where are my invoices", "need a receipt for accounting", "VAT invoice"],
    answer: "**Settings → Billing → Invoices** lists every invoice as a PDF. Workspace owners and anyone with the Billing role can download them. Add your VAT or tax ID under Billing details and it appears on future invoices.",
    body: "Invoice receipt PDF download billing role VAT tax identification number statement accounting",
  },
  {
    id: "kb-04", category: "Billing", title: "Plans and pricing",
    questions: ["how much does it cost", "what plans are there", "price per user"],
    answer: "Three plans: **Starter** (free, up to 3 projects), **Team** ($12 per seat per month) and **Business** ($22 per seat per month, adds SSO and audit logs). Annual billing saves two months.",
    body: "Plan pricing cost seat month starter team business free projects SSO audit logs annual discount tier",
  },
  {
    id: "kb-05", category: "Billing", title: "Change your plan",
    questions: ["upgrade to business", "downgrade my plan", "add more seats"],
    answer: "**Settings → Billing → Change plan**. Upgrades apply immediately and we charge the prorated difference. Downgrades apply at the next renewal so you don't lose paid time.",
    body: "Upgrade downgrade change plan seats prorated immediately renewal tier switch add remove",
  },
  {
    id: "kb-06", category: "Account", title: "Reset your password",
    questions: ["forgot my password", "can't log in", "reset password link"],
    answer: "Use **Forgot password** on the sign-in page. The reset link is valid for one hour. If it hasn't arrived in a few minutes, check spam — and confirm you're using the address you signed up with.",
    body: "Password reset forgot sign in login link expires hour spam folder email address credential",
  },
  {
    id: "kb-07", category: "Account", title: "Set up two-factor authentication",
    questions: ["enable 2FA", "two factor", "authenticator app"],
    answer: "**Settings → Security → Two-factor authentication**. Scan the QR code with any authenticator app, then save your recovery codes somewhere safe — they're the only way back in if you lose the device.",
    body: "Two factor authentication 2FA TOTP authenticator QR recovery codes security device lost",
  },
  {
    id: "kb-08", category: "Account", title: "Single sign-on (SSO)",
    questions: ["set up SAML", "Okta integration", "do you support SSO"],
    answer: "SSO is on the Business plan. **Settings → Security → SSO** walks through SAML 2.0 setup and we have guides for Okta, Entra ID and Google Workspace. Enforcing SSO disables password sign-in for your whole workspace.",
    body: "SSO SAML single sign on Okta Entra Azure Google Workspace identity provider business plan enforce",
  },
  {
    id: "kb-09", category: "Account", title: "Delete your account and data",
    questions: ["delete my account", "remove all my data", "GDPR deletion"],
    answer: "**Settings → Account → Delete account**. Deletion is permanent after a 14-day grace period, during which you can still restore it. Export anything you want to keep first.",
    body: "Delete account data permanently grace period fourteen days restore GDPR erase remove export first",
  },
  {
    id: "kb-10", category: "Teams", title: "Invite and remove members",
    questions: ["add someone to my team", "invite a colleague", "remove a user"],
    answer: "**People → Invite**, then enter their email and pick a role. Invites expire after 7 days. Removing a member frees their seat at the next billing cycle and reassigns their tasks to the project owner.",
    body: "Invite member team colleague email role expire seven days remove user seat billing reassign tasks",
  },
  {
    id: "kb-11", category: "Teams", title: "Roles and permissions",
    questions: ["what can a guest see", "permission levels", "make someone an admin"],
    answer: "Four roles: **Owner** (everything, including billing), **Admin** (everything except billing), **Member** (create and edit in assigned projects) and **Guest** (view and comment only, on projects they're invited to).",
    body: "Roles permissions owner admin member guest billing access view comment edit projects assign level",
  },
  {
    id: "kb-12", category: "Projects", title: "Archive or restore a project",
    questions: ["hide an old project", "restore archived project", "where did my project go"],
    answer: "Open the project menu and choose **Archive**. Archived projects stay searchable and stop counting toward your plan limit. Restore from **Projects → Archived** at any time.",
    body: "Archive restore project hide old searchable plan limit count archived menu recover missing",
  },
  {
    id: "kb-13", category: "Projects", title: "Export your data",
    questions: ["export to CSV", "download all my tasks", "backup my workspace"],
    answer: "**Settings → Data → Export** produces a ZIP with CSV files for projects, tasks, comments and attachments. Large workspaces are emailed a link when the export is ready, usually within 10 minutes.",
    body: "Export data CSV ZIP download backup tasks comments attachments email link ready minutes workspace",
  },
  {
    id: "kb-14", category: "Projects", title: "Recover a deleted task",
    questions: ["undo delete", "restore deleted task", "I deleted something by accident"],
    answer: "Deleted tasks sit in **Project → Trash** for 30 days. Open it, find the task and choose Restore. After 30 days they're gone for good.",
    body: "Recover deleted task trash thirty days restore undo accident permanently removed bin",
  },
  {
    id: "kb-15", category: "Integrations", title: "Connect Slack",
    questions: ["Slack notifications", "post updates to Slack", "Slack integration"],
    answer: "**Settings → Integrations → Slack**, then authorise the workspace. You can route per-project updates to specific channels and choose which events post.",
    body: "Slack integration notification channel connect authorise workspace events post updates per project",
  },
  {
    id: "kb-16", category: "Integrations", title: "API keys and webhooks",
    questions: ["how do I use the API", "create an API key", "webhook on task update"],
    answer: "Create keys in **Settings → Developer → API keys**; each is shown once, so store it safely. Webhooks fire on task, project and comment events, with retries for 24 hours on failure.",
    body: "API key webhook developer token endpoint events retries twenty four hours integration automation REST",
  },
  {
    id: "kb-17", category: "Integrations", title: "Calendar sync",
    questions: ["sync with Google Calendar", "see due dates in Outlook", "iCal feed"],
    answer: "**Settings → Integrations → Calendar** gives you a read-only iCal feed that works with Google Calendar, Outlook and Apple Calendar. Feeds refresh roughly every 15 minutes.",
    body: "Calendar sync Google Outlook Apple iCal feed read only due dates refresh fifteen minutes subscribe",
  },
  {
    id: "kb-18", category: "Mobile", title: "Mobile apps",
    questions: ["is there an iPhone app", "Android app", "use it on my phone"],
    answer: "There are iOS and Android apps, and they sync with the web app automatically. Offline edits queue up and sync when you reconnect.",
    body: "Mobile app iOS iPhone Android phone tablet sync offline queue reconnect download store",
  },
  {
    id: "kb-19", category: "Troubleshooting", title: "The app is loading slowly",
    questions: ["everything is slow", "pages take ages to load", "performance problems"],
    answer: "Try a hard refresh first, then an incognito window to rule out extensions. If it's still slow, tell us your browser, roughly when it started and the project you were in — a human can check your workspace.",
    body: "Slow performance loading lag speed refresh cache incognito extensions browser troubleshoot delay",
  },
  {
    id: "kb-20", category: "Troubleshooting", title: "Notifications aren't arriving",
    questions: ["not getting emails", "missing notifications", "turn on alerts"],
    answer: "Check **Settings → Notifications** is set how you expect, then check spam and any mail filters. Digest emails batch into one message per day, so individual alerts won't arrive separately.",
    body: "Notification email alert missing spam filter digest batch daily settings preferences arriving push",
  },
  {
    id: "kb-21", category: "Security", title: "Where your data is stored",
    questions: ["data residency", "is my data in the EU", "which region"],
    answer: "Workspaces are hosted in either the EU (Frankfurt) or the US (Virginia); you pick the region when the workspace is created. Data stays in the chosen region and is encrypted at rest and in transit.",
    body: "Data residency region EU Frankfurt US Virginia hosted encrypted rest transit storage location GDPR",
  },
  {
    id: "kb-22", category: "Security", title: "Audit logs",
    questions: ["who changed this", "activity log", "security audit"],
    answer: "Business-plan workspaces get audit logs under **Settings → Security → Audit log**, covering sign-ins, permission changes and deletions, retained for 12 months and exportable as CSV.",
    body: "Audit log activity history security sign in permission change deletion retained twelve months export CSV business",
  },
  {
    id: "kb-23", category: "Getting started", title: "Create your first project",
    questions: ["how do I start", "new project", "getting started"],
    answer: "Click **New project**, pick a template or start blank, then invite the people who need it. Most teams start with a simple board and add fields as they go.",
    body: "Create first project new template blank invite start board fields getting started onboarding setup",
  },
  {
    id: "kb-24", category: "Getting started", title: "Free trial of paid features",
    questions: ["can I try Business", "free trial", "trial length"],
    answer: "Every new workspace gets 14 days of the Business plan, no card required. When it ends you drop to Starter automatically unless you pick a plan — nothing is deleted.",
    body: "Trial free fourteen days business plan card required starter automatic evaluation test paid features",
  },
];
