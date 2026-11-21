import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import {
  assessmentAttempts,
  assessments,
  courses,
  lessonProgress,
  lessons,
  modules,
  resources,
  tutorMessages,
  users,
  type DifficultyTier,
  type QuizQuestion,
  type ResourceKind,
} from "@/db/schema";
import { gradeAssessment } from "@/lib/adaptive";
import { DEMO_ACCOUNT, generateLockedPassword, hashPassword } from "@/lib/crypto";

type SeedLesson = {
  title: string;
  durationMins: number;
  contentMd: string;
  keyTakeaways: string[];
};

type SeedModule = {
  title: string;
  lessons: SeedLesson[];
};

type SeedAssessment = {
  title: string;
  difficulty: DifficultyTier;
  questions: QuizQuestion[];
};

type SeedResource = {
  title: string;
  kind: ResourceKind;
  summary: string;
  urlOrRef: string;
};

type SeedCourse = {
  slug: string;
  title: string;
  category: string;
  difficulty: DifficultyTier;
  description: string;
  instructorName: string;
  modules: SeedModule[];
  assessments: SeedAssessment[];
  resources: SeedResource[];
};

const SEED_COURSES: SeedCourse[] = [
  {
    slug: "applied-llm-engineering",
    title: "Applied LLM Systems & Grounded Retrieval",
    category: "AI Engineering",
    difficulty: "intermediate",
    description:
      "Design reliable curriculum-grounded AI applications using chunking invariants, hybrid retrieval, structured output contracts, and reproducible evaluation suites.",
    instructorName: "Dr. Kavita Patel",
    modules: [
      {
        title: "Module 1: Retrieval & Context Architecture",
        lessons: [
          {
            title: "Chunking Strategies & Semantic Boundaries",
            durationMins: 16,
            contentMd: `## Why Chunk Boundaries Decide Retrieval Quality

Every grounded AI tutor or enterprise search workflow succeeds or fails at indexing time. Naive fixed-character splits frequently sever definitions from their examples or split code snippets in half.

## Core Chunking Principles
- **Structure-first splitting:** Split along headings, paragraphs, and semantic sections before enforcing token ceilings.
- **Controlled overlap:** Keep 10%–15% sliding overlap across adjacent chunks so cross-sentence references stay intact.
- **Attach structural metadata:** Persist course title, module name, and lesson headings alongside every passage so citations stay traceable.

## Production Checklist
Measure recall@5 on a 30-question golden set before tuning prompts. Improving chunk coherence typically yields larger accuracy gains than switching models.`,
            keyTakeaways: [
              "Split along document headings and semantic boundaries before applying hard token limits.",
              "Preserve 10–15% overlap to prevent orphaned pronoun and concept references.",
              "Store source hierarchy metadata (course, module, lesson) for auditable citations.",
            ],
          },
          {
            title: "Hybrid Search & Reranking Signals",
            durationMins: 18,
            contentMd: `## Combining Lexical Precision with Semantic Recall

Dense embeddings excel at paraphrased conceptual questions, but often miss exact API identifiers, error codes, or domain acronyms. Hybrid retrieval merges BM25/keyword matching with semantic similarity.

## Reciprocal Rank Fusion (RRF)
- Run lexical and semantic queries in parallel against the same corpus.
- Combine rank positions via RRF so results appearing near the top of both lists rise cleanly without fragile score normalization.
- Apply a lightweight reranker or title-boost pass for top-10 candidates before assembling the final context pack.

## Latency Discipline
Cap candidate retrieval under 120ms so interactive learning sessions feel immediate.`,
            keyTakeaways: [
              "Pair lexical keyword search with semantic retrieval to capture both exact terms and intent.",
              "Use Reciprocal Rank Fusion (RRF) to merge heterogeneous rankings cleanly.",
              "Boost title and key-takeaway matches when grounding educational tutor replies.",
            ],
          },
          {
            title: "Context Window Budgeting & Citation Grounding",
            durationMins: 14,
            contentMd: `## Designing High-Signal Context Windows

Stuffing 25 loosely related passages into a prompt dilutes attention and increases hallucination rates. Curated, compact context windows consistently outperform noisy dumps.

## Grounding Contract
- Reserve clear token budgets: system rules, top-k retrieved lessons, conversation history, and generation headroom.
- Require explicit lesson citations so learners can jump directly to primary material.
- When retrieved evidence is weak, acknowledge the gap instead of fabricating syllabus facts.`,
            keyTakeaways: [
              "Smaller, high-precision context packs reduce drift and latency.",
              "Enforce explicit source citations back to module and lesson records.",
              "Handle missing syllabus coverage transparently rather than guessing.",
            ],
          },
        ],
      },
      {
        title: "Module 2: Evaluation & Guardrails",
        lessons: [
          {
            title: "Golden Eval Datasets & Regression Rubrics",
            durationMins: 20,
            contentMd: `## Treating Prompts & Retrieval as Versioned Code

An AI learning system cannot be improved reliably by manual spot-checking alone. Build a versioned evaluation suite covering factual grounding, clarity, and edge-case refusal.

## Three Evaluation Layers
1. **Retrieval precision:** Did the top-3 passages contain the canonical answer?
2. **Faithfulness:** Are every claim and takeaway traceable to retrieved syllabus text?
3. **Pedagogical clarity:** Does the answer give the learner a concrete next study action?`,
            keyTakeaways: [
              "Track retrieval precision, faithfulness, and pedagogical clarity separately.",
              "Run golden regression checks whenever chunking or retrieval weights change.",
              "Keep a mix of straightforward, ambiguous, and out-of-scope test prompts.",
            ],
          },
          {
            title: "Deterministic Fallbacks & Structured Outputs",
            durationMins: 15,
            contentMd: `## Graceful Degradation Without Paid API Lock-In

Production learning systems must stay operational even when upstream LLM APIs rate-limit, time out, or are disabled in local/sandbox environments.

## Layered Synthesis Pattern
- Keep a deterministic retrieval + template synthesis engine as a first-class baseline.
- Validate any optional external model output against strict Zod schemas and timeouts.
- Always keep API keys strictly server-side and never bundle credentials into browser code.`,
            keyTakeaways: [
              "A deterministic curriculum engine guarantees uptime and zero-cost local execution.",
              "Enforce short network timeouts and automatic fallback when optional LLM hooks are enabled.",
              "Keep external provider credentials strictly in server environment variables.",
            ],
          },
        ],
      },
    ],
    assessments: [
      {
        title: "Retrieval & Grounding Foundations Check",
        difficulty: "foundation",
        questions: [
          {
            id: "llm-f-1",
            prompt: "Why should structure-first chunking run before enforcing fixed character limits?",
            options: [
              "It keeps headings, definitions, and examples semantically intact.",
              "It eliminates the need for database indexes.",
              "It removes all metadata from stored lessons.",
              "It forces every chunk to be exactly 50 characters.",
            ],
            correctIndex: 0,
            explanation: "Splitting on headings and paragraphs preserves conceptual coherence so retrieval returns complete ideas.",
            topicTag: "Chunking",
          },
          {
            id: "llm-f-2",
            prompt: "What is the main advantage of pairing lexical search with semantic retrieval?",
            options: [
              "It avoids storing lesson text in PostgreSQL.",
              "It captures both exact identifiers/terms and paraphrased conceptual intent.",
              "It removes the need for citation tracking.",
              "It increases token window noise intentionally.",
            ],
            correctIndex: 1,
            explanation: "Hybrid search combines exact keyword precision with conceptual recall.",
            topicTag: "Hybrid Search",
          },
          {
            id: "llm-f-3",
            prompt: "What should a curriculum-grounded tutor do when no course lesson covers a student's question?",
            options: [
              "Invent a plausible citation from memory.",
              "Silently switch courses without telling the learner.",
              "Acknowledge the syllabus gap transparently and guide next steps.",
              "Return an empty HTTP 500 error.",
            ],
            correctIndex: 2,
            explanation: "Grounded tutors state gaps transparently rather than hallucinating unsupported facts.",
            topicTag: "Grounding",
          },
          {
            id: "llm-f-4",
            prompt: "Where must optional external LLM API keys be kept in a Next.js full-stack app?",
            options: [
              "Inside NEXT_PUBLIC_ environment variables.",
              "Hardcoded inside client components for speed.",
              "In browser localStorage.",
              "Strictly in server-side environment variables never exposed to the client.",
            ],
            correctIndex: 3,
            explanation: "API keys must remain exclusively on the server to prevent credential leakage.",
            topicTag: "Security & Fallbacks",
          },
        ],
      },
      {
        title: "Hybrid Retrieval & Evaluation Practice",
        difficulty: "intermediate",
        questions: [
          {
            id: "llm-i-1",
            prompt: "Why is Reciprocal Rank Fusion (RRF) preferred when merging lexical and vector search results?",
            options: [
              "It combines rank positions cleanly without brittle cross-scorer normalization.",
              "It requires training a second neural network per query.",
              "It discards all keyword matches automatically.",
              "It doubles the size of every chunk.",
            ],
            correctIndex: 0,
            explanation: "RRF relies on rank order rather than incomparable raw similarity scales.",
            topicTag: "Hybrid Search",
          },
          {
            id: "llm-i-2",
            prompt: "Which metric isolates whether the retriever surfaced the right syllabus passages before generation?",
            options: [
              "CSS paint timing",
              "Retrieval recall@k / precision",
              "Total browser DOM nodes",
              "Session cookie TTL",
            ],
            correctIndex: 1,
            explanation: "Measuring retrieval recall@k separates indexing/search quality from synthesis quality.",
            topicTag: "Evaluation",
          },
          {
            id: "llm-i-3",
            prompt: "Why do compact, high-signal context windows beat dumping 25 passages into a prompt?",
            options: [
              "Less irrelevant text reduces attention dilution, latency, and unsupported drift.",
              "Models refuse to read more than 200 characters.",
              "Databases cannot return more than 2 rows.",
              "Compact contexts disable citation generation.",
            ],
            correctIndex: 0,
            explanation: "Focused context improves grounding faithfulness and response speed.",
            topicTag: "Context Budgeting",
          },
          {
            id: "llm-i-4",
            prompt: "What ensures an AI learning workspace stays usable if an upstream LLM API times out?",
            options: [
              "Retrying infinitely inside the browser tab.",
              "Disabling user login.",
              "Enforcing a tight timeout with automatic deterministic syllabus fallback.",
              "Clearing PostgreSQL tutor history.",
            ],
            correctIndex: 2,
            explanation: "Bounded timeouts plus a deterministic curriculum engine keep tutoring resilient.",
            topicTag: "Security & Fallbacks",
          },
        ],
      },
      {
        title: "Production Grounded Systems Challenge",
        difficulty: "advanced",
        questions: [
          {
            id: "llm-a-1",
            prompt: "Your golden eval shows retrieval recall@5 is 94%, yet faithfulness dropped to 68%. Where should you investigate first?",
            options: [
              "Context budgeting, citation instructions, and synthesis grounding constraints.",
              "Database TLS certificates.",
              "CSS font loading.",
              "User password hashing salt length.",
            ],
            correctIndex: 0,
            explanation: "High retrieval recall paired with low faithfulness points to synthesis/prompt grounding rather than search.",
            topicTag: "Evaluation Diagnostics",
          },
          {
            id: "llm-a-2",
            prompt: "Which structural pattern best preserves citation auditability across instructor lesson edits?",
            options: [
              "Static screenshots of old lessons.",
              "Querying live normalized PostgreSQL module/lesson records at tutor runtime.",
              "Hardcoding static FAQ strings inside the frontend bundle.",
              "Caching tutor answers permanently with no invalidation.",
            ],
            correctIndex: 1,
            explanation: "Reading live PostgreSQL syllabus records ensures edits in Instructor Studio immediately ground tutor answers.",
            topicTag: "Architecture",
          },
          {
            id: "llm-a-3",
            prompt: "When adding an optional server-side LLM hook alongside deterministic synthesis, what should be persisted per tutor message?",
            options: [
              "The raw API key used for the call.",
              "Only the student prompt without the reply.",
              "The response content, course scope, role, and execution mode (deterministic vs llm).",
              "Browser cookies in plaintext.",
            ],
            correctIndex: 2,
            explanation: "Persisting mode metadata provides transparency and auditability for every tutor turn.",
            topicTag: "Observability",
          },
          {
            id: "llm-a-4",
            prompt: "How should overlap be sized during semantic chunking to balance context continuity and index bloat?",
            options: [
              "0% overlap with 20-character chunks.",
              "10–15% controlled overlap at natural sentence boundaries.",
              "90% overlap across every paragraph.",
              "Randomly sampled words from other courses.",
            ],
            correctIndex: 1,
            explanation: "10–15% overlap maintains cross-sentence continuity without duplicating the corpus.",
            topicTag: "Chunking",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Hybrid Retrieval & RRF Reference Blueprint",
        kind: "guide",
        summary: "Step-by-step architecture guide covering structure-first chunking, RRF merging, and citation grounding.",
        urlOrRef: "orexa://guides/hybrid-retrieval-blueprint",
      },
      {
        title: "Evaluation Rubrics & Recall@K Cheatsheet",
        kind: "cheatsheet",
        summary: "Quick reference of retrieval recall, faithfulness, and latency targets for learning copilots.",
        urlOrRef: "orexa://cheatsheets/eval-rubrics",
      },
      {
        title: "Lab: Build a 15-Prompt Syllabus Regression Set",
        kind: "exercise",
        summary: "Hands-on exercise crafting positive, ambiguous, and out-of-scope test cases for your course tutor.",
        urlOrRef: "orexa://labs/syllabus-eval-set",
      },
      {
        title: "Session Notes: Deterministic Fallbacks in EdTech",
        kind: "video_notes",
        summary: "Annotated lecture notes on graceful degradation and zero-key deterministic curriculum engines.",
        urlOrRef: "orexa://notes/deterministic-fallbacks",
      },
    ],
  },
  {
    slug: "postgres-data-modeling",
    title: "Modern PostgreSQL & Analytical Data Modeling",
    category: "Data Systems",
    difficulty: "foundation",
    description:
      "Master relational schema design, indexing mechanics, EXPLAIN ANALYZE diagnostics, and safe zero-downtime migrations in PostgreSQL.",
    instructorName: "Omar Hassan",
    modules: [
      {
        title: "Module 1: Relational Integrity & Indexing",
        lessons: [
          {
            title: "Normalization vs Read-Optimized Projections",
            durationMins: 14,
            contentMd: `## Designing Schemas That Evolve Cleanly

Relational normalization eliminates update anomalies by keeping every fact in one authoritative table—such as storing \`courses\`, \`modules\`, \`lessons\`, and \`lesson_progress\` with explicit foreign keys.

## When to Project or Aggregate
- Keep write paths normalized with foreign keys and \`UNIQUE\` constraints (for example \`(user_id, lesson_id)\` on progress records).
- Compute dashboards from indexed joins or materialized rollups when read volume grows.
- Use \`JSONB\` purposefully for flexible structured payloads like quiz questions and graded attempt snapshots.`,
            keyTakeaways: [
              "Enforce relational integrity with foreign keys, CHECK constraints, and composite UNIQUE indexes.",
              "Use JSONB for structured snapshots like quiz answers while keeping core entities normalized.",
              "Avoid premature denormalization until query plans prove a bottleneck.",
            ],
          },
          {
            title: "B-Tree & GIN Index Mechanics",
            durationMins: 16,
            contentMd: `## Choosing the Right PostgreSQL Index

Indexes accelerate lookups and ordered scans at the cost of extra write maintenance. Understanding composite column order is one of the highest-leverage SQL skills.

## Practical Rules
- Put equality predicates first and range/sort columns second in composite B-Tree indexes (e.g., \`(user_id, created_at DESC)\`).
- Use \`GIN\` indexes when querying inside \`JSONB\` keys or full-text search vectors.
- Never index low-cardinality booleans alone unless wrapped in a partial index (\`WHERE completed = true\`).`,
            keyTakeaways: [
              "Order composite B-Tree columns by equality filters first, then sort/range columns.",
              "Use partial indexes to keep hot subsets compact and fast.",
              "Verify index usage with EXPLAIN ANALYZE instead of guessing.",
            ],
          },
          {
            title: "Transaction Isolation & Concurrency Patterns",
            durationMins: 15,
            contentMd: `## Preventing Race Conditions Under Load

When two requests update progress or submit assessments concurrently, atomic SQL primitives prevent lost updates and duplicate records.

## Upserts & Atomicity
- Prefer \`INSERT ... ON CONFLICT (user_id, lesson_id) DO UPDATE\` for idempotent progress toggles.
- Keep transactions short—never hold a database transaction open while awaiting slow external HTTP calls.`,
            keyTakeaways: [
              "Use atomic ON CONFLICT upserts for idempotent state transitions.",
              "Keep database transactions narrow and never wrap external network calls inside them.",
              "Understand PostgreSQL Read Committed vs Serializable guarantees.",
            ],
          },
        ],
      },
      {
        title: "Module 2: Query Tuning & Migrations",
        lessons: [
          {
            title: "Reading EXPLAIN ANALYZE Plans",
            durationMins: 18,
            contentMd: `## Diagnosing Slow Queries Systematically

\`EXPLAIN (ANALYZE, BUFFERS)\` reveals actual row counts, join strategies (Nested Loop vs Hash Join), and buffer hits.

## Red Flags to Watch
- Large mismatch between estimated rows and actual rows (stale table statistics).
- Sequential scans on large filtered tables missing a selective index.
- External disk sorts triggered when \`work_mem\` is exceeded.`,
            keyTakeaways: [
              "Always inspect actual vs estimated row counts in EXPLAIN ANALYZE output.",
              "Check Buffers shared hit vs read to diagnose cache pressure.",
              "Eliminate N+1 query loops before micro-tuning individual joins.",
            ],
          },
          {
            title: "Zero-Downtime Schema Migrations",
            durationMins: 14,
            contentMd: `## Expand-and-Contract Deployments

Breaking schema changes lock tables or crash running application containers during rolling deploys.

## Safe Migration Sequence
1. **Expand:** Add nullable columns or new tables first with \`CREATE TABLE IF NOT EXISTS\` / additive DDL.
2. **Backfill:** Populate new columns in bounded batches.
3. **Switch & Contract:** Deploy code reading the new column before dropping legacy columns later.`,
            keyTakeaways: [
              "Use additive expand-and-contract migrations to avoid breaking live traffic.",
              "Use native PostgreSQL gen_random_uuid() so schemas work portably without extra extensions.",
              "Test migrations against clean PostgreSQL instances in CI.",
            ],
          },
        ],
      },
    ],
    assessments: [
      {
        title: "PostgreSQL Schema & Indexing Foundations",
        difficulty: "foundation",
        questions: [
          {
            id: "pg-f-1",
            prompt: "Which SQL pattern safely handles concurrent lesson completion toggles without duplicate rows?",
            options: [
              "Two separate SELECT and INSERT queries with no constraint.",
              "A UNIQUE (user_id, lesson_id) constraint paired with INSERT ... ON CONFLICT DO UPDATE.",
              "Dropping and recreating the table on every toggle.",
              "Storing progress only in React component state.",
            ],
            correctIndex: 1,
            explanation: "A composite unique index with ON CONFLICT upsert guarantees atomic idempotency.",
            topicTag: "Concurrency",
          },
          {
            id: "pg-f-2",
            prompt: "In a composite B-Tree index for queries filtering by user_id and ordering by created_at DESC, which column order is ideal?",
            options: [
              "(created_at DESC, user_id)",
              "(user_id, created_at DESC)",
              "(id, created_at)",
              "No index can support ORDER BY.",
            ],
            correctIndex: 1,
            explanation: "Equality predicates come first in B-Tree indexes, followed by sort/range columns.",
            topicTag: "Indexing",
          },
          {
            id: "pg-f-3",
            prompt: "Why should native gen_random_uuid() be preferred over CREATE EXTENSION pgcrypto on PostgreSQL 13+?",
            options: [
              "It works natively out of the box across managed Postgres and PGlite without superuser extension privileges.",
              "It produces sequential integers.",
              "It disables UUID primary keys.",
              "It skips primary key uniqueness checks.",
            ],
            correctIndex: 0,
            explanation: "gen_random_uuid() is built into PostgreSQL core since v13 and avoids extension permission issues.",
            topicTag: "Migrations",
          },
          {
            id: "pg-f-4",
            prompt: "Why should you avoid holding a PostgreSQL transaction open while making external HTTP calls?",
            options: [
              "PostgreSQL blocks JSON responses.",
              "Long-held transactions retain locks and bloat connection pools under latency spikes.",
              "HTTP calls cannot run in Node.js.",
              "Transactions automatically expire after 1 millisecond.",
            ],
            correctIndex: 1,
            explanation: "External network waits inside transactions exhaust pool connections and hold row locks.",
            topicTag: "Concurrency",
          },
        ],
      },
      {
        title: "Query Plans & Migrations Intermediate Check",
        difficulty: "intermediate",
        questions: [
          {
            id: "pg-i-1",
            prompt: "What does a large gap between estimated rows and actual rows in EXPLAIN ANALYZE usually signal?",
            options: [
              "Stale planner statistics or correlated columns needing ANALYZE / extended stats.",
              "Corrupted disk storage.",
              "Missing TLS certificates.",
              "Too many React renders.",
            ],
            correctIndex: 0,
            explanation: "The query planner chooses suboptimal join strategies when statistics drift from real cardinality.",
            topicTag: "Query Tuning",
          },
          {
            id: "pg-i-2",
            prompt: "What is the first step of an expand-and-contract zero-downtime migration?",
            options: [
              "Drop the old column immediately before deploying app code.",
              "Add the new nullable column or table while existing application instances stay compatible.",
              "Lock all tables for 10 minutes.",
              "Truncate historical rows.",
            ],
            correctIndex: 1,
            explanation: "Additive changes keep both old and new app versions healthy during rolling releases.",
            topicTag: "Migrations",
          },
          {
            id: "pg-i-3",
            prompt: "When is a partial index like WHERE completed = true most effective?",
            options: [
              "When every row in the table is always true.",
              "When frequent queries target a selective subset of rows.",
              "When you never filter by completed.",
              "Only on tables with fewer than 5 rows.",
            ],
            correctIndex: 1,
            explanation: "Partial indexes stay compact and cache-friendly by indexing only matching rows.",
            topicTag: "Indexing",
          },
          {
            id: "pg-i-4",
            prompt: "Which PostgreSQL index type accelerates JSONB containment queries (@>)?",
            options: ["BRIN", "GIN", "Hash on text length", "Sequence"],
            correctIndex: 1,
            explanation: "GIN (Generalized Inverted Index) indexes composite values inside JSONB documents.",
            topicTag: "Indexing",
          },
        ],
      },
    ],
    resources: [
      {
        title: "PostgreSQL Indexing & Composite Key Cheatsheet",
        kind: "cheatsheet",
        summary: "Visual decision matrix for B-Tree, Partial, and GIN indexes in SaaS schemas.",
        urlOrRef: "orexa://cheatsheets/pg-indexing",
      },
      {
        title: "Zero-Downtime Expand & Contract Playbook",
        kind: "guide",
        summary: "Production checklist for rolling schema changes safely on Neon and Render Postgres.",
        urlOrRef: "orexa://guides/zero-downtime-migrations",
      },
      {
        title: "Exercise: Optimize a Dashboard Aggregation Query",
        kind: "exercise",
        summary: "Rewrite an N+1 dashboard loader into two indexed queries and compare EXPLAIN ANALYZE timings.",
        urlOrRef: "orexa://labs/dashboard-query-tuning",
      },
    ],
  },
  {
    slug: "agentic-workflow-design",
    title: "Agentic Workflows, Tool Contracts & Orchestration",
    category: "AI Systems",
    difficulty: "advanced",
    description:
      "Architect deterministic multi-step agent pipelines with validated tool contracts, human approval gates, execution traces, and strict latency budgets.",
    instructorName: "Dr. Kavita Patel",
    modules: [
      {
        title: "Module 1: Tool Design & State Machines",
        lessons: [
          {
            title: "Idempotent Tool Contracts & Schema Validation",
            durationMins: 19,
            contentMd: `## Designing Safe Tool Boundaries

Autonomous steps become predictable when every tool exposes a strict Zod input schema, deterministic error semantics, and idempotent write behavior.

## Contract Essentials
- Validate all tool arguments server-side before mutating state.
- Return structured machine-readable error hints so orchestration loops can recover cleanly.
- Separate read-only discovery tools from privileged state-mutating actions.`,
            keyTakeaways: [
              "Enforce strict schema validation at every tool boundary.",
              "Design write actions to be idempotent so retries never duplicate mutations.",
              "Isolate read-only queries from state-changing actions.",
            ],
          },
          {
            title: "State Checkpoints & Human-in-the-Loop Gates",
            durationMins: 17,
            contentMd: `## Keeping Humans in Command of High-Impact Actions

Multi-step learning and authoring assistants—such as Orexa's Instructor Outline Generator—should draft structured proposals that humans inspect, edit, and explicitly commit to PostgreSQL.

## Checkpoint Pattern
- Persist intermediate drafts or allow inline editing before committing database writes.
- Require explicit confirmation dialogs for destructive or workspace-wide actions like Demo Reset.`,
            keyTakeaways: [
              "Pair AI-assisted generation with inline human editing before saving.",
              "Gate irreversible or workspace-wide mutations behind explicit user confirmation.",
              "Store durable state checkpoints so long workflows can resume cleanly.",
            ],
          },
        ],
      },
      {
        title: "Module 2: Reliability & Observability",
        lessons: [
          {
            title: "Tracing Multi-Step Execution Graphs",
            durationMins: 16,
            contentMd: `## Making Agent Behavior Inspectable

Without step-level telemetry, debugging why an orchestration pipeline chose a particular path is guesswork.

## Telemetry Dimensions
- Log duration, input summary, execution mode, and outcome status per step.
- Correlate user requests across API routes and database writes with structured IDs.`,
            keyTakeaways: [
              "Record execution mode, latency, and outcome per workflow step.",
              "Expose transparent source citations to build learner and operator trust.",
              "Avoid logging secrets or raw credentials in trace payloads.",
            ],
          },
          {
            title: "Cost Caps & Latency Budgets",
            durationMins: 15,
            contentMd: `## Bounding Runtime Spend & Tail Latency

Every orchestration loop needs explicit ceilings: maximum steps, per-request rate limits, and hard timeout budgets.

## Guardrail Controls
- Apply sliding-window rate limiting on interactive generation endpoints.
- Enforce per-call timeouts and deterministic fallbacks to guarantee sub-second responses.`,
            keyTakeaways: [
              "Protect interactive AI endpoints with sliding-window rate limits.",
              "Set hard step and latency ceilings to prevent runaway loops.",
              "Prefer deterministic engines whenever structured rules solve the task cleanly.",
            ],
          },
        ],
      },
    ],
    assessments: [
      {
        title: "Tool Contracts & Guardrails Intermediate Quiz",
        difficulty: "intermediate",
        questions: [
          {
            id: "ag-i-1",
            prompt: "Why should Instructor AI-assisted outline generators return an editable draft instead of silently publishing?",
            options: [
              "Human-in-the-loop review ensures curriculum accuracy before PostgreSQL persistence.",
              "PostgreSQL cannot insert Markdown text.",
              "Browsers disallow POST requests.",
              "Drafts cannot contain key takeaways.",
            ],
            correctIndex: 0,
            explanation: "Human review gates maintain high editorial quality while still accelerating authoring.",
            topicTag: "Human-in-the-Loop",
          },
          {
            id: "ag-i-2",
            prompt: "Why is idempotency important for state-mutating tool contracts?",
            options: [
              "It prevents duplicate side effects when network retries occur.",
              "It disables Zod validation.",
              "It removes all authentication checks.",
              "It guarantees 0ms latency.",
            ],
            correctIndex: 0,
            explanation: "Idempotent tools safely absorb retries without creating duplicate records.",
            topicTag: "Tool Contracts",
          },
          {
            id: "ag-i-3",
            prompt: "What protects interactive generation endpoints against burst abuse in a demo workspace?",
            options: [
              "Sliding-window rate limiting and CSRF origin validation.",
              "Removing HTTP security headers.",
              "Disabling server-side validation.",
              "Exposing database URLs to clients.",
            ],
            correctIndex: 0,
            explanation: "Rate limiting and CSRF checks protect shared workspaces from automated abuse.",
            topicTag: "Guardrails",
          },
          {
            id: "ag-i-4",
            prompt: "Which items should NEVER be stored in workflow execution traces?",
            options: [
              "Step duration in milliseconds",
              "Execution mode (deterministic vs llm)",
              "Raw API keys, passwords, or raw session cookies",
              "Cited lesson IDs",
            ],
            correctIndex: 2,
            explanation: "Traces must never capture credentials, secrets, or raw session tokens.",
            topicTag: "Observability",
          },
        ],
      },
      {
        title: "Orchestration Architecture Advanced Challenge",
        difficulty: "advanced",
        questions: [
          {
            id: "ag-a-1",
            prompt: "When designing a hybrid deterministic + optional LLM tutor, what is the cleanest boundary?",
            options: [
              "Always execute retrieval on the server, use LLM only when server env key is configured with timeout fallback to deterministic synthesis.",
              "Call the LLM directly from the browser using a public key.",
              "Skip retrieval and let the model guess the syllabus.",
              "Fail the entire route whenever no API key is set.",
            ],
            correctIndex: 0,
            explanation: "Server-side retrieval plus optional timed LLM hook with deterministic fallback maximizes reliability and security.",
            topicTag: "Hybrid Orchestration",
          },
          {
            id: "ag-a-2",
            prompt: "How should a workflow handle a malformed tool payload from an upstream caller?",
            options: [
              "Persist raw unvalidated JSON straight into SQL.",
              "Reject with HTTP 400 and a clear schema validation message via Zod.",
              "Silently return HTTP 200.",
              "Restart the server.",
            ],
            correctIndex: 1,
            explanation: "Strict schema validation prevents bad state from entering the database.",
            topicTag: "Tool Contracts",
          },
          {
            id: "ag-a-3",
            prompt: "Which safeguard best prevents accidental data loss on a shared workspace reset endpoint?",
            options: [
              "GET request with no auth.",
              "POST with auth check, CSRF origin validation, ALLOW_DEMO_RESET guard, rate limit, and global cooldown.",
              "Allowing unauthenticated DELETE calls.",
              "Client-side alert only.",
            ],
            correctIndex: 1,
            explanation: "Defense-in-depth server controls keep demo resets safe and predictable.",
            topicTag: "Guardrails",
          },
          {
            id: "ag-a-4",
            prompt: "Why separate read-only discovery tools from write tools in agentic systems?",
            options: [
              "It enables least-privilege policies and clear audit boundaries.",
              "Read tools cannot query PostgreSQL.",
              "Write tools do not accept JSON.",
              "It eliminates the need for tests.",
            ],
            correctIndex: 0,
            explanation: "Separating read and write capabilities enforces least-privilege execution.",
            topicTag: "Tool Contracts",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Agentic Tool Contract & Guardrail Spec",
        kind: "guide",
        summary: "Template for defining Zod input contracts, idempotency keys, and human review checkpoints.",
        urlOrRef: "orexa://guides/tool-contract-spec",
      },
      {
        title: "Latency & Rate-Limit Budget Worksheet",
        kind: "exercise",
        summary: "Interactive sizing worksheet for bounding tail latency and request quotas in AI apps.",
        urlOrRef: "orexa://labs/latency-budgets",
      },
    ],
  },
  {
    slug: "product-experimentation",
    title: "Product Metrics & Adaptive Experimentation",
    category: "Product Analytics",
    difficulty: "foundation",
    description:
      "Turn raw learner telemetry into actionable retention funnels, readiness scores, and high-confidence product decisions.",
    instructorName: "Elena Rossi",
    modules: [
      {
        title: "Module 1: Telemetry & North-Star Funnels",
        lessons: [
          {
            title: "Event Taxonomy & Cohort Retention",
            durationMins: 12,
            contentMd: `## Measuring Real Learning Outcomes

Page views alone rarely indicate skill acquisition. Strong learning analytics track concrete mastery events: lesson completion, quiz attempts, tier upgrades, and tutor engagement.

## Event Naming Discipline
- Use consistent \`object_action\` names such as \`lesson_completed\` or \`assessment_submitted\`.
- Group learners by cohort and course so instructors spot friction points early.`,
            keyTakeaways: [
              "Track mastery milestones rather than vanity page views.",
              "Use consistent event taxonomies tied to real persisted records.",
              "Segment completion rates by course and difficulty tier to spot drop-offs.",
            ],
          },
          {
            title: "Designing Guardrail Metrics",
            durationMins: 14,
            contentMd: `## Balancing Velocity with Quality

Optimizing for rapid lesson clicks without checking quiz scores can reward skimming over comprehension. Guardrail metrics protect true learning quality.

## Paired Metrics in Orexa
- **Primary velocity:** Overall course completion % and lessons completed.
- **Quality guardrail:** Average assessment score % and advanced-tier unlock rate.`,
            keyTakeaways: [
              "Pair completion velocity metrics with mastery quality guardrails.",
              "Investigate courses with high completion but low assessment scores.",
              "Surface adaptive readiness clearly so learners know their exact next step.",
            ],
          },
        ],
      },
    ],
    assessments: [
      {
        title: "Learning Analytics Foundations Quiz",
        difficulty: "foundation",
        questions: [
          {
            id: "pa-f-1",
            prompt: "Why should course completion % be paired with average assessment scores?",
            options: [
              "To verify that fast lesson clicks translate into genuine comprehension.",
              "Because SQL cannot compute percentages alone.",
              "To hide low scores from instructors.",
              "Because assessments replace all lessons.",
            ],
            correctIndex: 0,
            explanation: "Assessment scores act as a mastery guardrail alongside completion velocity.",
            topicTag: "Guardrail Metrics",
          },
          {
            id: "pa-f-2",
            prompt: "Under Orexa's adaptive readiness rules, what does a score of 88% trigger?",
            options: [
              "Foundation module review.",
              "Intermediate practice only.",
              "Unlocking the Advanced Challenge tier.",
              "Resetting lesson progress.",
            ],
            correctIndex: 2,
            explanation: "Scores of 85% or higher verify mastery and unlock the Advanced Challenge tier.",
            topicTag: "Adaptive Readiness",
          },
          {
            id: "pa-f-3",
            prompt: "What does a score of 50% trigger in Orexa's adaptive engine?",
            options: [
              "Review Foundation Module recommendation.",
              "Unlock Advanced Challenge.",
              "Delete course enrollment.",
              "Disable the AI Tutor.",
            ],
            correctIndex: 0,
            explanation: "Scores below 60% route learners back to review foundation modules and takeaways.",
            topicTag: "Adaptive Readiness",
          },
          {
            id: "pa-f-4",
            prompt: "Which metric best surfaces curriculum friction for an instructor?",
            options: [
              "Course completion % paired with per-course average quiz score.",
              "Browser window height.",
              "Font family name.",
              "Server hostname.",
            ],
            correctIndex: 0,
            explanation: "Comparing completion rates against quiz averages pinpoints confusing modules.",
            topicTag: "Cohort Analytics",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Learning Telemetry Taxonomy Template",
        kind: "cheatsheet",
        summary: "Standardized event definitions for lesson completions, quiz attempts, and tutor queries.",
        urlOrRef: "orexa://cheatsheets/telemetry-taxonomy",
      },
      {
        title: "Cohort Diagnostics Video Notes",
        kind: "video_notes",
        summary: "Key takeaways on identifying high-drop-off modules using completion + score quadrants.",
        urlOrRef: "orexa://notes/cohort-diagnostics",
      },
    ],
  },
];

export async function seedDemoData(
  db: AppDatabase,
  options: { usersOnly?: boolean; skipUsers?: boolean } = {},
): Promise<void> {
  // 1. Seed users (demo learner + locked cohort/instructor/admin fixtures)
  let demoUserId = "";
  let studentElenaId = "";
  let studentDevonId = "";

  if (!options.skipUsers) {
    const existingDemo = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_ACCOUNT.email))
      .limit(1);

    if (existingDemo.length === 0) {
      const [inserted] = await db
        .insert(users)
        .values({
          email: DEMO_ACCOUNT.email,
          name: DEMO_ACCOUNT.name,
          role: DEMO_ACCOUNT.role,
          passwordHash: hashPassword(DEMO_ACCOUNT.password),
          avatarColor: "#ff6b4a",
        })
        .returning();
      demoUserId = inserted.id;
    } else {
      demoUserId = existingDemo[0].id;
    }

    const fixtureUsers = [
      {
        email: "dr.k.patel@orexa.studio",
        name: "Dr. Kavita Patel",
        role: "instructor" as const,
        avatarColor: "#f97316",
      },
      {
        email: "omar.hassan@orexa.studio",
        name: "Omar Hassan",
        role: "admin" as const,
        avatarColor: "#8b5cf6",
      },
      {
        email: "elena.rossi@orexa.studio",
        name: "Elena Rossi",
        role: "student" as const,
        avatarColor: "#10b981",
      },
      {
        email: "devon.brooks@orexa.studio",
        name: "Devon Brooks",
        role: "student" as const,
        avatarColor: "#38bdf8",
      },
    ];

    for (const fixture of fixtureUsers) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, fixture.email))
        .limit(1);

      let uid = existing[0]?.id;
      if (!uid) {
        const [created] = await db
          .insert(users)
          .values({
            email: fixture.email,
            name: fixture.name,
            role: fixture.role,
            passwordHash: hashPassword(generateLockedPassword()),
            avatarColor: fixture.avatarColor,
          })
          .returning();
        uid = created.id;
      }

      if (fixture.email === "elena.rossi@orexa.studio") studentElenaId = uid;
      if (fixture.email === "devon.brooks@orexa.studio") studentDevonId = uid;
    }
  } else {
    const allUsers = await db.select({ id: users.id, email: users.email }).from(users);
    demoUserId = allUsers.find((u) => u.email === DEMO_ACCOUNT.email)?.id ?? "";
    studentElenaId = allUsers.find((u) => u.email === "elena.rossi@orexa.studio")?.id ?? "";
    studentDevonId = allUsers.find((u) => u.email === "devon.brooks@orexa.studio")?.id ?? "";
  }

  if (options.usersOnly) return;

  // 2. Seed courses, modules, lessons, assessments, resources
  const courseLessonIds = new Map<string, string[]>();
  const courseAssessments = new Map<
    string,
    Array<{ id: string; difficulty: DifficultyTier; questions: QuizQuestion[]; courseTitle: string }>
  >();
  let llmCourseId = "";

  for (const c of SEED_COURSES) {
    const [createdCourse] = await db
      .insert(courses)
      .values({
        slug: c.slug,
        title: c.title,
        category: c.category,
        difficulty: c.difficulty,
        description: c.description,
        instructorName: c.instructorName,
        published: true,
      })
      .returning();

    if (c.slug === "applied-llm-engineering") {
      llmCourseId = createdCourse.id;
    }

    const lessonIds: string[] = [];

    for (let mIdx = 0; mIdx < c.modules.length; mIdx += 1) {
      const m = c.modules[mIdx];
      const [createdModule] = await db
        .insert(modules)
        .values({
          courseId: createdCourse.id,
          title: m.title,
          sortOrder: mIdx + 1,
        })
        .returning();

      for (let lIdx = 0; lIdx < m.lessons.length; lIdx += 1) {
        const l = m.lessons[lIdx];
        const [createdLesson] = await db
          .insert(lessons)
          .values({
            moduleId: createdModule.id,
            title: l.title,
            durationMins: l.durationMins,
            contentMd: l.contentMd,
            keyTakeaways: l.keyTakeaways,
            sortOrder: lIdx + 1,
          })
          .returning();
        lessonIds.push(createdLesson.id);
      }
    }
    courseLessonIds.set(c.slug, lessonIds);

    const insertedAssessments: Array<{
      id: string;
      difficulty: DifficultyTier;
      questions: QuizQuestion[];
      courseTitle: string;
    }> = [];
    for (const a of c.assessments) {
      const [createdAssessment] = await db
        .insert(assessments)
        .values({
          courseId: createdCourse.id,
          title: a.title,
          difficulty: a.difficulty,
          questionsJson: a.questions,
        })
        .returning();
      insertedAssessments.push({
        id: createdAssessment.id,
        difficulty: a.difficulty,
        questions: a.questions,
        courseTitle: c.title,
      });
    }
    courseAssessments.set(c.slug, insertedAssessments);

    for (const r of c.resources) {
      await db.insert(resources).values({
        courseId: createdCourse.id,
        title: r.title,
        kind: r.kind,
        summary: r.summary,
        urlOrRef: r.urlOrRef,
      });
    }
  }

  // 3. Seed realistic lesson_progress for demo learner + cohort students
  const llmLessons = courseLessonIds.get("applied-llm-engineering") ?? [];
  const pgLessons = courseLessonIds.get("postgres-data-modeling") ?? [];
  const agentLessons = courseLessonIds.get("agentic-workflow-design") ?? [];
  const metricsLessons = courseLessonIds.get("product-experimentation") ?? [];

  const now = Date.now();
  const markCompleted = async (userId: string, ids: string[], hoursAgoBase: number) => {
    if (!userId) return;
    for (let i = 0; i < ids.length; i += 1) {
      await db.insert(lessonProgress).values({
        userId,
        lessonId: ids[i],
        completed: true,
        completedAt: new Date(now - (hoursAgoBase - i * 3) * 3_600_000),
      });
    }
  };

  // Demo learner has completed 2/5 LLM lessons, 3/5 Postgres lessons, 1/2 Metrics lessons (6/16 = 38%)
  await markCompleted(demoUserId, [...llmLessons.slice(0, 2), ...pgLessons.slice(0, 3), ...metricsLessons.slice(0, 1)], 36);

  // Cohort students for realistic Admin Learning Analytics
  await markCompleted(studentElenaId, [...llmLessons.slice(0, 4), ...pgLessons.slice(0, 5), ...agentLessons.slice(0, 2)], 48);
  await markCompleted(studentDevonId, [...pgLessons.slice(0, 2), ...metricsLessons.slice(0, 2)], 24);

  // 4. Seed realistic assessment_attempts
  const logSeededAttempt = async (
    userId: string,
    assessmentInfo: { id: string; difficulty: DifficultyTier; questions: QuizQuestion[]; courseTitle: string } | undefined,
    wrongCount: number,
    hoursAgo: number,
  ) => {
    if (!userId || !assessmentInfo) return;
    const answers = assessmentInfo.questions.map((q, idx) => ({
      questionId: q.id,
      selectedIndex: idx < wrongCount ? (q.correctIndex + 1) % q.options.length : q.correctIndex,
    }));
    const graded = gradeAssessment(assessmentInfo.questions, answers, assessmentInfo.courseTitle);
    await db.insert(assessmentAttempts).values({
      userId,
      assessmentId: assessmentInfo.id,
      scorePct: graded.scorePct,
      difficultyLevel: assessmentInfo.difficulty,
      answersJson: graded.gradedAnswers,
      recommendation: graded.recommendation,
      createdAt: new Date(now - hoursAgo * 3_600_000),
    });
  };

  const llmAssess = courseAssessments.get("applied-llm-engineering") ?? [];
  const pgAssess = courseAssessments.get("postgres-data-modeling") ?? [];
  const agentAssess = courseAssessments.get("agentic-workflow-design") ?? [];
  const metricsAssess = courseAssessments.get("product-experimentation") ?? [];

  // Demo user: 75% on LLM Foundation (Intermediate Practice), 100% on Postgres Foundation (Unlock Advanced), 50% on Metrics (Review Foundation)
  await logSeededAttempt(demoUserId, llmAssess[0], 1, 18);
  await logSeededAttempt(demoUserId, pgAssess[0], 0, 10);
  await logSeededAttempt(demoUserId, metricsAssess[0], 2, 5);

  // Cohort attempts for Admin analytics
  await logSeededAttempt(studentElenaId, llmAssess[1], 0, 28);
  await logSeededAttempt(studentElenaId, agentAssess[0], 1, 14);
  await logSeededAttempt(studentDevonId, pgAssess[0], 1, 20);

  // 5. Seed initial curriculum-grounded AI Tutor thread for demo user on Course 1
  if (demoUserId && llmCourseId) {
    await db.insert(tutorMessages).values([
      {
        userId: demoUserId,
        courseId: llmCourseId,
        role: "student",
        content: "Why does hybrid search use Reciprocal Rank Fusion instead of averaging raw scores?",
        mode: "deterministic",
        createdAt: new Date(now - 2 * 3_600_000),
      },
      {
        userId: demoUserId,
        courseId: llmCourseId,
        role: "tutor",
        content: [
          "### Curriculum-Grounded Explanation (Applied LLM Systems & Grounded Retrieval)",
          "Based on **Module 1: Retrieval & Context Architecture → Hybrid Search & Reranking Signals**, here is how Orexa connects your question to the active syllabus:",
          "Dense embeddings excel at paraphrased conceptual questions, but often miss exact API identifiers, error codes, or domain acronyms. Reciprocal Rank Fusion (RRF) merges rank positions from lexical and semantic searches so strong candidates in both lists rise cleanly without fragile cross-scorer normalization.",
          "#### Core Takeaways from This Lesson",
          "- Pair lexical keyword search with semantic retrieval to capture both exact terms and intent.",
          "- Use Reciprocal Rank Fusion (RRF) to merge heterogeneous rankings cleanly.",
          "- Boost title and key-takeaway matches when grounding educational tutor replies.",
          "_Grounded in PostgreSQL syllabus sources: Module 1: Retrieval & Context Architecture: Hybrid Search & Reranking Signals_",
        ].join("\n\n"),
        mode: "deterministic",
        createdAt: new Date(now - 2 * 3_600_000 + 2000),
      },
    ]);
  }
}
