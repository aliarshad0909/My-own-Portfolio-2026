import assert from "node:assert/strict";
import test from "node:test";
import {
  canMutateSelectedTicket,
  shouldApplyTicketDetailResponse,
  shouldApplyTicketScopedResult,
} from "../src/lib/inbox-state";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

test("shouldApplyTicketDetailResponse discards out-of-order responses during rapid ticket switching", async () => {
  type Detail = { ticket: { id: string; subject: string } };

  const state: {
    currentSelectedId: string | null;
    latestRequestSeq: number;
    activeController: AbortController | null;
    displayedDetail: Detail | null;
  } = {
    currentSelectedId: null,
    latestRequestSeq: 0,
    activeController: null,
    displayedDetail: null,
  };

  const ticketADeferred = createDeferred<Detail>();
  const ticketBDeferred = createDeferred<Detail>();

  const loadTicket = (ticketId: string, responsePromise: Promise<Detail>) => {
    state.activeController?.abort();
    const controller = new AbortController();
    state.activeController = controller;
    state.currentSelectedId = ticketId;
    state.displayedDetail = null;
    const requestSeq = ++state.latestRequestSeq;

    return responsePromise.then((payload) => {
      if (
        shouldApplyTicketDetailResponse({
          requestSeq,
          latestRequestSeq: state.latestRequestSeq,
          requestedTicketId: ticketId,
          currentSelectedId: state.currentSelectedId,
          responseTicketId: payload.ticket.id,
          aborted: controller.signal.aborted,
        })
      ) {
        state.displayedDetail = payload;
      }
    });
  };

  const getDisplayed = (): Detail | null => state.displayedDetail;

  // Start request #1 for Ticket A (slow)
  const reqA = loadTicket("ticket-A", ticketADeferred.promise);
  assert.equal(getDisplayed(), null);

  // Agent rapidly clicks Ticket B before Ticket A responds -> starts request #2
  const reqB = loadTicket("ticket-B", ticketBDeferred.promise);
  assert.equal(getDisplayed(), null);

  // Request #2 for Ticket B resolves first
  ticketBDeferred.resolve({ ticket: { id: "ticket-B", subject: "Ticket B Subject" } });
  await reqB;
  assert.equal(getDisplayed()?.ticket.id, "ticket-B");

  // Stale request #1 for Ticket A resolves AFTER Ticket B -> MUST be ignored
  ticketADeferred.resolve({ ticket: { id: "ticket-A", subject: "Ticket A Subject" } });
  await reqA;
  assert.equal(
    getDisplayed()?.ticket.id,
    "ticket-B",
    "Late Ticket A response must never overwrite selected Ticket B",
  );
});

test("shouldApplyTicketDetailResponse rejects stale sequence, aborted signals, and mismatched payloads", () => {
  // Stale sequence even if not marked aborted
  assert.equal(
    shouldApplyTicketDetailResponse({
      requestSeq: 1,
      latestRequestSeq: 2,
      requestedTicketId: "ticket-A",
      currentSelectedId: "ticket-B",
      responseTicketId: "ticket-A",
      aborted: false,
    }),
    false,
  );

  // Same ticket re-fetched, earlier request resolves late -> rejected by sequence check
  assert.equal(
    shouldApplyTicketDetailResponse({
      requestSeq: 3,
      latestRequestSeq: 4,
      requestedTicketId: "ticket-A",
      currentSelectedId: "ticket-A",
      responseTicketId: "ticket-A",
      aborted: false,
    }),
    false,
  );

  // Aborted request -> rejected
  assert.equal(
    shouldApplyTicketDetailResponse({
      requestSeq: 5,
      latestRequestSeq: 5,
      requestedTicketId: "ticket-B",
      currentSelectedId: "ticket-B",
      responseTicketId: "ticket-B",
      aborted: true,
    }),
    false,
  );

  // Mismatched response ticket payload -> rejected
  assert.equal(
    shouldApplyTicketDetailResponse({
      requestSeq: 6,
      latestRequestSeq: 6,
      requestedTicketId: "ticket-B",
      currentSelectedId: "ticket-B",
      responseTicketId: "ticket-A",
      aborted: false,
    }),
    false,
  );

  // Valid matching latest response -> accepted
  assert.equal(
    shouldApplyTicketDetailResponse({
      requestSeq: 7,
      latestRequestSeq: 7,
      requestedTicketId: "ticket-B",
      currentSelectedId: "ticket-B",
      responseTicketId: "ticket-B",
      aborted: false,
    }),
    true,
  );
});

test("canMutateSelectedTicket blocks mutations whenever detail is missing, loading, busy, or mismatched", () => {
  // Displayed detail belongs to Ticket A while selection already moved to Ticket B
  assert.equal(
    canMutateSelectedTicket({
      selectedId: "ticket-B",
      displayedTicketId: "ticket-A",
      detailLoading: false,
    }),
    false,
  );

  // Detail cleared while Ticket B is still loading
  assert.equal(
    canMutateSelectedTicket({
      selectedId: "ticket-B",
      displayedTicketId: null,
      detailLoading: true,
    }),
    false,
  );

  // Matching detail ID, but detail refresh is currently in flight
  assert.equal(
    canMutateSelectedTicket({
      selectedId: "ticket-B",
      displayedTicketId: "ticket-B",
      detailLoading: true,
    }),
    false,
  );

  // Matching detail ID, but another mutation is busy
  assert.equal(
    canMutateSelectedTicket({
      selectedId: "ticket-B",
      displayedTicketId: "ticket-B",
      detailLoading: false,
      busy: true,
    }),
    false,
  );

  // No selected ticket
  assert.equal(
    canMutateSelectedTicket({
      selectedId: null,
      displayedTicketId: "ticket-B",
      detailLoading: false,
    }),
    false,
  );

  // Exact match, loaded, not busy -> mutation allowed
  assert.equal(
    canMutateSelectedTicket({
      selectedId: "ticket-B",
      displayedTicketId: "ticket-B",
      detailLoading: false,
      busy: false,
    }),
    true,
  );
});

test("shouldApplyTicketScopedResult ignores late AI draft / refresh completions after switching tickets", () => {
  assert.equal(
    shouldApplyTicketScopedResult({
      targetTicketId: "ticket-A",
      currentSelectedId: "ticket-B",
    }),
    false,
  );
  assert.equal(
    shouldApplyTicketScopedResult({
      targetTicketId: "ticket-B",
      currentSelectedId: "ticket-B",
      aborted: true,
    }),
    false,
  );
  assert.equal(
    shouldApplyTicketScopedResult({
      targetTicketId: "ticket-B",
      currentSelectedId: "ticket-B",
    }),
    true,
  );
});
