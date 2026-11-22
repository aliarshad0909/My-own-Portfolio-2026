import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAvailabilityKey,
  canConfirmBooking,
  shouldApplyAvailabilityResponse,
} from "../src/lib/booking-form-state";

test("buildAvailabilityKey builds canonical keys and changes whenever service, staff, date, or timezone changes", () => {
  const base = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-12",
    timezone: "America/New_York",
  });
  assert.equal(base, "svc-1|stf-1|2027-04-12|America/New_York");

  assert.notEqual(
    buildAvailabilityKey({
      serviceId: "svc-2",
      staffId: "stf-1",
      date: "2027-04-12",
      timezone: "America/New_York",
    }),
    base,
  );
  assert.notEqual(
    buildAvailabilityKey({
      serviceId: "svc-1",
      staffId: "stf-2",
      date: "2027-04-12",
      timezone: "America/New_York",
    }),
    base,
  );
  assert.notEqual(
    buildAvailabilityKey({
      serviceId: "svc-1",
      staffId: "stf-1",
      date: "2027-04-13",
      timezone: "America/New_York",
    }),
    base,
  );
  assert.notEqual(
    buildAvailabilityKey({
      serviceId: "svc-1",
      staffId: "stf-1",
      date: "2027-04-12",
      timezone: "Europe/London",
    }),
    base,
  );

  // Incomplete criteria return empty key
  assert.equal(
    buildAvailabilityKey({
      serviceId: "",
      staffId: "stf-1",
      date: "2027-04-12",
      timezone: "America/New_York",
    }),
    "",
  );
});

test("shouldApplyAvailabilityResponse discards stale, out-of-order, criteria-mismatched, and aborted responses", () => {
  const keyA = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-12",
    timezone: "America/New_York",
  });
  const keyB = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-13",
    timezone: "America/New_York",
  });

  // Out-of-order response from request #1 arriving after request #2 started -> REJECT
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestSeq: 1,
      latestRequestSeq: 2,
      requestKey: keyA,
      currentKey: keyB,
      aborted: false,
    }),
    false,
  );

  // Same key re-fetch where older request finishes after newer request -> REJECT
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestSeq: 2,
      latestRequestSeq: 3,
      requestKey: keyB,
      currentKey: keyB,
      aborted: false,
    }),
    false,
  );

  // Matching seq but user changed criteria before response resolved -> REJECT
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestSeq: 3,
      latestRequestSeq: 3,
      requestKey: keyA,
      currentKey: keyB,
      aborted: false,
    }),
    false,
  );

  // Aborted controller -> REJECT
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestSeq: 3,
      latestRequestSeq: 3,
      requestKey: keyB,
      currentKey: keyB,
      aborted: true,
    }),
    false,
  );

  // Latest non-aborted response matching current criteria -> APPLY
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestSeq: 3,
      latestRequestSeq: 3,
      requestKey: keyB,
      currentKey: keyB,
      aborted: false,
    }),
    true,
  );
});

test("canConfirmBooking blocks confirmation during loading, criteria mismatch, or stale slot selection", () => {
  const keyDay1 = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-12",
    timezone: "America/New_York",
  });
  const keyDay2 = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-13",
    timezone: "America/New_York",
  });

  const day1Slots = [
    { startUtc: "2027-04-12T13:00:00.000Z", available: true },
    { startUtc: "2027-04-12T14:00:00.000Z", available: false },
  ];
  const day2Slots = [{ startUtc: "2027-04-13T13:00:00.000Z", available: true }];

  // Valid loaded state -> confirmation allowed
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading: false,
      currentCriteriaKey: keyDay1,
      loadedCriteriaKey: keyDay1,
      selectedSlotUtc: "2027-04-12T13:00:00.000Z",
      slots: day1Slots,
    }),
    true,
  );

  // User changes date to day 2 before replacement request finishes -> BLOCKED even if old slot lingered
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading: false,
      currentCriteriaKey: keyDay2,
      loadedCriteriaKey: keyDay1,
      selectedSlotUtc: "2027-04-12T13:00:00.000Z",
      slots: day1Slots,
    }),
    false,
  );

  // Blocked while loading replacement slots
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading: true,
      currentCriteriaKey: keyDay2,
      loadedCriteriaKey: keyDay2,
      selectedSlotUtc: "2027-04-13T13:00:00.000Z",
      slots: day2Slots,
    }),
    false,
  );

  // Blocked if selectedSlotUtc is NOT in the currently loaded available slots (stale timestamp)
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading: false,
      currentCriteriaKey: keyDay2,
      loadedCriteriaKey: keyDay2,
      selectedSlotUtc: "2027-04-12T13:00:00.000Z",
      slots: day2Slots,
    }),
    false,
  );

  // Blocked if selectedSlotUtc is marked unavailable (booked)
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading: false,
      currentCriteriaKey: keyDay1,
      loadedCriteriaKey: keyDay1,
      selectedSlotUtc: "2027-04-12T14:00:00.000Z",
      slots: day1Slots,
    }),
    false,
  );

  // Blocked while submitting
  assert.equal(
    canConfirmBooking({
      submitting: true,
      slotsLoading: false,
      currentCriteriaKey: keyDay1,
      loadedCriteriaKey: keyDay1,
      selectedSlotUtc: "2027-04-12T13:00:00.000Z",
      slots: day1Slots,
    }),
    false,
  );
});

