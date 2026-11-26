/**
 * Modest, Consultation-Led GPU & Compute service architecture.
 *
 * Truthfulness & boundary rules:
 *  - Positioned honestly as small, limited-capacity single-host compute operated
 *    directly by Ali Arshad — NOT an elastic AWS/Oracle-scale cloud platform.
 *  - Exact host hardware specs, VRAM, host RAM, storage quotas, availability
 *    windows, and custom quotes are confirmed per request during scoping rather
 *    than published as guaranteed capacity or fixed public pricing.
 *  - Zero invented prices, billing units, uptime SLAs, regions, or compliance certifications.
 */

import type { IconName } from "@/components/ui/Icon";
import type { PublicationState } from "@/lib/seo/publication";
import type { FaqItem } from "@/lib/structured-data";

export const GPU_COMPUTE_PATH = "/services/gpu-compute";
export const GPU_COMPUTE_CONTACT_SERVICE = "RTX GPU Compute Rental (Consultation)";

export const GPU_COMPUTE_PUBLICATION_STATE: PublicationState = "Published";

export type GpuSpecParameter = {
  parameter: string;
  status: "Confirmed during consultation";
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

export type GpuTopicSlug =
  | "workloads"
  | "access"
  | "storage-backups"
  | "security"
  | "pricing"
  | "onboarding";

export type GpuTopicSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GpuTopicPage = {
  slug: GpuTopicSlug;
  navLabel: string;
  title: string;
  h1: string;
  eyebrow: string;
  lead: string;
  photo: {
    src: string;
    alt: string;
    caption: string;
  };
  responsibilitySplit?: {
    operatorHandles: string[];
    customerHandles: string[];
  };
  sections: GpuTopicSection[];
  faqs: FaqItem[];
  embedEstimator?: boolean;
};

export const GPU_COMPUTE_SPECS: GpuSpecParameter[] = [
  {
    parameter: "Host hardware & GPU allocation",
    status: "Confirmed during consultation",
    value: "Modest single-host Linux workstation/server — exact CPU, GPU model, and VRAM verified before booking",
    whyItMatters: "Ensures your rendering engine, build scripts, or model runtime genuinely fits real available capacity.",
  },
  {
    parameter: "Memory (VRAM & host RAM)",
    status: "Confirmed during consultation",
    value: "Actual available VRAM and host RAM headroom confirmed against your specific job footprint",
    whyItMatters: "Prevents out-of-memory failures on 3D scenes, simulation datasets, or bounded inference runs.",
  },
  {
    parameter: "Access method & environment",
    status: "Confirmed during consultation",
    value: "Key-based SSH shell, scoped container runtime, or operator-run batch execution agreed upfront",
    whyItMatters: "Clarifies whether you need interactive Linux terminal access or hands-off batch delivery.",
  },
  {
    parameter: "Storage, persistence & cleanup",
    status: "Confirmed during consultation",
    value: "Local working quota, retention window, export path, and post-run wipe confirmed in writing",
    whyItMatters: "Single-host storage is scoped per engagement — customers keep independent backups of all critical assets.",
  },
  {
    parameter: "Availability & scheduling",
    status: "Confirmed during consultation",
    value: "Real calendar window and booking duration checked directly against current studio capacity",
    whyItMatters: "Limited single-host capacity is scheduled intentionally rather than oversubscribed.",
  },
  {
    parameter: "Security & operational limits",
    status: "Confirmed during consultation",
    value: "Access boundaries, network rules, and NDA expectations agreed before any data transfer",
    whyItMatters: "Provides plain-English clarity without claiming enterprise compliance certifications (no SOC 2/HIPAA).",
  },
  {
    parameter: "Pricing & quote structure",
    status: "Confirmed during consultation",
    value: "Custom written quote based on verified workload, runtime window, and setup needs — zero published rate sheet",
    whyItMatters: "Avoids misleading placeholder rates and confirms exact scope before any commitment.",
  },
];

export const GPU_WORKLOADS: GpuWorkload[] = [
  {
    icon: "clapperboard",
    title: "3D rendering & Blender Cycles passes",
    summary:
      "Offload GPU-accelerated Blender Cycles product scenes, multi-angle lighting variants, and turntable render queues where single-host GPU rendering saves local workstation bottlenecks.",
    examples: [
      "Scripted Blender Python (bpy) multi-angle product renders and material colorways",
      "High-sample still frames and turntable animation sequences",
      "Batch post-render encoding and web media preparation",
    ],
    fitNote: "Evaluated against scene texture/geometry memory and confirmed hardware availability before quoting.",
  },
  {
    icon: "code",
    title: "Linux dev/test & staging environments",
    summary:
      "Short-term dedicated Linux environments for compiling heavy builds, validating Docker stacks, testing GPU libraries, or running reproducible integration suites.",
    examples: [
      "Testing CUDA/Linux build pipelines and containerized workloads before cloud rollout",
      "Running temporary database/app integration environments for sprint demos",
      "Benchmarking scripts on consistent bare-metal Linux hardware",
    ],
    fitNote: "Designed for scoped dev/test windows — not for 24/7 customer-facing production hosting.",
  },
  {
    icon: "layers",
    title: "Batch processing, media & technical compute",
    summary:
      "Bounded batch runs including video transcoding, frame extraction, computer-vision scripts, or practical technical/simulation compute that fits single-node memory.",
    examples: [
      "FFmpeg hardware-assisted batch transcoding and proxy generation",
      "Bounded Python scientific, geometric, or simulation batch runs",
      "Offline dataset preprocessing and automated verification sweeps",
    ],
    fitNote: "Suitability depends on software dependencies, disk I/O, and runtime duration verified upfront.",
  },
  {
    icon: "bot",
    title: "Bounded AI inference & model evaluation",
    summary:
      "Practical offline inference batches, embedding generation, or modest checkpoint evaluation where single-GPU VRAM comfortably fits the workload.",
    examples: [
      "Evaluating open-weight models or RAG retrieval quality over bounded test sets",
      "Batch document extraction or classification scripts",
      "Debugging memory footprints prior to larger external cloud runs",
    ],
    fitNote: "Large multi-GPU training clusters and high-availability inference APIs are outside scope.",
  },
];

export const GPU_CONSULTATION_PROCESS: GpuProcessStep[] = [
  {
    step: "01",
    label: "Share workload scope",
    detail:
      "Outline your software stack, estimated VRAM/RAM/storage footprint, preferred access style (SSH, container, or batch handoff), and target timeframe.",
    output: "Output: Structured workload brief sent directly to Ali",
  },
  {
    step: "02",
    label: "Review fit & boundaries",
    detail:
      "Short technical check covering dependencies, data transfer, security boundaries, and whether single-host compute is genuinely the right fit.",
    output: "Output: Honest go / no-go technical fit confirmation",
  },
  {
    step: "03",
    label: "Confirm live capacity & written quote",
    detail:
      "Verify actual host availability for your window and confirm exact specifications, retention rules, and custom pricing in writing.",
    output: "Output: Written custom quote and scheduled access slot",
  },
  {
    step: "04",
    label: "Access handoff, execution & cleanup",
    detail:
      "Provision agreed SSH/container access (or execute agreed batch job), deliver outputs, and wipe temporary project files once you confirm retrieval.",
    output: "Output: Completed workload outputs and confirmed cleanup",
  },
];

export const GPU_TOPIC_PAGES: GpuTopicPage[] = [
  {
    slug: "workloads",
    navLabel: "Workloads & Capacity",
    title: "GPU & Compute Workloads and Capacity Boundaries",
    h1: "Supported workloads and honest capacity limits",
    eyebrow: "GPU & Compute · Workloads & Capacity",
    lead: "Practical single-host compute fits bounded rendering, Linux dev/test, batch processing, and modest inference — not hyperscaler elastic clusters.",
    photo: {
      src: "/images/services/gpu-render-pipeline.jpg",
      alt: "Dual-display studio workstation showing a 3D wireframe and shaded product scene alongside Linux command-line render progress",
      caption: "Illustrative studio scene — bounded rendering and batch processing verified against real host capacity before booking.",
    },
    responsibilitySplit: {
      operatorHandles: [
        "Verifying whether your target workload fits current host hardware before accepting a booking",
        "Confirming available calendar slots and basic OS/driver readiness",
        "Communicating clearly when a hyperscaler cloud provider is the better fit",
      ],
      customerHandles: [
        "Providing accurate estimates of VRAM, host RAM, disk footprint, and runtime length",
        "Supplying licensed software, reproducible scripts, or container specs",
        "Managing job checkpoints so work can resume cleanly if interrupted",
      ],
    },
    sections: [
      {
        heading: "Practical workloads that fit a modest single-host setup",
        paragraphs: [
          "Many teams do not need a multi-region cloud cluster just to render a product animation batch, validate a Linux build pipeline, run a bounded engineering script, or test an inference prototype. A small, operator-run compute slot can be simpler to scope and discuss with one technical person.",
          "Every workload — whether 3D Blender Cycles rendering, development/test environments, batch media transcoding, technical simulation, or bounded AI evaluation — is checked against current verified host specifications before any booking is confirmed.",
        ],
        bullets: [
          "3D rendering & Blender Cycles scenes (stills, colorways, scripted camera angles, turntables)",
          "Linux dev/test environments for reproducible builds, container validation, and staging checks",
          "Batch processing: FFmpeg video encodes, image pipelines, bounded Python compute",
          "Bounded AI evaluation: offline batch inference and retrieval testing within single-card VRAM",
        ],
      },
      {
        heading: "What is explicitly NOT supported",
        paragraphs: [
          "Clarity upfront prevents wasted time. This is a small, limited-capacity personal studio compute offering — not an AWS, Google Cloud, or Oracle Cloud substitute.",
        ],
        bullets: [
          "No 24/7 high-availability production APIs, public SaaS hosting, or uptime SLA guarantees",
          "No multi-node GPU clusters, distributed pre-training, or elastic auto-scaling fleets",
          "No multi-region failover, guaranteed instant capacity, or self-serve spot bidding",
          "No cryptocurrency mining, unauthorized scraping, or workloads violating acceptable use",
        ],
      },
    ],
    faqs: [
      {
        q: "Can you guarantee GPU availability for urgent same-day jobs?",
        a: "No. Because capacity is limited to studio hardware rather than an elastic cloud fleet, availability is always checked and confirmed per request before booking.",
      },
      {
        q: "Will you tell us if AWS, RunPod, or another cloud provider makes more sense?",
        a: "Yes. If your job needs multi-GPU VRAM, instant scale, regional compliance, or 24/7 availability, I will say so upfront during technical review.",
      },
    ],
  },
  {
    slug: "access",
    navLabel: "Console & SSH Access",
    title: "Console and SSH Access Setup for GPU & Compute",
    h1: "Console, SSH access, and connection setup",
    eyebrow: "GPU & Compute · Console & SSH Access",
    lead: "Clear, key-based SSH and scoped environment onboarding — with no self-serve dashboard claims or confusing network promises.",
    photo: {
      src: "/images/services/gpu-workstation-console.jpg",
      alt: "Software engineer working at a dark studio desk with a matte display showing a Linux SSH terminal console",
      caption: "Illustrative editorial scene — interactive Linux shell access or operator-managed batch execution scoped before kickoff.",
    },
    responsibilitySplit: {
      operatorHandles: [
        "Provisioning an agreed scoped Linux user or isolated container workspace for your booking window",
        "Registering your provided SSH public key (password SSH login disabled)",
        "Sharing connection details, host fingerprint, and agreed file-transfer instructions securely",
      ],
      customerHandles: [
        "Generating and protecting your own SSH keypair (never send private keys)",
        "Installing project-specific Python/Node/application dependencies inside your scoped workspace",
        "Validating access immediately at the start of the scheduled window",
      ],
    },
    sections: [
      {
        heading: "Three practical ways access can be structured",
        paragraphs: [
          "Depending on your team's comfort with Linux CLI tooling and your security preferences, access is agreed in one of three clear modes during consultation:",
        ],
        bullets: [
          "Key-based SSH shell access: standard OpenSSH access using your Ed25519/RSA public key for running CLI jobs, tmux sessions, and dev/test tooling.",
          "Scoped container workspace: running your agreed Docker image or reproducible environment inside defined CPU/GPU/storage boundaries.",
          "Operator-run batch execution: you deliver approved input files and scripts; Ali executes the batch on confirmed hardware and returns verified outputs.",
        ],
      },
      {
        heading: "Connection & file transfer expectations",
        paragraphs: [
          "Remote connectivity, firewall allowlisting (where applicable), and dataset transfer paths (such as SFTP, rsync over SSH, or private object storage pull/push) are confirmed before your session begins so upload/download throughput is realistic for your dataset size.",
          "There is no automated self-serve web console or instant credit-card provisioning portal; every access grant is created manually for the confirmed engagement window and revoked cleanly afterward.",
        ],
      },
    ],
    faqs: [
      {
        q: "Do you provide a web-based cloud console like AWS EC2?",
        a: "No. Access is provisioned directly via key-based SSH, an agreed container workflow, or operator-run batch handoff after technical scoping.",
      },
      {
        q: "Can multiple teammates connect during the same window?",
        a: "Where agreed upfront, additional team public keys can be authorized for the same project workspace so access remains auditable per person.",
      },
    ],
  },
  {
    slug: "storage-backups",
    navLabel: "Storage & Backups",
    title: "Databases, Storage, Persistence and Backups — GPU & Compute",
    h1: "Databases, storage, persistence, and backup limits",
    eyebrow: "GPU & Compute · Storage & Persistence",
    lead: "Honest expectations for scratch disks, temporary project volumes, test databases, and why customers always keep their own independent backups.",
    photo: {
      src: "/images/services/gpu-server-hardware.jpg",
      alt: "Close-up documentary photograph of a matte-black workstation server chassis showing GPU cooling heatsink, braided cables, and NVMe storage bay",
      caption: "Illustrative hardware view — exact local NVMe quota and retention rules are confirmed before every booking.",
    },
    responsibilitySplit: {
      operatorHandles: [
        "Confirming available local working disk quota prior to booking",
        "Keeping agreed project directories intact during the active scheduled window",
        "Executing confirmed post-run file removal once you verify output downloads",
      ],
      customerHandles: [
        "Maintaining authoritative primary copies and backups of all code, datasets, and assets off-host",
        "Downloading all final renders, artifacts, or database dumps before the retention window closes",
        "Using dedicated managed cloud databases (e.g., Neon, RDS, Supabase) for production data",
      ],
    },
    sections: [
      {
        heading: "Scratch storage vs. short-term project persistence",
        paragraphs: [
          "Compute bookings use local host storage scoped to your engagement window. This works well for staging source scenes, intermediate render frames, temporary test datasets, or build caches.",
          "Long-term archival storage, multi-zone replication, and automated point-in-time disaster recovery are NOT part of this service. Treat host storage as temporary workspace storage and sync finished artifacts back to your own cloud bucket or local repository.",
        ],
        bullets: [
          "Ephemeral scratch mode: workspace is wiped immediately after output confirmation.",
          "Short-term project volume: retained strictly for the agreed multi-day booking window, then purged on sign-off.",
          "Local test databases (e.g., PostgreSQL/Redis in Docker): suitable strictly for dev/test staging with seeded or disposable data — never for irreplaceable production customer records.",
        ],
      },
      {
        heading: "No implied backup SLA",
        paragraphs: [
          "Because this is a small single-host compute offering rather than a replicated storage provider, there are no automated off-site backup guarantees or durability SLAs. Before uploading inputs, keep your own master copy, and verify downloaded outputs promptly when a run completes.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I host a live production PostgreSQL database here permanently?",
        a: "No. Temporary test or staging databases for dev/test runs are fine when scoped upfront, but live production databases belong on dedicated managed platforms with automated backups and failover.",
      },
      {
        q: "What happens to our files after the job finishes?",
        a: "Once you confirm you have downloaded and verified all outputs (or when the agreed retention window expires), project files and temporary volumes are deleted.",
      },
    ],
  },
  {
    slug: "security",
    navLabel: "Security & Boundaries",
    title: "Security, Access Control and Operational Boundaries — GPU & Compute",
    h1: "Security, access control, and operational boundaries",
    eyebrow: "GPU & Compute · Security & Boundaries",
    lead: "Straightforward single-host security practices — with zero exaggerated compliance claims or hidden multi-tenant surprises.",
    photo: {
      src: "/images/services/gpu-workstation-console.jpg",
      alt: "Engineer inspecting Linux terminal access and configuration in a quiet studio workspace",
      caption: "Illustrative editorial scene — access controls, key-based SSH, and clear operator vs. customer boundaries agreed in writing.",
    },
    responsibilitySplit: {
      operatorHandles: [
        "Enforcing key-based SSH access and revoking keys promptly after booking close",
        "Limiting bookings so active customer workloads are scheduled cleanly rather than silently oversubscribed",
        "Maintaining host OS security updates and basic firewall rules between engagements",
        "Signing practical mutual NDAs when reviewed and agreed prior to transfer",
      ],
      customerHandles: [
        "Avoiding upload of regulated personal, medical, or payment data requiring certified compliance",
        "Securing application secrets, API tokens, and private keys used inside your scripts",
        "Reviewing downloaded outputs and requesting immediate post-run cleanup",
      ],
    },
    sections: [
      {
        heading: "Clear operational boundaries",
        paragraphs: [
          "Trust starts with honesty about what a small operator-run environment can and cannot certify. Access is kept minimal, manual, and documented: SSH key authentication, scoped project directories, minimal exposed ports, and clean deprovisioning after completion.",
          "However, a personal studio compute host does NOT hold third-party compliance audits such as SOC 2 Type II, ISO 27001, HIPAA, FedRAMP, or PCI-DSS. Regulated healthcare records, payment cardholder data, or legally restricted government datasets must stay on certified enterprise cloud environments.",
        ],
      },
      {
        heading: "Network & acceptable-use guardrails",
        paragraphs: [
          "Inbound public ports are kept closed by default unless a temporary scoped test tunnel is explicitly agreed. Outbound access is intended for legitimate package installs, repository pulls, and artifact transfers. All workloads are screened for legality and stability before onboarding.",
        ],
      },
    ],
    faqs: [
      {
        q: "Are you SOC 2, HIPAA, or ISO 27001 certified?",
        a: "No. Those are enterprise audit certifications for dedicated cloud providers. If your contract requires certified compliance, use a certified provider such as AWS, GCP, or Azure.",
      },
      {
        q: "Can we sign an NDA before sharing pre-release 3D files or code?",
        a: "Yes — reasonable confidentiality terms can be reviewed and agreed in writing before any proprietary assets are transferred.",
      },
    ],
  },
  {
    slug: "pricing",
    navLabel: "Pricing & Quote Estimator",
    title: "GPU & Compute Quote-Led Pricing and Workload Estimator",
    h1: "Quote-led pricing — scoped to your actual workload",
    eyebrow: "GPU & Compute · Pricing & Quote Request",
    lead: "Availability and pricing are confirmed per request after verifying hardware fit. Use the scope estimator below to structure your brief with zero invented rates.",
    photo: {
      src: "/images/services/gpu-server-hardware.jpg",
      alt: "Close-up photograph of matte-black workstation hardware on an anti-static studio mat",
      caption: "Illustrative hardware view — quotes reflect verified host availability, duration, and any optional setup assistance.",
    },
    sections: [
      {
        heading: "Why there is no fixed public rate sheet",
        paragraphs: [
          "Publishing made-up hourly numbers or fake cloud pricing tiers when real single-host availability depends on workload complexity and scheduling would be dishonest. Instead, every request receives a plain-English written quote before any commitment.",
        ],
        bullets: [
          "Workload profile: raw compute slot vs. assisted environment setup or Blender/pipeline configuration",
          "Duration & scheduling window: short bounded batch vs. multi-day dev/test window",
          "Storage & transfer scope: temporary scratch needs and data transfer coordination",
          "Honest fit check: zero charge for the initial feasibility review",
        ],
      },
    ],
    faqs: [
      {
        q: "Does the estimator below lock in a price or reserve hardware?",
        a: "No. It simply screens basic single-host fit and builds a clean workload summary you can send to Ali so real availability and pricing can be confirmed in writing.",
      },
      {
        q: "Are there minimum commitments or surprise egress fees?",
        a: "Every parameter — duration, billing basis, transfer method, and cleanup window — is stated clearly in writing before work starts.",
      },
    ],
    embedEstimator: true,
  },
  {
    slug: "onboarding",
    navLabel: "Onboarding & FAQ",
    title: "GPU & Compute Onboarding Checklist and Technical FAQ",
    h1: "Setup, onboarding checklist, and practical FAQ",
    eyebrow: "GPU & Compute · Setup & Onboarding",
    lead: "What happens from your first message to access handoff, workload execution, and clean post-run deprovisioning.",
    photo: {
      src: "/images/services/gpu-render-pipeline.jpg",
      alt: "Creative engineering workstation displaying 3D rendering viewport and Linux command line",
      caption: "Illustrative studio scene — structured kickoff keeps compute sessions predictable from brief to cleanup.",
    },
    sections: [
      {
        heading: "Before your first session: readiness checklist",
        paragraphs: [
          "Preparing four quick items ahead of kickoff saves setup friction and keeps your booked window focused on real execution:",
        ],
        bullets: [
          "Workload summary: target framework, renderer, or script + expected VRAM/RAM/disk needs",
          "Reproducible dependencies: Dockerfile, requirements.txt, package.json, or exact Blender/tool version",
          "Access key: your Ed25519 SSH public key (if requesting direct Linux shell access)",
          "Transfer & backup plan: confirmed off-host source copy and target destination for completed outputs",
        ],
      },
      {
        heading: "Step-by-step onboarding sequence",
        paragraphs: [
          "1. Submit your workload scope via the Quote Estimator or Contact page. 2. Ali reviews technical fit and checks live capacity. 3. You receive an honest go/no-go confirmation plus a written custom quote and proposed window. 4. Upon written approval, access is provisioned (or batch files accepted), outputs are delivered, and temporary files are removed after your sign-off.",
        ],
      },
    ],
    faqs: [
      {
        q: "How long does onboarding take once a quote is approved?",
        a: "Timing depends on current studio schedule and whether custom environment setup is requested; exact start windows are confirmed in writing before approval rather than promised with an automated SLA.",
      },
      {
        q: "Can Ali help debug our Blender script or Docker environment before the run?",
        a: "Yes. Optional setup and engineering support can be scoped cleanly alongside the compute window.",
      },
      {
        q: "What if our job runs longer than expected?",
        a: "Extensions depend on whether the host is booked afterward; we agree upfront on checkpointing and how overruns are handled so jobs do not lose progress unexpectedly.",
      },
    ],
  },
];

export function getGpuTopic(slug: string): GpuTopicPage | undefined {
  return GPU_TOPIC_PAGES.find((t) => t.slug === slug);
}

export const GPU_COMPUTE_FAQS: FaqItem[] = [
  {
    q: "Is this a self-serve cloud platform comparable to AWS or Oracle Cloud?",
    a: "No. This is a small, limited-capacity compute service run directly by Ali Arshad. Every request starts with a workload fit check, live capacity verification, and a written quote — there is no self-serve dashboard, multi-region fleet, or uptime SLA.",
  },
  {
    q: "Why are exact hardware specs, availability, and pricing confirmed per request?",
    a: "Because single-host studio hardware has real physical limits and changing schedule availability. Confirming actual CPU, GPU VRAM, RAM, disk headroom, and a written quote per request keeps expectations honest and prevents failed bookings.",
  },
  {
    q: "What non-AI workloads are supported?",
    a: "Where verified host configuration supports your stack, practical non-AI uses include Blender Cycles 3D rendering, temporary Linux dev/test environments, FFmpeg media transcoding, and bounded engineering/batch processing.",
  },
  {
    q: "Who handles backups and security?",
    a: "Ali handles basic host setup, key-based SSH provisioning, and post-run workspace deletion upon confirmation. You keep authoritative off-host backups of all inputs/outputs and must not upload regulated compliance data (no SOC 2 or HIPAA certification is claimed).",
  },
  {
    q: "Can Ali also help build the software, automation, or Blender scene around the compute run?",
    a: "Yes. Because this sits inside Ali Arshad Personal Studio alongside web development, n8n automation, and Blender 3D workflows, you can request pure compute coordination or pair it with engineering help.",
  },
];

export const GPU_RELATED_PROJECT_SLUGS = [
  "blender-product-visualisation",
  "motion-production-pipeline",
  "tideline-support-agent",
  "kestrel-voice-sales-agent",
] as const;

export const GPU_RELATED_TOOLS = [
  {
    href: "/tools/gpu-quote-estimator",
    title: "GPU Workload & Quote Scope Estimator",
    description: "Screen single-host workload fit and export a structured scope brief with zero invented rates.",
  },
  {
    href: "/tools/saas-cost-calculator",
    title: "SaaS Cost Calculator",
    description: "Compare ongoing cloud hosting and API run-rates alongside engineering TCO.",
  },
  {
    href: "/tools/project-budget-calculator",
    title: "Project Budget Calculator",
    description: "Budget engineering hours, direct infrastructure expenses, and contingency reserves.",
  },
] as const;

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
