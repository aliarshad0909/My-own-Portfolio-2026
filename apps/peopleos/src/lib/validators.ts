import { z } from "zod";

export const loginSchema = z.union([
  z.object({ demo: z.literal(true) }),
  z.object({
    email: z.string().email("Enter a valid work email."),
    password: z.string().min(1, "Password is required."),
  }),
]);

export const switchRoleSchema = z.object({
  role: z.enum(["demo", "admin", "manager", "employee"]),
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(10).transform((v) => v.toUpperCase()),
  headName: z.string().trim().min(2).max(80),
  headcountTarget: z.coerce.number().int().min(1).max(500),
});

export const createEmployeeSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(120),
  title: z.string().trim().min(2).max(100),
  departmentId: z.string().uuid(),
  managerId: z.string().uuid().nullable().optional(),
  employmentType: z.enum(["full_time", "part_time", "contractor"]).default("full_time"),
  status: z.enum(["active", "on_leave", "onboarding"]).default("active"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
  location: z.string().trim().min(2).max(100),
  leaveBalanceDays: z.coerce.number().int().min(0).max(60).default(18),
  compensationBandPrivate: z.string().trim().min(2).max(160).default("Band L4 · Fictional Demo Band"),
  emergencyContactPrivate: z.string().trim().min(2).max(160).default("Fictional Emergency Contact · +1 (555) 010-0000"),
  hrNotesPrivate: z.string().trim().max(500).default(""),
});

export const updateEmployeeSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().nullable().optional(),
  status: z.enum(["active", "on_leave", "onboarding"]).optional(),
  location: z.string().trim().min(2).max(100).optional(),
  leaveBalanceDays: z.coerce.number().int().min(0).max(60).optional(),
  compensationBandPrivate: z.string().trim().min(2).max(160).optional(),
  emergencyContactPrivate: z.string().trim().min(2).max(160).optional(),
  hrNotesPrivate: z.string().trim().max(500).optional(),
});

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "remote", "on_leave", "absent"]),
  checkInTime: z.string().trim().max(20).default("09:00"),
  notes: z.string().trim().max(240).default(""),
});

export const createLeaveRequestSchema = z.object({
  employeeId: z.string().uuid(),
  leaveType: z.enum(["annual", "sick", "parental", "unpaid"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysRequested: z.coerce.number().int().min(1).max(30),
  reason: z.string().trim().min(3).max(300),
});

export const reviewLeaveSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
});

export const CANDIDATE_STAGES = ["applied", "screening", "interview", "offer", "hired", "archived"] as const;

export const createCandidateSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  roleTitle: z.string().trim().min(2).max(100),
  departmentName: z.string().trim().min(2).max(80),
  stage: z.enum(CANDIDATE_STAGES).default("applied"),
  source: z.string().trim().min(2).max(80).default("Direct Application"),
  rating: z.coerce.number().int().min(1).max(5).default(4),
  notes: z.string().trim().max(400).default(""),
});

export const updateCandidateSchema = z.object({
  stage: z.enum(CANDIDATE_STAGES).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(400).optional(),
});

export const createOnboardingTaskSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().trim().min(3).max(160),
  ownerRole: z.string().trim().min(2).max(40).default("HR Ops"),
});

export const toggleOnboardingTaskSchema = z.object({
  completed: z.boolean(),
});

export const createReviewSchema = z.object({
  employeeId: z.string().uuid(),
  cycle: z.string().trim().min(2).max(60),
  reviewerName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  summary: z.string().trim().min(5).max(600),
  goals: z.string().trim().min(5).max(600),
});

export const createDocumentSchema = z.object({
  employeeId: z.string().uuid(),
  title: z.string().trim().min(3).max(140),
  docType: z.enum(["offer_letter", "policy_ack", "nda", "id_verified"]),
  status: z.enum(["verified", "pending", "expired"]).default("verified"),
  uploadedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateDocumentSchema = z.object({
  status: z.enum(["verified", "pending", "expired"]),
});
