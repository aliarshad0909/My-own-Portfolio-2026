/**
 * Consultation-led RTX GPU Compute Rental service definition.
 *
 * Honesty & placeholder governance:
 *  - No RTX server hardware specifications, VRAM sizes, pricing, availability
 *    windows, or security controls exist in the repository today.
 *  - Every unverified operational/hardware figure MUST stay marked as a clear
 *    placeholder awaiting Ali's factual confirmation — never invented.
 *  - Publication state is `PublicNoIndex`: the page resolves cleanly for
 *    visitors and reviewers while staying excluded from search indexing and
 *    `sitemap.xml` until Ali confirms real hardware specs and approves indexing.
 */

import type { IconName } from "@/components/ui/Icon";
import type { PublicationState } from "@/lib/seo/publication";
import type { FaqItem } from "@/lib/structured-data";

export const GPU_COMPUTE_PATH = "/services/gpu-compute";
export const GPU_COMPUTE_CONTACT_SERVICE = "RTX GPU Compute Rental (Consultation)";

export const GPU_COMPUTE_PUBLICATION_STATE: PublicationState = "PublicNoIndex";

export type GpuSpecPlaceholder = {
  parameter: string;
  status: "Placeholder — pending confirmation";
  value: string;
  whyItMatters: string;
};

export type GpuWorkload = {
  icon: IconName;
  title: string;
  summary: string;
  examples: string[];
  fitNote: string;
};

export type GpuProcessStep = {
  step: string;
  label: string;
  detail: string;
  output: string;
};

export const GPU_COMPUTE_SPECS: GpuSpecPlaceholder[] = [
  {
    parameter: "GPU model & card count",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm exact NVIDIA RTX model(s) and GPU count]",
    whyItMatters: "Determines supported precision (FP16/BF16/FP8), CUDA capability, and single-card vs. multi-GPU execution.",
  },
  {
    parameter: "Video memory (VRAM)",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm per-GPU and total VRAM capacity]",
    whyItMatters: "Sets practical limits for open-weight model sizes, quantization, batch sizes, and 3D scene memory.",
  },
  {
    parameter: "Host CPU, RAM & NVMe storage",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm CPU cores, host RAM, scratch NVMe capacity, and retention period]",
    whyItMatters: "Controls dataset preprocessing speed, checkpoint storage, and asset caching.",
  },
  {
    parameter: "Supported runtime configurations",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm OS, CUDA/cuDNN versions, Docker / SSH / Python / Blender CLI options]",
    whyItMatters: "Confirms whether your container, Conda environment, or render script runs cleanly without rework.",
  },
  {
    parameter: "Network bandwidth & dataset transfer",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm upload/download speed and approved transfer method]",
    whyItMatters: "Affects large checkpoint downloads, video footage uploads, and rendered asset retrieval.",
  },
  {
    parameter: "Availability windows & scheduling",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm scheduling notice, max booking length, and timezone window]",
    whyItMatters: "Aligns dedicated server time with sprint deadlines and prevents contention with other runs.",
  },
  {
    parameter: "Security, isolation & data handling",
    status: "Placeholder — pending confirmation",
    value: "[TBD — Ali to confirm tenant isolation, post-run wipe policy, access controls, and NDA terms]",
    whyItMatters: "Essential before uploading proprietary weights, private datasets, or pre-release product geometry.",
  },
  {
    parameter: "Hourly pricing & minimum booking",
    status: "Placeholder — pending confirmation",
    value: "Custom hourly quote issued after workload review and capacity check (no published flat rate yet)",
    whyItMatters: "Quotes reflect actual workload duration, setup assistance (if needed), and confirmed server capacity.",
  },
];

export const GPU_WORKLOADS: GpuWorkload[] = [
  {
    icon: "bot",
    title: "AI inference & batch evaluation",
    summary:
      "Run scheduled inference batches, open-weight model benchmarks, embedding generation, or retrieval evaluations where supported by the confirmed RTX VRAM.",
    examples: [
      "Batch document classification, extraction, or summarization jobs",
      "Comparing latency and output quality across open-weight LLM checkpoints",
      "Evaluating RAG retrieval pipelines before committing to ongoing cloud GPU spend",
    ],
    fitNote: "Best suited for bounded test runs and batch processing rather than 24/7 high-availability production APIs.",
  },
  {
    icon: "code",
    title: "Model testing & scoped fine-tuning",
    summary:
      "Test model architectures, run parameter-efficient fine-tuning (such as LoRA adapters), or validate reproducible training scripts on dedicated RTX hardware when VRAM fits.",
    examples: [
      "Short LoRA or QLoRA adapter experiments on curated domain datasets",
      "Automated evaluation sweeps across prompt templates and model checkpoints",
      "Debugging CUDA dependencies and memory footprints prior to larger cluster runs",
    ],
    fitNote: "Large multi-node pre-training is outside scope; feasibility is verified against real VRAM before quoting.",
  },
  {
    icon: "clapperboard",
    title: "3D rendering & Blender Cycles passes",
    summary:
      "Accelerate GPU-bound Blender Cycles scenes, product lighting variations, multi-angle shot lists, and turntable sequences on confirmed RTX hardware.",
    examples: [
      "Rendering scripted Blender Python (bpy) product angles and material colourways",
      "120-frame product turntables and high-sample still frames",
      "Batch look-dev passes paired with post-render web optimization",
    ],
    fitNote: "Connects directly with the studio's reproducible Blender scene architecture and ffmpeg delivery pipeline.",
  },
  {
    icon: "layers",
    title: "Media pipelines & custom GPU tasks",
    summary:
      "Offload GPU-accelerated media transcoding, frame processing, or specialized CUDA utilities where dedicated access beats unpredictable cloud queues.",
    examples: [
      "High-throughput video encoding, contact-sheet extraction, and codec testing",
      "Computer-vision inference over sample footage or inspection frames",
      "Custom Python/CUDA batch scripts scoped and verified during kickoff",
    ],
    fitNote: "All workloads are reviewed for hardware compatibility, legal compliance, and acceptable use before booking.",
  },
];

