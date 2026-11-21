import type { FlowEdge, FlowNode, FlowNodeType } from "@/lib/types";

export type TemplateBlueprint = {
  slug: string;
  name: string;
  description: string;
  category: string;
  triggerType: FlowNodeType;
  samplePayload: Record<string, unknown>;
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export const WORKFLOW_TEMPLATES: TemplateBlueprint[] = [
  {
    slug: "inbound-lead-qualification",
    name: "Inbound Lead Qualification & Approval",
    description:
      "Scores inbound enterprise leads deterministically, filters high-intent prospects, drafts personalized outreach, and requires human operator approval before dispatching.",
    category: "Revenue Ops",
    triggerType: "trigger",
    samplePayload: {
      leadName: "Elena Rostova",
      email: "elena@vertexcloud.io",
      company: "Vertex Cloud Systems",
      employees: 240,
      budgetUsd: 48000,
      source: "pricing_page",
      message: "Looking to automate 12 internal ops workflows with audit logs and approval gates.",
    },
    nodes: [
      {
        id: "n-trigger",
        type: "flowNode",
        position: { x: 40, y: 160 },
        data: {
          label: "Inbound Lead Captured",
          nodeType: "trigger",
          description: "Fires when a prospect submits the enterprise demo form.",
          config: { eventName: "lead.captured" },
        },
      },
      {
        id: "n-ai",
        type: "flowNode",
        position: { x: 310, y: 160 },
        data: {
          label: "AI Lead Scoring & Draft",
          nodeType: "ai_process",
          description: "Deterministic B2B fit scoring and tailored outreach draft.",
          config: {
            task: "lead_scoring",
            systemPrompt: "Score enterprise lead fit (0-100) and draft concise AE follow-up.",
          },
        },
      },
      {
        id: "n-cond",
        type: "flowNode",
        position: { x: 590, y: 160 },
        data: {
          label: "High Intent? (Score >= 70)",
          nodeType: "condition",
          description: "Routes qualified enterprise leads to approval and outreach.",
          config: { field: "ai.score", operator: ">=", value: 70 },
        },
      },
      {
        id: "n-transform",
        type: "flowNode",
        position: { x: 870, y: 80 },
        data: {
          label: "Map CRM Payload",
          nodeType: "transform",
          description: "Formats lead summary, score, and outreach draft for review.",
          config: {
            mappings: {
              prospect: "payload.leadName",
              organization: "payload.company",
              qualificationScore: "ai.score",
              tier: "ai.tier",
              draftBody: "ai.draftMessage",
            },
            template:
              "[{{ai.tier}}] {{payload.company}} ({{payload.leadName}}) — Score {{ai.score}}/100",
          },
        },
      },
      {
        id: "n-approval",
        type: "flowNode",
        position: { x: 1150, y: 80 },
        data: {
          label: "AE Outreach Approval",
          nodeType: "human_approval",
          description: "Mandatory safety gate before sending external email or CRM push.",
          config: {
            approvalPrompt:
              "Review AI-qualified lead score and outreach draft before dispatching to CRM & email.",
            approverRole: "Revenue Ops Lead",
            channelPreview: "CRM + Outbound Email (Sandbox)",
          },
        },
      },
      {
        id: "n-http",
        type: "flowNode",
        position: { x: 1430, y: 80 },
        data: {
          label: "Dispatch to CRM Webhook",
          nodeType: "http_request",
          description: "Sandboxed webhook dispatch after explicit operator approval.",
          config: {
            method: "POST",
            url: "https://hooks.flowos.studio/sandbox/crm-leads",
            sandbox: true,
            integrationKind: "http",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "n-trigger", target: "n-ai", animated: true },
      { id: "e2", source: "n-ai", target: "n-cond", animated: true },
      {
        id: "e3",
        source: "n-cond",
        sourceHandle: "true",
        target: "n-transform",
        label: "true",
        animated: true,
      },
      { id: "e4", source: "n-transform", target: "n-approval", animated: true },
      { id: "e5", source: "n-approval", target: "n-http", animated: true },
    ],
  },
  {
    slug: "low-stock-reorder-alert",
    name: "Low-Stock Reorder Alert",
    description:
      "Scheduled inventory check that detects SKUs at or below reorder threshold, calculates purchase quantities, and gates supplier PO dispatch behind procurement approval.",
    category: "Supply Chain",
    triggerType: "schedule",
    samplePayload: {
      sku: "SF-MTR-402",
      productName: "Brushless Actuator Module v3",
      warehouse: "Austin Hub A",
      stockQty: 14,
      reorderPoint: 30,
      unitCostUsd: 86,
      supplierEmail: "orders@nordicmotion.example",
    },
    nodes: [
      {
        id: "ls-sched",
        type: "flowNode",
        position: { x: 40, y: 150 },
        data: {
          label: "Hourly Stock Audit",
          nodeType: "schedule",
          description: "Checks warehouse SKU balances every hour.",
          config: { cron: "0 * * * *", timezone: "UTC" },
        },
      },
      {
        id: "ls-cond",
        type: "flowNode",
        position: { x: 320, y: 150 },
        data: {
          label: "Stock <= 30 Units?",
          nodeType: "condition",
          description: "Triggers replenishment when SKU drops below safety threshold.",
          config: { field: "payload.stockQty", operator: "<=", value: 30 },
        },
      },
      {
        id: "ls-ai",
        type: "flowNode",
        position: { x: 600, y: 100 },
        data: {
          label: "AI Replenishment Brief",
          nodeType: "ai_process",
          description: "Computes urgency tier and drafts supplier PO memo.",
          config: {
            task: "inventory_analysis",
            systemPrompt: "Evaluate stockout risk and draft concise supplier reorder request.",
          },
        },
      },
      {
        id: "ls-transform",
        type: "flowNode",
        position: { x: 880, y: 100 },
        data: {
          label: "Build Purchase Order",
          nodeType: "transform",
          description: "Constructs structured PO payload for procurement sign-off.",
          config: {
            mappings: {
              sku: "payload.sku",
              warehouse: "payload.warehouse",
              currentQty: "payload.stockQty",
              priority: "ai.priority",
              draftPo: "ai.draftMessage",
            },
            template:
              "Reorder Alert: {{payload.sku}} ({{payload.productName}}) at {{payload.stockQty}} units in {{payload.warehouse}}",
          },
        },
      },
      {
        id: "ls-approval",
        type: "flowNode",
        position: { x: 1160, y: 100 },
        data: {
          label: "Procurement Sign-Off",
          nodeType: "human_approval",
          description: "Requires ops manager approval before issuing supplier PO.",
          config: {
            approvalPrompt:
              "Confirm reorder quantity and supplier PO draft before sending to ERP/n8n.",
            approverRole: "Operations Manager",
            channelPreview: "Supplier PO Webhook (Sandbox)",
          },
        },
      },
      {
        id: "ls-http",
        type: "flowNode",
        position: { x: 1440, y: 100 },
        data: {
          label: "Send PO to ERP Bridge",
          nodeType: "http_request",
          description: "Posts approved PO draft to procurement endpoint.",
          config: {
            method: "POST",
            url: "https://hooks.flowos.studio/sandbox/erp-purchase-order",
            sandbox: true,
            integrationKind: "n8n",
          },
        },
      },
    ],
    edges: [
      { id: "lse1", source: "ls-sched", target: "ls-cond", animated: true },
      {
        id: "lse2",
        source: "ls-cond",
        sourceHandle: "true",
        target: "ls-ai",
        label: "true",
        animated: true,
      },
      { id: "lse3", source: "ls-ai", target: "ls-transform", animated: true },
      { id: "lse4", source: "ls-transform", target: "ls-approval", animated: true },
      { id: "lse5", source: "ls-approval", target: "ls-http", animated: true },
    ],
  },
  {
    slug: "support-ticket-ai-triage",
    name: "Support Ticket AI Draft Triage",
    description:
      "Ingests helpdesk webhooks, classifies ticket urgency and sentiment deterministically, prepares a reply draft, and pauses for support lead approval before responding.",
    category: "Customer Support",
    triggerType: "webhook",
    samplePayload: {
      ticketId: "SUP-8841",
      customer: "Meridian Health",
      contactEmail: "devops@meridianhealth.example",
      plan: "Enterprise",
      subject: "Production webhook latency spike after certificate rotation",
      body: "Urgent: our EU webhook workers started seeing 502 timeouts 15 minutes ago after TLS rotation.",
    },
    nodes: [
      {
        id: "st-hook",
        type: "flowNode",
        position: { x: 40, y: 150 },
        data: {
          label: "Helpdesk Ticket Webhook",
          nodeType: "webhook",
          description: "Receives signed ticket creation payloads from support desk.",
          config: { webhookPath: "/hooks/support-ticket", secretHeader: "x-flowos-sig" },
        },
      },
      {
        id: "st-ai",
        type: "flowNode",
        position: { x: 320, y: 150 },
        data: {
          label: "AI Severity & Reply Draft",
          nodeType: "ai_process",
          description: "Classifies SLA priority and generates troubleshooting response draft.",
          config: {
            task: "ticket_triage",
            systemPrompt: "Classify ticket priority and draft a calm, actionable support reply.",
          },
        },
      },
      {
        id: "st-transform",
        type: "flowNode",
        position: { x: 600, y: 150 },
        data: {
          label: "Prepare Support Packet",
          nodeType: "transform",
          description: "Bundles SLA classification, customer context, and response draft.",
          config: {
            mappings: {
              ticketId: "payload.ticketId",
              customer: "payload.customer",
              priority: "ai.priority",
              sentiment: "ai.sentiment",
              replyDraft: "ai.draftMessage",
            },
            template: "[{{ai.priority}}] Ticket {{payload.ticketId}} — {{payload.customer}}",
          },
        },
      },
      {
        id: "st-approval",
        type: "flowNode",
        position: { x: 890, y: 150 },
        data: {
          label: "Support Lead Review",
          nodeType: "human_approval",
          description: "Human operator must review AI draft before customer reply is sent.",
          config: {
            approvalPrompt:
              "Inspect AI-drafted customer reply and SLA escalation tags before posting to Helpdesk.",
            approverRole: "Support Lead",
            channelPreview: "Customer Helpdesk Reply (Sandbox)",
          },
        },
      },
      {
        id: "st-http",
        type: "flowNode",
        position: { x: 1180, y: 150 },
        data: {
          label: "Post Approved Reply",
          nodeType: "http_request",
          description: "Dispatches approved response back to the helpdesk API.",
          config: {
            method: "POST",
            url: "https://hooks.flowos.studio/sandbox/helpdesk-reply",
            sandbox: true,
            integrationKind: "http",
          },
        },
      },
    ],
    edges: [
      { id: "ste1", source: "st-hook", target: "st-ai", animated: true },
      { id: "ste2", source: "st-ai", target: "st-transform", animated: true },
      { id: "ste3", source: "st-transform", target: "st-approval", animated: true },
      { id: "ste4", source: "st-approval", target: "st-http", animated: true },
    ],
  },
  {
    slug: "overdue-invoice-escalation",
    name: "Overdue Invoice Escalation",
    description:
      "Monitors overdue B2B invoices, routes accounts past 15 days overdue into deterministic escalation drafting, and enforces finance controller approval before notifying clients.",
    category: "Finance Ops",
    triggerType: "schedule",
    samplePayload: {
      invoiceNumber: "INV-2026-0918",
      accountName: "Kestrel Logistics Ltd",
      billingEmail: "ap@kestrellogistics.example",
      amountUsd: 18450,
      daysOverdue: 22,
      accountOwner: "Maya Chen",
    },
    nodes: [
      {
        id: "oi-sched",
        type: "flowNode",
        position: { x: 40, y: 150 },
        data: {
          label: "Daily AR Aging Scan",
          nodeType: "schedule",
          description: "Scans unpaid invoices every morning at 08:00 UTC.",
          config: { cron: "0 8 * * *", timezone: "UTC" },
        },
      },
      {
        id: "oi-cond",
        type: "flowNode",
        position: { x: 320, y: 150 },
        data: {
          label: "Overdue >= 15 Days?",
          nodeType: "condition",
          description: "Escalates invoices past 15-day grace window.",
          config: { field: "payload.daysOverdue", operator: ">=", value: 15 },
        },
      },
      {
        id: "oi-ai",
        type: "flowNode",
        position: { x: 600, y: 100 },
        data: {
          label: "AI Escalation Notice Draft",
          nodeType: "ai_process",
          description: "Generates firm yet diplomatic finance escalation notice.",
          config: {
            task: "invoice_escalation",
            systemPrompt: "Draft structured accounts-receivable reminder with clear payment terms.",
          },
        },
      },
      {
        id: "oi-transform",
        type: "flowNode",
        position: { x: 880, y: 100 },
        data: {
          label: "Assemble Finance Dossier",
          nodeType: "transform",
          description: "Packages invoice metadata and escalation message for controller.",
          config: {
            mappings: {
              invoiceNumber: "payload.invoiceNumber",
              accountName: "payload.accountName",
              amountUsd: "payload.amountUsd",
              riskLevel: "ai.priority",
              noticeDraft: "ai.draftMessage",
            },
            template:
              "Invoice {{payload.invoiceNumber}} ({{payload.accountName}}) — ${{payload.amountUsd}} overdue {{payload.daysOverdue}}d",
          },
        },
      },
      {
        id: "oi-approval",
        type: "flowNode",
        position: { x: 1160, y: 100 },
        data: {
          label: "Finance Controller Approval",
          nodeType: "human_approval",
          description: "Mandatory approval before any client billing notice is dispatched.",
          config: {
            approvalPrompt:
              "Verify invoice payment status and approve escalation email draft for dispatch.",
            approverRole: "Finance Controller",
            channelPreview: "Accounts Receivable Notice (Sandbox)",
          },
        },
      },
      {
        id: "oi-http",
        type: "flowNode",
        position: { x: 1440, y: 100 },
        data: {
          label: "Trigger Billing Dispatch",
          nodeType: "http_request",
          description: "Sends approved escalation notice via billing webhook.",
          config: {
            method: "POST",
            url: "https://hooks.flowos.studio/sandbox/billing-escalation",
            sandbox: true,
            integrationKind: "http",
          },
        },
      },
    ],
    edges: [
      { id: "oie1", source: "oi-sched", target: "oi-cond", animated: true },
      {
        id: "oie2",
        source: "oi-cond",
        sourceHandle: "true",
        target: "oi-ai",
        label: "true",
        animated: true,
      },
      { id: "oie3", source: "oi-ai", target: "oi-transform", animated: true },
      { id: "oie4", source: "oi-transform", target: "oi-approval", animated: true },
      { id: "oie5", source: "oi-approval", target: "oi-http", animated: true },
    ],
  },
];
