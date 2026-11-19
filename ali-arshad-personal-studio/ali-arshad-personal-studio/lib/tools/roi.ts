/**
 * Automation ROI calculator — pure logic, unit tested.
 *
 * Estimates the savings from automating a repetitive task against the one-time
 * build cost. Honest about assumptions: it models time saved, not revenue, and
 * caps the automation-efficiency factor below 100% because no automation
 * removes every minute of a task.
 */

export type RoiInput = {
  /** Hours spent on the task, per person, per week. */
  hoursPerWeek: number;
  /** Fully-loaded hourly cost of the people doing it, USD. */
  hourlyCost: number;
  /** How many people do this task. */
  people: number;
  /** Share of the work the automation realistically removes, 0–1. */
  automationFactor: number;
  /** One-time cost to build the automation, USD. */
  buildCost: number;
};

export type RoiResult = {
  weeklySaving: number;
  annualSaving: number;
  /** Weeks to recoup the build cost. Infinity if no saving. */
  paybackWeeks: number;
  /** First-year net return as a percentage of build cost. */
  firstYearRoiPct: number;
};

export const ROI_LIMITS = {
  automationFactor: { min: 0, max: 0.9 },
} as const;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function roi(input: RoiInput): RoiResult {
  const hours = Math.max(input.hoursPerWeek || 0, 0);
  const cost = Math.max(input.hourlyCost || 0, 0);
  const people = Math.max(Math.floor(input.people || 0), 0);
  // No automation is perfect; cap the factor so results stay credible.
  const factor = clamp(input.automationFactor || 0, ROI_LIMITS.automationFactor.min, ROI_LIMITS.automationFactor.max);
  const build = Math.max(input.buildCost || 0, 0);

  const weeklySaving = round2(hours * cost * people * factor);
  const annualSaving = round2(weeklySaving * 52);
  const paybackWeeks = weeklySaving > 0 ? round2(build / weeklySaving) : Infinity;
  const firstYearRoiPct = build > 0 ? round2(((annualSaving - build) / build) * 100) : 0;

  return { weeklySaving, annualSaving, paybackWeeks, firstYearRoiPct };
}