export const GPU_CONSULTATION_PROCESS: GpuProcessStep[] = [
  {
    step: "01",
    label: "Submit workload requirements",
    detail:
      "Send a concise summary of your job via the project inquiry form: framework or renderer, estimated VRAM and storage footprint, dataset transfer needs, and target window.",
    output: "Output: Initial workload brief received by Ali",
  },
  {
    step: "02",
    label: "Discuss requirements in a meeting",
    detail:
      "Hold a short technical call to clarify dependencies, container or CLI expectations, privacy/data-handling boundaries, and whether you need setup help or raw compute time.",
    output: "Output: Agreed technical requirements and operating boundaries",
  },
  {
    step: "03",
    label: "Check server capacity and hardware fit",
    detail:
      "Ali checks real RTX server availability, verifies that VRAM, storage, and runtime versions support your job cleanly, and flags any constraints upfront.",
    output: "Output: Honest go / no-go hardware fit confirmation",
  },
  {
    step: "04",
    label: "Receive a custom hourly quote",
    detail:
      "If the workload is a clean match, you receive a written custom hourly quote, scheduled compute window, access instructions, and clear post-run cleanup terms.",
    output: "Output: Written custom hourly quote & scheduled execution slot",
  },
];

export const GPU_COMPUTE_FAQS: FaqItem[] = [
  {
    q: "Is this a self-serve GPU cloud platform with instant sign-up?",
    a: "No. This is a consultation-led compute rental service on Ali's RTX server. Every booking starts with your workload requirements, a short technical fit discussion, a real capacity check, and a custom hourly quote — there is no self-serve checkout or automated provisioning portal.",
  },
  {
    q: "Why are exact GPU hardware specs, availability, and hourly prices marked as placeholders right now?",
    a: "This page intentionally avoids inventing hardware counts, VRAM figures, SLAs, or prices before Ali confirms the exact production server specification and security terms. Confirmed specifications are shared directly during consultation and will replace these placeholders once verified.",
  },
  {
    q: "What workloads are a good fit — and what is not a good fit?",
    a: "Good fits include bounded AI inference batches, model evaluation, small-to-medium fine-tuning tests (where VRAM fits), Blender Cycles 3D rendering, and GPU-accelerated media processing. Mission-critical 24/7 production hosting, multi-node cluster training, or regulated workloads requiring certified enterprise compliance (such as HIPAA or SOC 2) are not a fit.",
  },
  {
    q: "Can Ali also help build the AI workflow, Blender scene, or automation around the GPU run?",
    a: "Yes. Because compute consultation sits inside the same studio as AI agent engineering, n8n workflow automation, web development, and Blender 3D visualization, you can engage strictly for scoped compute time or pair it with engineering support.",
  },
  {
    q: "How is pricing calculated?",
    a: "Every engagement is quoted individually as a custom hourly rate after reviewing your workload, expected runtime, scheduling window, and whether any environment setup assistance is required. No commitment is made before you approve the written quote.",
  },
];

/** Portfolio builds that connect naturally to GPU compute, AI testing, or 3D rendering. */
export const GPU_RELATED_PROJECT_SLUGS = [
  "blender-product-visualisation",
  "motion-production-pipeline",
  "tideline-support-agent",
  "kestrel-voice-sales-agent",
] as const;

/** Planning calculators useful alongside compute & AI infrastructure scoping. */
export const GPU_RELATED_TOOLS = [
  {
    href: "/tools/saas-cost-calculator",
    title: "SaaS Cost Calculator",
    description: "Model monthly AI API, hosting, and compute operating run-rates alongside engineering TCO.",
  },
  {
    href: "/tools/automation-roi-calculator",
    title: "Automation ROI Calculator",
    description: "Weigh compute and build costs against manual hours reclaimed before running a pilot.",
  },
  {
    href: "/tools/project-budget-calculator",
    title: "Project Budget Calculator",
    description: "Budget engineering hours, direct infrastructure expenses, and contingency reserves.",
  },
] as const;

/** States where AI, semiconductor, aerospace, cloud, or media sectors make RTX compute consultation especially relevant. */
export const GPU_COMPUTE_FIT_STATES = [
  "california",
  "texas",
  "washington",
  "virginia",
  "new-york",
  "massachusetts",
  "colorado",
  "arizona",
  "oregon",
  "illinois",
  "georgia",
  "north-carolina",
  "utah",
] as const;

/** Registered pilot cities where AI, cloud, film/media, or engineering clusters make GPU compute especially relevant. */
export const GPU_COMPUTE_FIT_CITIES = [
  "san-francisco",
  "austin",
  "seattle",
  "los-angeles",
  "new-york-city",
  "boston",
  "denver",
  "atlanta",
  "phoenix",
  "chicago",
] as const;
