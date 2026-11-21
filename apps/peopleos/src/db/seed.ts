import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import {
  activityLogs,
  attendanceLogs,
  candidates,
  departments,
  employeeDocuments,
  employees,
  leaveRequests,
  onboardingTasks,
  performanceReviews,
  users,
} from "@/db/schema";
import { DEMO_ACCOUNT, DEMO_PERSONAS, generateLockedPassword, hashPassword } from "@/lib/crypto";

type SeedOptions = {
  usersOnly?: boolean;
  skipUsers?: boolean;
};

function isoDateOffset(daysDelta: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysDelta);
  return d.toISOString().slice(0, 10);
}

/**
 * Seeds 100% fictional HR operational demonstration records for PeopleOS.
 */
export async function seedDemoData(db: AppDatabase, options: SeedOptions = {}): Promise<void> {
  if (!options.skipUsers) {
    const personaRows = [
      {
        email: DEMO_PERSONAS.demo.email,
        name: DEMO_PERSONAS.demo.name,
        role: DEMO_PERSONAS.demo.role,
        passwordHash: hashPassword(DEMO_ACCOUNT.password),
        avatarColor: DEMO_PERSONAS.demo.avatarColor,
      },
      {
        email: DEMO_PERSONAS.admin.email,
        name: DEMO_PERSONAS.admin.name,
        role: DEMO_PERSONAS.admin.role,
        passwordHash: hashPassword(generateLockedPassword()),
        avatarColor: DEMO_PERSONAS.admin.avatarColor,
      },
      {
        email: DEMO_PERSONAS.manager.email,
        name: DEMO_PERSONAS.manager.name,
        role: DEMO_PERSONAS.manager.role,
        passwordHash: hashPassword(generateLockedPassword()),
        avatarColor: DEMO_PERSONAS.manager.avatarColor,
      },
      {
        email: DEMO_PERSONAS.employee.email,
        name: DEMO_PERSONAS.employee.name,
        role: DEMO_PERSONAS.employee.role,
        passwordHash: hashPassword(generateLockedPassword()),
        avatarColor: DEMO_PERSONAS.employee.avatarColor,
      },
    ];

    for (const row of personaRows) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, row.email))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(users).values(row);
      }
    }
  }

  if (options.usersOnly) return;

  // 1. Departments
  const insertedDepartments = await db
    .insert(departments)
    .values([
      { name: "People & Operations", code: "PPL", headName: "Hannah Reyes", headcountTarget: 4 },
      { name: "Product Engineering", code: "ENG", headName: "Marcus Vance", headcountTarget: 8 },
      { name: "Design & Research", code: "DES", headName: "Sora Takahashi", headcountTarget: 4 },
      { name: "Revenue & Customer Success", code: "REV", headName: "David Okafor", headcountTarget: 5 },
      { name: "Finance & Legal Ops", code: "FIN", headName: "Elena Morales", headcountTarget: 3 },
    ])
    .returning();

  const deptByCode = new Map(insertedDepartments.map((d) => [d.code, d]));

  // 2. Leadership & Department Heads first (so manager_id FK can point cleanly to them)
  const [hannah] = await db
    .insert(employees)
    .values({
      employeeCode: "EMP-1001",
      fullName: "Hannah Reyes",
      email: "hr@peopleos.studio",
      title: "VP of People Operations",
      departmentId: deptByCode.get("PPL")!.id,
      managerId: null,
      employmentType: "full_time",
      status: "active",
      startDate: "2023-02-14",
      location: "Austin, TX (Hybrid)",
      leaveBalanceDays: 20,
      compensationBandPrivate: "Band L7 · $172,000 – $188,000 (Fictional Demo Band)",
      emergencyContactPrivate: "Mateo Reyes · +1 (512) 555-0148 (Spouse)",
      hrNotesPrivate: "Executive sponsor for Q2 PeopleOps audit and onboarding modernization.",
    })
    .returning();

  const [marcus, sora, david, elena] = await db
    .insert(employees)
    .values([
      {
        employeeCode: "EMP-1002",
        fullName: "Marcus Vance",
        email: "manager@peopleos.studio",
        title: "Director of Engineering",
        departmentId: deptByCode.get("ENG")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2023-05-01",
        location: "Seattle, WA (Remote)",
        leaveBalanceDays: 19,
        compensationBandPrivate: "Band L6 · $165,000 – $182,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Tessa Vance · +1 (206) 555-0192 (Partner)",
        hrNotesPrivate: "Leads platform reliability pod; nominated for leadership coaching cohort.",
      },
      {
        employeeCode: "EMP-1003",
        fullName: "Sora Takahashi",
        email: "sora.takahashi@peopleos.studio",
        title: "Head of Product Design",
        departmentId: deptByCode.get("DES")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2023-08-21",
        location: "San Francisco, CA (Hybrid)",
        leaveBalanceDays: 16,
        compensationBandPrivate: "Band L6 · $158,000 – $174,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Kenji Takahashi · +1 (415) 555-0164 (Brother)",
        hrNotesPrivate: "Strong cross-functional feedback during H1 design system launch.",
      },
      {
        employeeCode: "EMP-1004",
        fullName: "David Okafor",
        email: "david.okafor@peopleos.studio",
        title: "Head of Customer Success",
        departmentId: deptByCode.get("REV")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2024-01-08",
        location: "Chicago, IL (Hybrid)",
        leaveBalanceDays: 15,
        compensationBandPrivate: "Band L6 · $144,000 – $160,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Amara Okafor · +1 (312) 555-0133 (Spouse)",
        hrNotesPrivate: "Oversees enterprise onboarding playbooks and renewal health.",
      },
      {
        employeeCode: "EMP-1005",
        fullName: "Elena Morales",
        email: "elena.morales@peopleos.studio",
        title: "Finance Operations Lead",
        departmentId: deptByCode.get("FIN")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "on_leave",
        startDate: "2023-11-13",
        location: "Denver, CO (Remote)",
        leaveBalanceDays: 12,
        compensationBandPrivate: "Band L5 · $132,000 – $146,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Carlos Morales · +1 (303) 555-0177 (Father)",
        hrNotesPrivate: "Currently on approved annual leave through end of week.",
      },
    ])
    .returning();

  // 3. Individual Contributors (reporting to Department Heads for realistic Org Chart!)
  const [priya, liam, nadia, owen, amira, jonah, claire] = await db
    .insert(employees)
    .values([
      {
        employeeCode: "EMP-1006",
        fullName: "Priya Nair",
        email: "employee@peopleos.studio",
        title: "Senior Product Designer",
        departmentId: deptByCode.get("DES")!.id,
        managerId: sora.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2024-04-15",
        location: "New York, NY (Hybrid)",
        leaveBalanceDays: 17,
        compensationBandPrivate: "Band L5 · $136,000 – $149,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Rohan Nair · +1 (917) 555-0121 (Spouse)",
        hrNotesPrivate: "Core owner of PeopleOS accessibility standards; eligible for Q3 promotion review.",
      },
      {
        employeeCode: "EMP-1007",
        fullName: "Liam Gallagher-Chen",
        email: "liam.chen@peopleos.studio",
        title: "Staff Backend Engineer",
        departmentId: deptByCode.get("ENG")!.id,
        managerId: marcus.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2024-02-05",
        location: "Seattle, WA (Remote)",
        leaveBalanceDays: 14,
        compensationBandPrivate: "Band L5 · $154,000 – $168,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Mei Chen · +1 (206) 555-0185 (Mother)",
        hrNotesPrivate: "Primary PostgreSQL schema reviewer and on-call mentor.",
      },
      {
        employeeCode: "EMP-1008",
        fullName: "Nadia Al-Mansoor",
        email: "nadia.almansoor@peopleos.studio",
        title: "Full-Stack Engineer",
        departmentId: deptByCode.get("ENG")!.id,
        managerId: marcus.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2024-09-09",
        location: "Toronto, ON (Remote)",
        leaveBalanceDays: 18,
        compensationBandPrivate: "Band L4 · $126,000 – $138,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Tariq Al-Mansoor · +1 (416) 555-0156 (Spouse)",
        hrNotesPrivate: "Completed security champion training with distinction.",
      },
      {
        employeeCode: "EMP-1009",
        fullName: "Owen Brooks",
        email: "owen.brooks@peopleos.studio",
        title: "Frontend Systems Engineer",
        departmentId: deptByCode.get("ENG")!.id,
        managerId: marcus.id,
        employmentType: "full_time",
        status: "onboarding",
        startDate: isoDateOffset(-5),
        location: "Austin, TX (Hybrid)",
        leaveBalanceDays: 18,
        compensationBandPrivate: "Band L4 · $122,000 – $135,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Laura Brooks · +1 (512) 555-0199 (Sister)",
        hrNotesPrivate: "Week 1 onboarding in progress; equipment delivered and verified.",
      },
      {
        employeeCode: "EMP-1010",
        fullName: "Amira Haddad",
        email: "amira.haddad@peopleos.studio",
        title: "Enterprise Account Manager",
        departmentId: deptByCode.get("REV")!.id,
        managerId: david.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2024-06-03",
        location: "Boston, MA (Remote)",
        leaveBalanceDays: 16,
        compensationBandPrivate: "Band L4 · $114,000 – $128,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Samir Haddad · +1 (617) 555-0142 (Partner)",
        hrNotesPrivate: "Exceeded Q1 customer retention milestone by 6%.",
      },
      {
        employeeCode: "EMP-1011",
        fullName: "Jonah Lindqvist",
        email: "jonah.lindqvist@peopleos.studio",
        title: "People Operations Specialist",
        departmentId: deptByCode.get("PPL")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "onboarding",
        startDate: isoDateOffset(-3),
        location: "Austin, TX (Hybrid)",
        leaveBalanceDays: 18,
        compensationBandPrivate: "Band L3 · $88,000 – $98,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Astrid Lindqvist · +1 (512) 555-0118 (Mother)",
        hrNotesPrivate: "New hire joining People Ops to streamline compliance document audits.",
      },
      {
        employeeCode: "EMP-1012",
        fullName: "Claire Bennett",
        email: "admin@peopleos.studio",
        title: "Senior HR Business Partner",
        departmentId: deptByCode.get("PPL")!.id,
        managerId: hannah.id,
        employmentType: "full_time",
        status: "active",
        startDate: "2023-09-18",
        location: "Austin, TX (Hybrid)",
        leaveBalanceDays: 21,
        compensationBandPrivate: "Band L5 · $134,000 – $146,000 (Fictional Demo Band)",
        emergencyContactPrivate: "Graham Bennett · +1 (512) 555-0170 (Spouse)",
        hrNotesPrivate: "Primary HR administrator for RBAC policy audits and annual review cycles.",
      },
    ])
    .returning();

  // 4. Attendance Logs (today & yesterday)
  const today = isoDateOffset(0);
  const yesterday = isoDateOffset(-1);

  await db.insert(attendanceLogs).values([
    { employeeId: hannah.id, logDate: today, status: "present", checkInTime: "08:45", notes: "Austin HQ" },
    { employeeId: marcus.id, logDate: today, status: "remote", checkInTime: "08:55", notes: "Remote — Seattle" },
    { employeeId: sora.id, logDate: today, status: "present", checkInTime: "09:05", notes: "SF Studio" },
    { employeeId: david.id, logDate: today, status: "present", checkInTime: "08:50", notes: "Chicago Office" },
    { employeeId: elena.id, logDate: today, status: "on_leave", checkInTime: "—", notes: "Approved annual leave" },
    { employeeId: priya.id, logDate: today, status: "remote", checkInTime: "09:10", notes: "Design sprint review" },
    { employeeId: liam.id, logDate: today, status: "remote", checkInTime: "09:00", notes: "Database maintenance" },
    { employeeId: nadia.id, logDate: today, status: "remote", checkInTime: "08:58", notes: "API sprint" },
    { employeeId: owen.id, logDate: today, status: "present", checkInTime: "09:15", notes: "Onboarding orientation" },
    { employeeId: amira.id, logDate: today, status: "remote", checkInTime: "08:40", notes: "Client QBR prep" },
    { employeeId: jonah.id, logDate: today, status: "present", checkInTime: "09:02", notes: "HR Ops shadowing" },
    { employeeId: claire.id, logDate: today, status: "present", checkInTime: "08:48", notes: "Austin HQ" },
    { employeeId: priya.id, logDate: yesterday, status: "present", checkInTime: "09:04", notes: "NY Office" },
    { employeeId: liam.id, logDate: yesterday, status: "remote", checkInTime: "08:52", notes: "Remote — Seattle" },
    { employeeId: nadia.id, logDate: yesterday, status: "remote", checkInTime: "09:01", notes: "Remote — Toronto" },
    { employeeId: elena.id, logDate: yesterday, status: "on_leave", checkInTime: "—", notes: "Approved annual leave" },
  ]);

  // 5. Leave Requests (mix of pending for instant approval workflow + approved + rejected)
  await db.insert(leaveRequests).values([
    {
      employeeId: priya.id,
      leaveType: "annual",
      startDate: isoDateOffset(7),
      endDate: isoDateOffset(9),
      daysRequested: 3,
      reason: "Family long weekend trip to Vermont.",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      employeeId: liam.id,
      leaveType: "sick",
      startDate: isoDateOffset(4),
      endDate: isoDateOffset(5),
      daysRequested: 2,
      reason: "Scheduled dental procedure and recovery day.",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      employeeId: nadia.id,
      leaveType: "annual",
      startDate: isoDateOffset(14),
      endDate: isoDateOffset(17),
      daysRequested: 4,
      reason: "Spring break travel with family.",
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
    },
    {
      employeeId: elena.id,
      leaveType: "annual",
      startDate: isoDateOffset(-2),
      endDate: isoDateOffset(1),
      daysRequested: 4,
      reason: "Mountain cabin recharge week.",
      status: "approved",
      reviewedBy: "Hannah Reyes",
      reviewedAt: new Date(Date.now() - 86_400_000 * 5),
    },
    {
      employeeId: amira.id,
      leaveType: "unpaid",
      startDate: isoDateOffset(-14),
      endDate: isoDateOffset(-13),
      daysRequested: 2,
      reason: "Personal relocation overlap.",
      status: "rejected",
      reviewedBy: "David Okafor",
      reviewedAt: new Date(Date.now() - 86_400_000 * 16),
    },
  ]);

  // 6. Candidates (Recruitment pipeline across all stages)
  await db.insert(candidates).values([
    {
      fullName: "Devon Patel",
      roleTitle: "Senior Platform Engineer",
      departmentName: "Product Engineering",
      stage: "interview",
      source: "Employee Referral",
      rating: 5,
      notes: "Strong distributed systems background; panel interview scheduled Thursday.",
    },
    {
      fullName: "Camila Duarte",
      roleTitle: "Product Designer",
      departmentName: "Design & Research",
      stage: "offer",
      source: "Portfolio Outreach",
      rating: 5,
      notes: "Standout case study walkthrough; verbal offer alignment complete.",
    },
    {
      fullName: "Theo Lindholm",
      roleTitle: "Customer Success Manager",
      departmentName: "Revenue & Customer Success",
      stage: "screening",
      source: "LinkedIn",
      rating: 4,
      notes: "4 years B2B SaaS onboarding experience; recruiter screen passed.",
    },
    {
      fullName: "Maya Kowalski",
      roleTitle: "Security & Compliance Analyst",
      departmentName: "Finance & Legal Ops",
      stage: "applied",
      source: "Careers Page",
      rating: 4,
      notes: "SOC 2 Type II audit coordination experience.",
    },
    {
      fullName: "Isaac Mensah",
      roleTitle: "Full-Stack TypeScript Engineer",
      departmentName: "Product Engineering",
      stage: "screening",
      source: "GitHub Open Source",
      rating: 4,
      notes: "Active contributor to Next.js and Postgres tooling.",
    },
    {
      fullName: "Owen Brooks",
      roleTitle: "Frontend Systems Engineer",
      departmentName: "Product Engineering",
      stage: "hired",
      source: "Employee Referral",
      rating: 5,
      notes: "Offer signed; currently completing Week 1 onboarding checklist.",
    },
  ]);

  // 7. Onboarding Tasks (for the two onboarding employees: Owen & Jonah)
  await db.insert(onboardingTasks).values([
    { employeeId: owen.id, title: "Sign offer letter & confidentiality agreement", ownerRole: "HR Ops", completed: true },
    { employeeId: owen.id, title: "Provision laptop, SSO & GitHub workspace access", ownerRole: "IT Ops", completed: true },
    { employeeId: owen.id, title: "Complete engineering architecture walkthrough with Marcus", ownerRole: "Manager", completed: true },
    { employeeId: owen.id, title: "Review handbook & security awareness acknowledgment", ownerRole: "Employee", completed: false },
    { employeeId: owen.id, title: "Schedule 30-day goals alignment session", ownerRole: "Manager", completed: false },
    { employeeId: jonah.id, title: "Verify employment eligibility & ID check", ownerRole: "HR Ops", completed: true },
    { employeeId: jonah.id, title: "Configure HRIS permissions & RBAC policy briefing", ownerRole: "IT Ops", completed: true },
    { employeeId: jonah.id, title: "Shadow weekly people operations standup", ownerRole: "HR Ops", completed: false },
    { employeeId: jonah.id, title: "Complete privacy & data handling certification", ownerRole: "Employee", completed: false },
  ]);

  // 8. Performance Reviews
  await db.insert(performanceReviews).values([
    {
      employeeId: priya.id,
      cycle: "2026 H1 Review",
      reviewerName: "Sora Takahashi",
      rating: 5,
      summary: "Delivered cohesive design tokens across core modules and mentored two cross-functional partners.",
      goals: "Lead Q3 accessibility audit and ship mobile-first onboarding flows.",
    },
    {
      employeeId: liam.id,
      cycle: "2026 H1 Review",
      reviewerName: "Marcus Vance",
      rating: 5,
      summary: "Reduced query latency by 38% and authored zero-downtime PostgreSQL migration runbooks.",
      goals: "Mentor new engineering hires and finalize multi-region backup drills.",
    },
    {
      employeeId: nadia.id,
      cycle: "2026 H1 Review",
      reviewerName: "Marcus Vance",
      rating: 4,
      summary: "Consistent feature velocity with high test coverage and thoughtful PR reviews.",
      goals: "Own the leave-balance transactional API reliability roadmap.",
    },
    {
      employeeId: amira.id,
      cycle: "2026 H1 Review",
      reviewerName: "David Okafor",
      rating: 4,
      summary: "Strengthened enterprise onboarding cadence and improved NPS scores across key accounts.",
      goals: "Build self-serve QBR scorecard templates for mid-market accounts.",
    },
  ]);

  // 9. Employee Documents (offer_letter, policy_ack, nda, id_verified)
  await db.insert(employeeDocuments).values([
    { employeeId: hannah.id, title: "Executive Offer Letter — Hannah Reyes", docType: "offer_letter", status: "verified", uploadedDate: "2023-02-10" },
    { employeeId: marcus.id, title: "Mutual NDA & IP Assignment", docType: "nda", status: "verified", uploadedDate: "2023-04-28" },
    { employeeId: priya.id, title: "Signed Offer Letter — Priya Nair", docType: "offer_letter", status: "verified", uploadedDate: "2024-04-09" },
    { employeeId: priya.id, title: "2026 Employee Handbook Acknowledgment", docType: "policy_ack", status: "verified", uploadedDate: "2026-01-12" },
    { employeeId: liam.id, title: "Government ID Verification Record", docType: "id_verified", status: "verified", uploadedDate: "2024-02-01" },
    { employeeId: owen.id, title: "Offer Letter — Owen Brooks", docType: "offer_letter", status: "verified", uploadedDate: isoDateOffset(-10) },
    { employeeId: owen.id, title: "2026 Information Security Policy Ack", docType: "policy_ack", status: "pending", uploadedDate: isoDateOffset(-2) },
    { employeeId: jonah.id, title: "Confidentiality & Data Privacy NDA", docType: "nda", status: "verified", uploadedDate: isoDateOffset(-4) },
    { employeeId: jonah.id, title: "Employment Eligibility ID Verification", docType: "id_verified", status: "pending", uploadedDate: isoDateOffset(-1) },
  ]);

  // 10. Activity Logs
  await db.insert(activityLogs).values([
    {
      actorName: "Hannah Reyes",
      action: "leave.approved",
      entityType: "leave_request",
      entityId: elena.employeeCode,
      summary: "Approved 4-day annual leave for Elena Morales and logged attendance entries.",
    },
    {
      actorName: "Sora Takahashi",
      action: "candidate.advanced",
      entityType: "candidate",
      entityId: "Camila Duarte",
      summary: "Advanced Camila Duarte (Product Designer) to Offer stage.",
    },
    {
      actorName: "Marcus Vance",
      action: "onboarding.updated",
      entityType: "onboarding_task",
      entityId: owen.employeeCode,
      summary: "Completed engineering architecture walkthrough for Owen Brooks.",
    },
    {
      actorName: "Claire Bennett",
      action: "review.submitted",
      entityType: "performance_review",
      entityId: priya.employeeCode,
      summary: "Published 2026 H1 performance review cycle summary for Design & Engineering.",
    },
  ]);
}
