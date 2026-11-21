export type FlowNodeType =
  | "trigger"
  | "schedule"
  | "webhook"
  | "condition"
  | "transform"
  | "ai_process"
  | "human_approval"
  | "http_request";

export type RunStatus =
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "rejected";

export type StepStatus =
  | "completed"
  | "awaiting_approval"
  | "failed"
  | "skipped"
  | "rejected";

export type IntegrationKind = "webhook" | "n8n" | "http" | "ai_deterministic";

export type ConditionOperator =
  | ">"
  | ">="
  | "<"
  | "<="
  | "==="
  | "!=="
  | "contains"
  | "exists";

export type FlowNodeConfig = {
  // trigger / schedule / webhook
  eventName?: string;
  cron?: string;
  timezone?: string;
  webhookPath?: string;
  secretHeader?: string;

  // condition
  field?: string;
  operator?: ConditionOperator;
  value?: string | number | boolean;

  // transform
  mappings?: Record<string, string>;
  template?: string;

  // ai_process
  task?: "lead_scoring" | "ticket_triage" | "invoice_escalation" | "inventory_analysis" | "custom";
  systemPrompt?: string;
  useLiveLlm?: boolean;

  // human_approval
  approvalPrompt?: string;
  approverRole?: string;
  channelPreview?: string;

  // http_request
  method?: "GET" | "POST" | "PUT" | "PATCH";
  url?: string;
  sandbox?: boolean;
  simulateFailure?: boolean;
  bodyTemplate?: string;
  integrationKind?: "http" | "n8n" | "webhook";
};

export type FlowNodeData = {
  label: string;
  nodeType: FlowNodeType;
  description?: string;
  config: FlowNodeConfig;
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
};

export const NODE_TYPE_META: Record<
  FlowNodeType,
  {
    label: string;
    shortLabel: string;
    category: "Trigger" | "Logic" | "AI & Safety" | "Action";
    description: string;
    accent: string;
  }
> = {
  trigger: {
    label: "Manual / App Trigger",
    shortLabel: "Trigger",
    category: "Trigger",
    description: "Starts workflow from an application event or manual JSON test payload.",
    accent: "#7c3aed",
  },
  schedule: {
    label: "Cron Schedule",
    shortLabel: "Schedule",
    category: "Trigger",
    description: "Runs workflow on a recurring cron schedule with timezone metadata.",
    accent: "#6366f1",
  },
  webhook: {
    label: "Inbound Webhook",
    shortLabel: "Webhook",
    category: "Trigger",
    description: "Accepts signed JSON webhook events from external systems or n8n.",
    accent: "#0ea5e9",
  },
  condition: {
    label: "Condition Branch",
    shortLabel: "Condition",
    category: "Logic",
    description: "Deterministic branching evaluator supporting dot-paths and comparisons.",
    accent: "#f59e0b",
  },
  transform: {
    label: "Data Transform",
    shortLabel: "Transform",
    category: "Logic",
    description: "Maps fields and interpolates {{templates}} into structured payloads.",
    accent: "#14b8a6",
  },
  ai_process: {
    label: "AI Process",
    shortLabel: "AI Process",
    category: "AI & Safety",
    description: "Deterministic scoring, triage, and draft generation (zero API key required).",
    accent: "#8b5cf6",
  },
  human_approval: {
    label: "Human Approval Gate",
    shortLabel: "Approval Gate",
    category: "AI & Safety",
    description: "Mandatory safety gate — pauses run until an operator clicks Approve or Reject.",
    accent: "#f97316",
  },
  http_request: {
    label: "HTTP / Webhook Action",
    shortLabel: "HTTP Action",
    category: "Action",
    description: "Safe sandboxed HTTP dispatch or optional n8n webhook bridge.",
    accent: "#10b981",
  },
};
