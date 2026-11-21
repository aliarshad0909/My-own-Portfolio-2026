import { z } from "zod";
import {
  MILESTONE_STATUSES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STAGES,
} from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const createProjectSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Project code is required (e.g. PRJ-105).")
    .max(24)
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, "Project name is required.").max(120),
  clientName: z.string().trim().min(2, "Client name is required.").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  status: z.enum(PROJECT_STATUSES).optional().default("active"),
  budgetHours: z.coerce.number().int().min(1).max(20000).default(120),
  startDate: z.string().trim().min(4, "Start date is required."),
  targetDate: z.string().trim().min(4, "Target date is required."),
  clientPortalEnabled: z.boolean().optional().default(true),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  clientName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  budgetHours: z.coerce.number().int().min(1).max(20000).optional(),
  startDate: z.string().trim().min(4).optional(),
  targetDate: z.string().trim().min(4).optional(),
  clientPortalEnabled: z.boolean().optional(),
});

export const createMilestoneSchema = z.object({
  projectId: z.string().uuid("Select a valid project."),
  title: z.string().trim().min(2, "Milestone title is required.").max(140),
  dueDate: z.string().trim().min(4, "Milestone due date is required."),
  status: z.enum(MILESTONE_STATUSES).optional().default("upcoming"),
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(2).max(140).optional(),
  dueDate: z.string().trim().min(4).optional(),
  status: z.enum(MILESTONE_STATUSES).optional(),
});

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Select a valid project."),
  milestoneId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(2, "Task title is required.").max(180),
  description: z.string().trim().max(2000).optional().default(""),
  stage: z.enum(TASK_STAGES).optional().default("todo"),
  priority: z.enum(TASK_PRIORITIES).optional().default("medium"),
  assigneeName: z.string().trim().min(1).max(80).optional().default("Unassigned"),
  dependsOnTaskId: z.string().uuid().nullable().optional(),
  estimatedHours: z.coerce.number().min(0.25).max(1000).optional().default(4),
  dueDate: z.string().trim().max(32).optional().default(""),
  attachmentName: z.string().trim().max(160).optional().default(""),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  description: z.string().trim().max(2000).optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  stage: z.enum(TASK_STAGES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assigneeName: z.string().trim().min(1).max(80).optional(),
  dependsOnTaskId: z.string().uuid().nullable().optional(),
  estimatedHours: z.coerce.number().min(0.25).max(1000).optional(),
  dueDate: z.string().trim().max(32).optional(),
  attachmentName: z.string().trim().max(160).optional(),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty.").max(1500),
  authorName: z.string().trim().min(1).max(80).optional(),
});

export const createTimeEntrySchema = z.object({
  projectId: z.string().uuid("Select a valid project."),
  taskId: z.string().uuid().nullable().optional(),
  memberName: z.string().trim().min(1, "Select a team member.").max(80),
  hours: z.coerce.number().min(0.25, "Minimum 0.25h").max(24, "Maximum 24h per entry"),
  billable: z.boolean().optional().default(true),
  note: z.string().trim().max(500).optional().default(""),
  loggedDate: z.string().trim().min(4, "Logged date is required."),
});

export const createTeamMemberSchema = z.object({
  name: z.string().trim().min(2, "Member name is required.").max(80),
  roleTitle: z.string().trim().min(2, "Role title is required.").max(80),
  email: z.string().trim().email("Valid email is required."),
  capacityHours: z.coerce.number().int().min(8).max(80).optional().default(40),
  avatarColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#8b5cf6"),
});
