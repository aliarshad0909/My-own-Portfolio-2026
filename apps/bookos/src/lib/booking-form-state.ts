export type AvailabilityCriteria = {
  serviceId: string;
  staffId: string;
  date: string;
  timezone: string;
};

export type SlotCandidate = {
  startUtc: string;
  available: boolean;
};

/**
 * Builds a canonical key representing the active booking availability criteria.
 * Returns an empty string when required fields (service, staff, date) are missing.
 */
export function buildAvailabilityKey(criteria: AvailabilityCriteria): string {
  const serviceId = criteria.serviceId.trim();
  const staffId = criteria.staffId.trim();
  const date = criteria.date.trim();
  const timezone = criteria.timezone.trim();
  if (!serviceId || !staffId || !date) return "";
  return `${serviceId}|${staffId}|${date}|${timezone}`;
}

/**
 * Determines whether an async availability response should be applied to UI state.
 * Discards aborted, superseded (older sequence), or criteria-mismatched responses.
 */
export function shouldApplyAvailabilityResponse(params: {
  requestSeq: number;
  latestRequestSeq: number;
  requestKey: string;
  currentKey: string;
  aborted?: boolean;
}): boolean {
  if (params.aborted) return false;
  if (!params.requestKey || !params.currentKey) return false;
  return (
    params.requestSeq === params.latestRequestSeq &&
    params.requestKey === params.currentKey
  );
}

/**
 * Determines whether booking confirmation can proceed.
 * Blocks confirmation while loading/submitting, while loaded slots do not match
 * the active criteria key, or when selectedSlotUtc is not an available loaded slot.
 */
export function canConfirmBooking(params: {
  submitting: boolean;
  slotsLoading: boolean;
  currentCriteriaKey: string;
  loadedCriteriaKey: string | null;
  selectedSlotUtc: string;
  slots: SlotCandidate[];
}): boolean {
  if (params.submitting || params.slotsLoading) return false;
  if (!params.currentCriteriaKey || params.loadedCriteriaKey !== params.currentCriteriaKey) {
    return false;
  }
  if (!params.selectedSlotUtc) return false;
  return params.slots.some(
    (slot) => slot.startUtc === params.selectedSlotUtc && slot.available,
  );
}
