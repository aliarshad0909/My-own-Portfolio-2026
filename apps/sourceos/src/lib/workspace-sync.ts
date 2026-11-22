/**
 * Pure snapshot key and state reconciliation helpers for SourceOS client workspaces.
 *
 * When a demo workspace reset (or any server revalidation via `router.refresh()`)
 * delivers fresh Server Component props with newly generated UUIDs, the snapshot key
 * changes deterministically so each workspace remounts cleanly with zero stale rows,
 * obsolete UUID selections, or lingering form state.
 */

export type Identifiable = {
  id: string;
};

export function buildWorkspaceSnapshotKey(tokens: readonly string[]): string {
  return tokens.join("|");
}

export function reconcileSelectedId<T extends Identifiable>(
  currentId: string | null | undefined,
  nextItems: readonly T[],
): string | null {
  if (currentId && nextItems.some((item) => item.id === currentId)) {
    return currentId;
  }
  return nextItems[0]?.id ?? null;
}

export function reconcileRequiredId<T extends Identifiable>(
  currentId: string | null | undefined,
  nextItems: readonly T[],
): string {
  return reconcileSelectedId(currentId, nextItems) ?? "";
}

export function getSuppliersSnapshotKey(
  suppliers: ReadonlyArray<{ id: string; qualificationStatus: string; name: string }>,
): string {
  return buildWorkspaceSnapshotKey(
    suppliers.map((s) => `${s.id}:${s.qualificationStatus}:${s.name}`),
  );
}

export function getRfqsSnapshotKey(
  rfqs: ReadonlyArray<{
    id: string;
    status: string;
    quotations: ReadonlyArray<{ id: string; selected: boolean }>;
  }>,
  suppliers: ReadonlyArray<Identifiable>,
): string {
  return buildWorkspaceSnapshotKey([
    ...rfqs.map(
      (r) =>
        `${r.id}:${r.status}:${r.quotations.map((q) => `${q.id}:${q.selected ? 1 : 0}`).join(",")}`,
    ),
    "sup",
    ...suppliers.map((s) => s.id),
  ]);
}

export function getOrdersSnapshotKey(
  pos: ReadonlyArray<{ id: string; status: string }>,
  shipments: ReadonlyArray<{ id: string; status: string }>,
  documents: ReadonlyArray<{ id: string; status: string }>,
  suppliers: ReadonlyArray<Identifiable>,
): string {
  return buildWorkspaceSnapshotKey([
    "po",
    ...pos.map((p) => `${p.id}:${p.status}`),
    "shp",
    ...shipments.map((s) => `${s.id}:${s.status}`),
    "doc",
    ...documents.map((d) => `${d.id}:${d.status}`),
    "sup",
    ...suppliers.map((s) => s.id),
  ]);
}

export function getLandedCostSnapshotKey(
  scenarios: ReadonlyArray<{ id: string; totalLandedUsdCents: number }>,
): string {
  return buildWorkspaceSnapshotKey(
    scenarios.map((s) => `${s.id}:${s.totalLandedUsdCents}`),
  );
}

export function reconcileWorkspaceSelections<
  TSupplier extends Identifiable,
  TRfq extends Identifiable,
  TPo extends Identifiable & { poNumber: string },
>(input: {
  previous: {
    selectedSupplierId: string | null;
    selectedRfqId: string;
    quoteSupplierId: string;
    poSupplierId: string;
    shipPoId: string;
    docEntityRef: string;
  };
  next: {
    suppliers: readonly TSupplier[];
    rfqs: readonly TRfq[];
    pos: readonly TPo[];
  };
}) {
  const nextPoRef =
    input.next.pos.some((p) => p.poNumber === input.previous.docEntityRef)
      ? input.previous.docEntityRef
      : (input.next.pos[0]?.poNumber ?? "PO-2026-4410");

  return {
    selectedSupplierId: reconcileSelectedId(
      input.previous.selectedSupplierId,
      input.next.suppliers,
    ),
    selectedRfqId: reconcileRequiredId(input.previous.selectedRfqId, input.next.rfqs),
    quoteSupplierId: reconcileRequiredId(
      input.previous.quoteSupplierId,
      input.next.suppliers,
    ),
    poSupplierId: reconcileRequiredId(input.previous.poSupplierId, input.next.suppliers),
    shipPoId: reconcileRequiredId(input.previous.shipPoId, input.next.pos),
    docEntityRef: nextPoRef,
  };
}
