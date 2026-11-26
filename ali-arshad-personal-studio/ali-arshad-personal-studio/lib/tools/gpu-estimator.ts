/**
 * GPU & Compute Quote-Request Scope Estimator — pure logic, unit tested.
 *
 * Strictly quote-led: NEVER invents hourly prices, billing units, guaranteed
 * regions, uptime SLAs, or unverified server availability. Helps prospective
 * clients structure their workload footprint so Ali can verify real hardware
 * fit and send a written custom quote.
 */

export type GpuWorkloadCategory =
  | "blender-rendering"
  | "dev-test-environment"
  | "batch-processing"
  | "simulation-compute"
  | "ai-inference-eval";

export type GpuAccessPreference = "ssh-key" | "docker-container" | "managed-batch-run";
export type GpuStorageNeed = "ephemeral-scratch" | "short-term-project-volume" | "large-dataset-transfer";

export type GpuQuoteScopeInput = {
  workloadCategory: GpuWorkloadCategory;
  estimatedHoursPerRun: number;
  runsPerMonth: number;
  vramRequirementGb: number;
  systemRamRequirementGb: number;
  storageGb: number;
  accessPreference: GpuAccessPreference;
  storageNeed: GpuStorageNeed;
  needsSetupAssistance: boolean;
  requires247Uptime: boolean;
  requiresComplianceCert: boolean;
};

export type GpuFitAssessment = "strong-fit-pending-check" | "review-needed" | "likely-outside-scope";

export type GpuQuoteScopeResult = {
  totalEstimatedHours: number;
  fitAssessment: GpuFitAssessment;
  fitHeadline: string;
  flags: string[];
  assumptions: string[];
  contactSummary: string;
};

export const GPU_WORKLOAD_LABELS: Record<GpuWorkloadCategory, string> = {
  "blender-rendering": "3D Rendering & Blender Cycles Passes",
  "dev-test-environment": "Linux Dev / Test & Staging Environment",
  "batch-processing": "Media Encoding & Batch Data Processing",
  "simulation-compute": "Engineering / Technical Compute & Simulation",
  "ai-inference-eval": "Bounded AI Inference & Model Evaluation",
};

export const GPU_ACCESS_LABELS: Record<GpuAccessPreference, string> = {
  "ssh-key": "Key-based SSH access (Ubuntu shell)",
  "docker-container": "Scoped Docker container / CLI runtime",
  "managed-batch-run": "Operator-run batch job (deliver inputs → receive outputs)",
};

export const GPU_STORAGE_LABELS: Record<GpuStorageNeed, string> = {
  "ephemeral-scratch": "Ephemeral scratch storage (wiped after run)",
  "short-term-project-volume": "Scoped project directory during booking window",
  "large-dataset-transfer": "Large dataset / asset transfer coordination",
};

const cleanPos = (n: number, min = 0) => (Number.isFinite(n) ? Math.max(n, min) : min);

export function evaluateGpuQuoteScope(raw: GpuQuoteScopeInput): GpuQuoteScopeResult {
  const hoursPerRun = cleanPos(raw.estimatedHoursPerRun, 1);
  const runsPerMonth = cleanPos(raw.runsPerMonth, 1);
  const vramGb = cleanPos(raw.vramRequirementGb, 1);
  const ramGb = cleanPos(raw.systemRamRequirementGb, 4);
  const storageGb = cleanPos(raw.storageGb, 5);
  const totalEstimatedHours = Math.round(hoursPerRun * runsPerMonth * 10) / 10;

  const flags: string[] = [];
  let outsideScope = false;
  let needsReview = false;

  if (raw.requires247Uptime) {
    outsideScope = true;
    flags.push("24/7 high-availability production hosting with uptime SLAs is outside scope for a small single-host setup.");
  }
  if (raw.requiresComplianceCert) {
    outsideScope = true;
    flags.push("Certified compliance environments (SOC 2, HIPAA, PCI-DSS, ISO 27001) are not offered on this service.");
  }
  if (vramGb > 16) {
    needsReview = true;
    flags.push(`Requested VRAM (${vramGb} GB) exceeds modest single-card RTX consumer VRAM tiers — verify quantization or cloud alternatives.`);
  }
  if (ramGb > 56) {
    needsReview = true;
    flags.push(`Requested host RAM (${ramGb} GB) approaches single-workstation limits — memory headroom must be verified before booking.`);
  }
  if (storageGb > 500) {
    needsReview = true;
    flags.push(`Requested working storage (${storageGb} GB) requires advance disk-quota and transfer-channel review.`);
  }
  if (totalEstimatedHours > 120) {
    needsReview = true;
    flags.push(`High monthly run volume (${totalEstimatedHours} hrs/mo) requires scheduling check against current host availability.`);
  }

  let fitAssessment: GpuFitAssessment = "strong-fit-pending-check";
  let fitHeadline = "Practical single-host candidate — ready for hardware & availability check";

  if (outsideScope) {
    fitAssessment = "likely-outside-scope";
    fitHeadline = "Likely better served by a hyperscaler cloud provider";
  } else if (needsReview) {
    fitAssessment = "review-needed";
    fitHeadline = "Technical capacity review required before quoting";
  }

  const assumptions = [
    "No rate or billing unit is calculated here — availability and custom pricing are confirmed in writing after verifying hardware fit.",
    "This is a small, limited-capacity compute service operated directly by Ali Arshad, not an elastic AWS/Oracle-scale cloud.",
    "Customers remain responsible for backing up inputs and downloading outputs before scheduled post-run cleanup.",
  ];

  const contactSummary = [
    "GPU & Compute Workload Request",
    `Workload type: ${GPU_WORKLOAD_LABELS[raw.workloadCategory]}`,
    `Estimated usage: ${hoursPerRun} hr/run × ${runsPerMonth} run(s)/mo (~${totalEstimatedHours} hrs total)`,
    `Estimated footprint: ${vramGb} GB VRAM | ${ramGb} GB RAM | ${storageGb} GB storage`,
    `Preferred access: ${GPU_ACCESS_LABELS[raw.accessPreference]}`,
    `Storage handling: ${GPU_STORAGE_LABELS[raw.storageNeed]}`,
    `Setup assistance needed: ${raw.needsSetupAssistance ? "Yes" : "No (self-managed within agreed boundary)"}`,
    `Initial automated screen: ${fitHeadline}`,
  ].join("\n");

  return {
    totalEstimatedHours,
    fitAssessment,
    fitHeadline,
    flags,
    assumptions,
    contactSummary,
  };
}
