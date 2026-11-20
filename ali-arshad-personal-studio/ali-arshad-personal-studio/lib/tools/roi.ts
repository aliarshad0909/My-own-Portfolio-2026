/**
 * Automation ROI calculator — pure logic, unit tested.
 *
 * Estimates time saved, labour cost savings, monthly net benefit after ongoing
 * software/maintenance cost, payback period and first-year ROI.
 *
 * Honest about assumptions: models labour time saved (not speculative revenue)
 * and caps the automation-efficiency factor below 100% because no automation
 * eliminates every minute of human oversight.
 */

export type RoiInput = {
  /** Hours spent on the repetitive task, per employee, per week. */
  hoursPerWeek: number;
  /** Average fully-loaded hourly labour cost, USD. */
  hourlyCost: number;
  /** Number of employees doing this task. */
  people: number;
  /** Share of the work the automation realistically removes, 0–0.9. */
  automationFactor: number;
  /** One-time initial implementation cost, USD. */
  buildCost: number;
  /** Working weeks per year (1–52). Defaults to 52 for backwards compatibility. */
  workingWeeksPerYear?: number;
  /** Ongoing monthly software, hosting or maintenance cost, USD. Defaults to 0. */
  monthlySoftwareCost?: number;
};

export type RoiResult = {
  weeklyHoursSaved: number;
  monthlyHoursSaved: number;
  annualHoursSaved: number;
  /** Gross labour value saved per week (before software cost). */
  weeklySaving: number;
  /** Gross labour value saved per month (before software cost). */
  monthlyGrossSaving: number;
  /** Gross labour value saved per year (before software cost). */
  annualSaving: number;
  /** Ongoing software/maintenance cost per year. */
  annualSoftwareCost: number;
  /** Net monthly benefit (monthly gross saving minus monthly software cost). */
  monthlyNetBenefit: number;
  /** Net annual benefit (annual gross saving minus annual software cost). */
  annualNetSaving: number;
  /** Weeks to recoup initial implementation cost from net benefit. Infinity if net benefit <= 0. */
  paybackWeeks: number;
  /** Months to recoup initial implementation cost from net benefit. Infinity if net benefit <= 0. */
  paybackMonths: number;
  /** First-year net return as a percentage of initial implementation cost. */
  firstYearRoiPct: number;
};

export const ROI_LIMITS = {
  automationFactor: { min: 0, max: 0.9 },
  workingWeeksPerYear: { min: 1, max: 52 },
} as const;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const safeNonNeg = (n: number | undefined) => (typeof n === "number" && Number.isFinite(n) ? Math.max(n, 0) : 0);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function roi(input: RoiInput): RoiResult {
  const hours = safeNonNeg(input.hoursPerWeek);
  const cost = safeNonNeg(input.hourlyCost);
  const people = Math.max(Math.floor(safeNonNeg(input.people)), 0);
  const factor = clamp(
    Number.isFinite(input.automationFactor) ? input.automationFactor : 0,
    ROI_LIMITS.automationFactor.min,
    ROI_LIMITS.automationFactor.max,
  );
  const build = safeNonNeg(input.buildCost);
  const weeksPerYear = clamp(
    Math.floor(
      typeof input.workingWeeksPerYear === "number" && Number.isFinite(input.workingWeeksPerYear)
        ? input.workingWeeksPerYear
        : 52,
    ),
    ROI_LIMITS.workingWeeksPerYear.min,
    ROI_LIMITS.workingWeeksPerYear.max,
  );
  const monthlySoftwareCost = safeNonNeg(input.monthlySoftwareCost);

  const weeklyHoursSaved = round2(hours * people * factor);
  const annualHoursSaved = round2(weeklyHoursSaved * weeksPerYear);
  const monthlyHoursSaved = round2(annualHoursSaved / 12);

  const weeklySaving = round2(weeklyHoursSaved * cost);
  const annualSaving = round2(weeklySaving * weeksPerYear);
  const monthlyGrossSaving = round2(annualSaving / 12);

  const annualSoftwareCost = round2(monthlySoftwareCost * 12);
  const annualNetSaving = round2(annualSaving - annualSoftwareCost);
  const monthlyNetBenefit = round2(annualNetSaving / 12);
  const weeklyNetSaving = annualNetSaving / weeksPerYear;

  const paybackWeeks = weeklyNetSaving > 0 ? round2(build / weeklyNetSaving) : Infinity;
  const paybackMonths = monthlyNetBenefit > 0 ? round2(build / monthlyNetBenefit) : Infinity;
  const firstYearRoiPct = build > 0 ? round2(((annualNetSaving - build) / build) * 100) : 0;

  return {
    weeklyHoursSaved,
    monthlyHoursSaved,
    annualHoursSaved,
    weeklySaving,
    monthlyGrossSaving,
    annualSaving,
    annualSoftwareCost,
    monthlyNetBenefit,
    annualNetSaving,
    paybackWeeks,
    paybackMonths,
    firstYearRoiPct,
  };
}
