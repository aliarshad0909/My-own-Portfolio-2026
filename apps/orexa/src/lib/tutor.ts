import type { DifficultyTier, ResourceKind, TutorMode } from "@/db/schema";

export type GroundedLesson = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  durationMins: number;
  contentMd: string;
  keyTakeaways: string[];
};

export type GroundedResource = {
  id: string;
  title: string;
  kind: ResourceKind;
  summary: string;
  urlOrRef: string;
};

export type GroundedCourseContext = {
  courseId: string;
  courseTitle: string;
  category: string;
  difficulty: DifficultyTier;
  description: string;
  lessons: GroundedLesson[];
  resources: GroundedResource[];
};

export type TutorReply = {
  content: string;
  mode: TutorMode;
  citedLessons: Array<{ id: string; title: string; moduleTitle: string }>;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "into", "about", "what", "how",
  "why", "when", "where", "which", "does", "can", "could", "should", "would", "explain",
  "tell", "help", "understand", "give", "show", "make", "more", "some", "have", "been",
  "are", "was", "were", "your", "their", "they", "them", "there", "will", "just", "like",
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function stripMarkdownNoise(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBestExcerpt(md: string, queryTokens: string[]): string {
  const paragraphs = md
    .split(/\n{2,}/)
    .map((p) => stripMarkdownNoise(p))
    .filter((p) => p.length > 35);

  if (paragraphs.length === 0) return stripMarkdownNoise(md).slice(0, 260);

  let best = paragraphs[0];
  let bestScore = -1;
  for (const para of paragraphs) {
    const lower = para.toLowerCase();
    let score = 0;
    for (const token of queryTokens) {
      if (lower.includes(token)) score += 3;
    }
    if (score > bestScore) {
      bestScore = score;
      best = para;
    }
  }
  return best.length > 340 ? `${best.slice(0, 337)}...` : best;
}

/**
 * Deterministic Curriculum-Grounded Tutor Synthesizer.
 * Ranks actual PostgreSQL lessons, key takeaways, and study resources for the selected course
 * and produces a structured, citation-backed explanation with zero external API keys required.
 */
export function buildDeterministicTutorReply(
  context: GroundedCourseContext,
  question: string,
  focusedLessonId?: string | null,
): TutorReply {
  const queryTokens = tokenize(question);
  const lowerQ = question.toLowerCase();

  const scoredLessons = context.lessons.map((lesson) => {
    const haystack = `${lesson.moduleTitle} ${lesson.title} ${lesson.keyTakeaways.join(" ")} ${lesson.contentMd}`.toLowerCase();
    let score = 0;
    if (focusedLessonId && lesson.id === focusedLessonId) {
      score += 12;
    }
    for (const token of queryTokens) {
      if (lesson.title.toLowerCase().includes(token)) score += 6;
      if (lesson.moduleTitle.toLowerCase().includes(token)) score += 3;
      if (lesson.keyTakeaways.some((k) => k.toLowerCase().includes(token))) score += 4;
      if (haystack.includes(token)) score += 2;
    }
    return { lesson, score };
  });

  scoredLessons.sort((a, b) => b.score - a.score);
  const topLessons = scoredLessons.slice(0, 2).map((item) => item.lesson);

  const scoredResources = context.resources
    .map((res) => {
      const hay = `${res.title} ${res.summary} ${res.kind}`.toLowerCase();
      const score = queryTokens.reduce((acc, t) => acc + (hay.includes(t) ? 3 : 0), 0);
      return { res, score };
    })
    .sort((a, b) => b.score - a.score);

  const topResource = scoredResources[0]?.res ?? null;

  const isQuizRequest =
    lowerQ.includes("quiz") || lowerQ.includes("practice") || lowerQ.includes("test me") || lowerQ.includes("check");
  const isSummaryRequest =
    lowerQ.includes("summary") || lowerQ.includes("summarize") || lowerQ.includes("overview") || lowerQ.includes("takeaway");

  const primary = topLessons[0];
  const secondary = topLessons[1];

  const lines: string[] = [];
  if (!primary) {
    lines.push(`### Curriculum Guidance — ${context.courseTitle}`);
    lines.push(
      `This course currently has no published lessons in PostgreSQL yet. Use **Instructor Studio** to author or generate a lesson outline for "${context.courseTitle}".`,
    );
    return { content: lines.join("\n\n"), mode: "deterministic", citedLessons: [] };
  }

  lines.push(`### Curriculum-Grounded Explanation (${context.courseTitle})`);
  lines.push(
    `Based on **${primary.moduleTitle} → ${primary.title}**, here is how Orexa connects your question to the active syllabus:`,
  );
  lines.push(extractBestExcerpt(primary.contentMd, queryTokens));

  if (primary.keyTakeaways.length > 0) {
    lines.push("#### Core Takeaways from This Lesson");
    for (const item of primary.keyTakeaways.slice(0, isSummaryRequest ? 5 : 3)) {
      lines.push(`- ${item}`);
    }
  }

  if (secondary && secondary.id !== primary.id) {
    lines.push(`#### Related Context: ${secondary.title}`);
    lines.push(extractBestExcerpt(secondary.contentMd, queryTokens));
  }

  if (isQuizRequest) {
    lines.push("#### Quick Self-Check Prompt");
    lines.push(
      `1. In your own words, explain why **${primary.keyTakeaways[0] || primary.title}** matters in production.\n2. Head to **Adaptive Assessments** and run the ${context.difficulty} quiz for **${context.courseTitle}** to log an adaptive score.`,
    );
  } else {
    lines.push("#### Recommended Next Action");
    const resourceNote = topResource
      ? ` Pair this with the **${topResource.title}** (${topResource.kind.replace("_", " ")}) resource.`
      : "";
    lines.push(
      `Mark **${primary.title}** complete in Courses once you can apply its key takeaways, then test readiness in Adaptive Assessments.${resourceNote}`,
    );
  }

  lines.push(
    `_Grounded in PostgreSQL syllabus sources: ${topLessons.map((l) => `${l.moduleTitle}: ${l.title}`).join(" · ")}_`,
  );

  return {
    content: lines.join("\n\n"),
    mode: "deterministic",
    citedLessons: topLessons.map((l) => ({
      id: l.id,
      title: l.title,
      moduleTitle: l.moduleTitle,
    })),
  };
}

/**
 * Optional server-side LLM hook (strictly server-only; never exposes secrets to browser).
 * Automatically runs deterministic curriculum-grounded mode when no API key is configured
 * or if the upstream endpoint is unreachable.
 */
export async function generateTutorReply(
  context: GroundedCourseContext,
  question: string,
  focusedLessonId?: string | null,
): Promise<TutorReply> {
  const deterministic = buildDeterministicTutorReply(context, question, focusedLessonId);
  const apiKey = (process.env.OREXA_LLM_API_KEY || "").trim();
  const baseUrl = (process.env.OREXA_LLM_BASE_URL || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  const model = (process.env.OREXA_LLM_MODEL || "gpt-4o-mini").trim();

  if (!apiKey) {
    return deterministic;
  }

  try {
    const citedContext = context.lessons
      .filter((l) => deterministic.citedLessons.some((c) => c.id === l.id))
      .map(
        (l) =>
          `Lesson: ${l.title} (${l.moduleTitle})\nTakeaways: ${l.keyTakeaways.join("; ")}\nContent: ${l.contentMd.slice(0, 1400)}`,
      )
      .join("\n\n---\n\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content:
              "You are the Orexa AI Learning OS Tutor. Answer concisely using ONLY the provided course syllabus excerpts. Cite the lesson title and end with one concrete next step.",
          },
          {
            role: "user",
            content: `Course: ${context.courseTitle}\n\nSyllabus Context:\n${citedContext}\n\nStudent Question: ${question}`,
          },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return deterministic;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const llmText = data.choices?.[0]?.message?.content?.trim();
    if (!llmText) return deterministic;

    return {
      content: llmText,
      mode: "llm",
      citedLessons: deterministic.citedLessons,
    };
  } catch {
    return deterministic;
  }
}

export type GeneratedLessonOutline = {
  title: string;
  durationMins: number;
  contentMd: string;
  keyTakeaways: string[];
  mode: "deterministic";
};

/**
 * Deterministic AI-Assisted Lesson Outline Generator for Instructor Studio.
 * Produces a clean, editable curriculum draft grounded in the course metadata and topic.
 */
export function generateDeterministicLessonOutline(params: {
  courseTitle: string;
  courseCategory: string;
  topic: string;
  difficulty: DifficultyTier;
  durationMins: number;
  learningGoal?: string;
}): GeneratedLessonOutline {
  const cleanTopic = params.topic.trim();
  const tierLabel =
    params.difficulty === "foundation"
      ? "Foundational Concepts & Mental Models"
      : params.difficulty === "intermediate"
        ? "Applied Architecture & Workflows"
        : "Production Scaling & Optimization";

  const goalText = params.learningGoal?.trim()
    ? params.learningGoal.trim()
    : `Apply ${cleanTopic} reliably inside real ${params.courseCategory} projects.`;

  const title = `${cleanTopic}: ${tierLabel}`;

  const contentMd = [
    `## Learning Objective`,
    `${goalText} This ${params.durationMins}-minute ${params.difficulty}-tier lesson in **${params.courseTitle}** bridges theory with repeatable execution patterns.`,
    ``,
    `## 1. Why ${cleanTopic} Matters`,
    `In modern ${params.courseCategory.toLowerCase()} workflows, weak handling of **${cleanTopic}** leads to brittle outputs, hidden latency, or regression bugs. Establishing explicit invariants early makes downstream evaluation and debugging straightforward.`,
    ``,
    `## 2. Core Design Pattern`,
    `- **Define clear contracts:** Specify inputs, expected schema constraints, and failure states before implementing ${cleanTopic}.`,
    `- **Measure before tuning:** Capture baseline metrics (accuracy, latency, or completion rate) so every iteration is evidence-driven.`,
    `- **Keep feedback loops tight:** Pair deterministic unit checks with realistic scenario tests.`,
    ``,
    `## 3. Worked Walkthrough`,
    `1. Start from a minimal reproducible case focused exclusively on ${cleanTopic}.`,
    `2. Instrument edge-case checks to surface silent failure modes early.`,
    `3. Refactor into reusable modules with clear ownership boundaries.`,
    ``,
    `## 4. Common Pitfalls & Guardrails`,
    `- Skipping validation on edge inputs or trusting unverified assumptions.`,
    `- Over-optimizing prematurely before validating baseline correctness.`,
    ``,
    `## 5. Applied Practice Check`,
    `Draft a short architecture note explaining how you would introduce **${cleanTopic}** into an existing ${params.courseCategory} stack, including one verification check and one rollback safeguard.`,
  ].join("\n");

  const keyTakeaways = [
    `Articulate the core role of ${cleanTopic} within ${params.courseTitle}.`,
    `Apply structured contracts and measurable baselines when implementing ${cleanTopic}.`,
    `Identify and prevent the top two production pitfalls related to ${cleanTopic}.`,
    `Verify ${cleanTopic} behavior with repeatable test criteria before shipping.`,
  ];

  return {
    title,
    durationMins: params.durationMins,
    contentMd,
    keyTakeaways,
    mode: "deterministic",
  };
}
