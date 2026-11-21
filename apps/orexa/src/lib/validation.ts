import { z } from "zod";

export const difficultyEnum = z.enum(["foundation", "intermediate", "advanced"]);
export const resourceKindEnum = z.enum(["guide", "cheatsheet", "exercise", "video_notes"]);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const lessonProgressSchema = z.object({
  completed: z.boolean(),
});

export const assessmentAttemptSchema = z.object({
  assessmentId: z.string().uuid("Valid assessment ID is required."),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedIndex: z.number().int().min(0).max(10),
      }),
    )
    .min(1, "Submit at least one answer."),
});

export const tutorAskSchema = z.object({
  courseId: z.string().uuid("Select a valid course."),
  lessonId: z.string().uuid().optional().nullable(),
  message: z
    .string()
    .trim()
    .min(2, "Ask a question with at least 2 characters.")
    .max(1200, "Keep questions under 1200 characters."),
});

export const courseCreateSchema = z.object({
  title: z.string().trim().min(3, "Course title must be at least 3 characters.").max(140),
  category: z.string().trim().min(2, "Category is required.").max(60),
  difficulty: difficultyEnum.default("foundation"),
  description: z.string().trim().min(12, "Description must be at least 12 characters.").max(900),
  instructorName: z.string().trim().min(2, "Instructor name is required.").max(100),
  published: z.boolean().optional().default(true),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const moduleCreateSchema = z.object({
  courseId: z.string().uuid("Select a valid course."),
  title: z.string().trim().min(3, "Module title must be at least 3 characters.").max(140),
  sortOrder: z.number().int().min(1).max(100).optional(),
});

export const moduleUpdateSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  sortOrder: z.number().int().min(1).max(100).optional(),
});

export const lessonCreateSchema = z.object({
  moduleId: z.string().uuid("Select a valid module."),
  title: z.string().trim().min(3, "Lesson title must be at least 3 characters.").max(160),
  durationMins: z.number().int().min(2).max(180).default(15),
  contentMd: z.string().trim().min(20, "Lesson content must be at least 20 characters.").max(16000),
  keyTakeaways: z.array(z.string().trim().min(2).max(240)).min(1).max(8).default([]),
  sortOrder: z.number().int().min(1).max(100).optional(),
});

export const lessonUpdateSchema = lessonCreateSchema.omit({ moduleId: true }).partial();

export const resourceCreateSchema = z.object({
  courseId: z.string().uuid("Select a valid course."),
  title: z.string().trim().min(3, "Resource title must be at least 3 characters.").max(140),
  kind: resourceKindEnum.default("guide"),
  summary: z.string().trim().min(8, "Summary must be at least 8 characters.").max(500),
  urlOrRef: z.string().trim().min(2, "Reference or URL is required.").max(300),
});

export const resourceUpdateSchema = resourceCreateSchema.omit({ courseId: true }).partial();

export const outlineGenerateSchema = z.object({
  courseId: z.string().uuid("Select a valid course."),
  topic: z.string().trim().min(3, "Enter a lesson topic (at least 3 characters).").max(160),
  difficulty: difficultyEnum.default("intermediate"),
  durationMins: z.number().int().min(5).max(90).default(18),
  learningGoal: z.string().trim().max(300).optional().default(""),
});

export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "course";
}