test("rapid booking-form criteria changes + out-of-order responses never leak stale slots into confirmation", () => {
  // Simulate state transitions across rapid service/date switches
  let latestSeq = 0;
  let currentKey = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-12",
    timezone: "America/New_York",
  });
  let loadedKey: string | null = null;
  let slotsLoading = true;
  let selectedSlotUtc = "";
  let slots: Array<{ startUtc: string; available: boolean }> = [];

  // Request #1 starts for Day 1
  const req1Seq = ++latestSeq;
  const req1Key = currentKey;

  // Before req #1 finishes, user switches date to Day 2 and then staff to stf-2
  currentKey = buildAvailabilityKey({
    serviceId: "svc-1",
    staffId: "stf-1",
    date: "2027-04-13",
    timezone: "America/New_York",
  });
  selectedSlotUtc = "";
  slots = [];
  loadedKey = null;
  const req2Seq = ++latestSeq;
  const req2Key = currentKey;

  currentKey = buildAvailabilityKey({
    serviceId: "svc-2",
    staffId: "stf-2",
    date: "2027-04-14",
    timezone: "America/New_York",
  });
  selectedSlotUtc = "";
  slots = [];
  loadedKey = null;
  const req3Seq = ++latestSeq;
  const req3Key = currentKey;

  // Out-of-order response #1 arrives late — must be discarded
  if (
    shouldApplyAvailabilityResponse({
      requestSeq: req1Seq,
      latestRequestSeq: latestSeq,
      requestKey: req1Key,
      currentKey,
    })
  ) {
    slots = [{ startUtc: "2027-04-12T13:00:00.000Z", available: true }];
    loadedKey = req1Key;
    selectedSlotUtc = slots[0].startUtc;
    slotsLoading = false;
  }
  assert.equal(loadedKey, null);
  assert.equal(selectedSlotUtc, "");
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading,
      currentCriteriaKey: currentKey,
      loadedCriteriaKey: loadedKey,
      selectedSlotUtc,
      slots,
    }),
    false,
  );

  // Out-of-order response #2 arrives late — must also be discarded
  if (
    shouldApplyAvailabilityResponse({
      requestSeq: req2Seq,
      latestRequestSeq: latestSeq,
      requestKey: req2Key,
      currentKey,
    })
  ) {
    slots = [{ startUtc: "2027-04-13T13:00:00.000Z", available: true }];
    loadedKey = req2Key;
    selectedSlotUtc = slots[0].startUtc;
    slotsLoading = false;
  }
  assert.equal(loadedKey, null);
  assert.equal(selectedSlotUtc, "");
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading,
      currentCriteriaKey: currentKey,
      loadedCriteriaKey: loadedKey,
      selectedSlotUtc,
      slots,
    }),
    false,
  );

  // Latest response #3 arrives — applied and enables confirmation
  if (
    shouldApplyAvailabilityResponse({
      requestSeq: req3Seq,
      latestRequestSeq: latestSeq,
      requestKey: req3Key,
      currentKey,
    })
  ) {
    slots = [{ startUtc: "2027-04-14T15:00:00.000Z", available: true }];
    loadedKey = req3Key;
    selectedSlotUtc = slots[0].startUtc;
    slotsLoading = false;
  }
  assert.equal(loadedKey, req3Key);
  assert.equal(selectedSlotUtc, "2027-04-14T15:00:00.000Z");
  assert.equal(
    canConfirmBooking({
      submitting: false,
      slotsLoading,
      currentCriteriaKey: currentKey,
      loadedCriteriaKey: loadedKey,
      selectedSlotUtc,
      slots,
    }),
    true,
  );
});
