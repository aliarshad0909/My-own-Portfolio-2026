export type ExplorerRequestTicket = {
  seq: number;
  datasetId: string;
  signal: AbortSignal;
};

/**
 * Pure gate that decides whether an async Explorer query response may update UI state.
 * Rejects any response that has been superseded by a newer request sequence or whose
 * requested/returned datasetId does not match the currently selected dataset.
 */
export function shouldApplyExplorerResponse(params: {
  requestSeq: number;
  latestSeq: number;
  requestedDatasetId: string;
  selectedDatasetId: string;
  responseDatasetId: string;
}): boolean {
  if (params.requestSeq !== params.latestSeq) return false;
  if (!params.selectedDatasetId) return false;
  if (params.requestedDatasetId !== params.selectedDatasetId) return false;
  if (params.responseDatasetId !== params.selectedDatasetId) return false;
  return true;
}

/**
 * Pure guard that determines whether Save Dashboard / Export CSV actions are safe to execute.
 * Prevents saving or exporting while a dataset switch or query is in flight or mismatched.
 */
export function isExplorerActionReady(params: {
  loading: boolean;
  querying: boolean;
  datasetId: string;
  loadedDatasetId: string | null;
  resultDatasetId: string | null;
}): boolean {
  if (params.loading || params.querying) return false;
  if (!params.datasetId) return false;
  if (params.loadedDatasetId !== params.datasetId) return false;
  if (params.resultDatasetId !== params.datasetId) return false;
  return true;
}

export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

/**
 * Coordinates monotonic request sequencing and AbortController cancellation for
 * Explorer dataset/query fetches so out-of-order responses never overwrite newer state.
 */
export class ExplorerRequestTracker {
  private currentSeq = 0;
  private activeDatasetId = "";
  private activeController: AbortController | null = null;

  begin(datasetId: string): ExplorerRequestTicket {
    this.activeController?.abort();
    const controller = new AbortController();
    this.activeController = controller;
    this.currentSeq += 1;
    this.activeDatasetId = datasetId;
    return {
      seq: this.currentSeq,
      datasetId,
      signal: controller.signal,
    };
  }

  commitExternal(datasetId: string): number {
    this.activeController?.abort();
    this.activeController = null;
    this.currentSeq += 1;
    this.activeDatasetId = datasetId;
    return this.currentSeq;
  }

  abort(): void {
    this.activeController?.abort();
    this.activeController = null;
    this.currentSeq += 1;
  }

  getLatestSeq(): number {
    return this.currentSeq;
  }

  getActiveDatasetId(): string {
    return this.activeDatasetId;
  }

  isLatest(seq: number): boolean {
    return seq === this.currentSeq;
  }

  shouldApplyResponse(
    ticket: Pick<ExplorerRequestTicket, "seq" | "datasetId">,
    responseDatasetId: string,
    selectedDatasetId: string = this.activeDatasetId,
  ): boolean {
    return shouldApplyExplorerResponse({
      requestSeq: ticket.seq,
      latestSeq: this.currentSeq,
      requestedDatasetId: ticket.datasetId,
      selectedDatasetId,
      responseDatasetId,
    });
  }
}
