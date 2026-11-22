/**
 * Pure state-transition and stale-response guard helpers for the Shared Inbox.
 * Prevents out-of-order ticket detail fetches from overwriting a newer selection
 * and prevents reply/metadata mutations from targeting the wrong ticket.
 */

export type TicketDetailResponseCheck = {
  requestSeq: number;
  latestRequestSeq: number;
  requestedTicketId: string;
  currentSelectedId: string | null;
  responseTicketId: string | null | undefined;
  aborted?: boolean;
};

/**
 * Returns true only when an async ticket detail response corresponds to the latest
 * in-flight request AND matches the currently selected ticket ID.
 */
export function shouldApplyTicketDetailResponse(params: TicketDetailResponseCheck): boolean {
  if (params.aborted) return false;
  if (params.requestSeq !== params.latestRequestSeq) return false;
  if (!params.currentSelectedId) return false;
  if (params.requestedTicketId !== params.currentSelectedId) return false;
  if (!params.responseTicketId || params.responseTicketId !== params.currentSelectedId) {
    return false;
  }
  return true;
}

export type TicketMutationGuardInput = {
  selectedId: string | null;
  displayedTicketId: string | null | undefined;
  detailLoading: boolean;
  busy?: boolean;
};

/**
 * Returns true only when the currently displayed ticket detail is loaded,
 * not busy, and matches the active selection ID.
 */
export function canMutateSelectedTicket(params: TicketMutationGuardInput): boolean {
  if (params.detailLoading || params.busy) return false;
  if (!params.selectedId || !params.displayedTicketId) return false;
  return params.displayedTicketId === params.selectedId;
}

/**
 * Guards ticket-scoped async results (e.g., AI draft generation or post-mutation refreshes)
 * so late responses cannot clobber state after the agent switches to another ticket.
 */
export function shouldApplyTicketScopedResult(params: {
  targetTicketId: string;
  currentSelectedId: string | null;
  aborted?: boolean;
}): boolean {
  if (params.aborted) return false;
  if (!params.currentSelectedId) return false;
  return params.targetTicketId === params.currentSelectedId;
}
