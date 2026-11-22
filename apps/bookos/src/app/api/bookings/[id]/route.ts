import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  BookingValidationError,
  SlotConflictError,
  cancelBookingAtomic,
  completeBookingAtomic,
  rescheduleBookingAtomic,
} from "@/lib/scheduling";
import { verifyCsrfOrigin } from "@/lib/security";
import { bookingActionSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const csrf = verifyCsrfOrigin(request);
  if (csrf) return csrf;

  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const limit = checkRateLimit(clientKey(request, "mutate-booking"), 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = bookingActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking action." },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === "reschedule") {
      const updated = await rescheduleBookingAtomic({
        bookingId: id,
        newStartUtc: new Date(parsed.data.startUtc),
        newStaffId: parsed.data.staffId,
        customerTimezone: parsed.data.customerTimezone,
        notes: parsed.data.notes,
        actorName: auth.user.name,
      });
      return NextResponse.json({
        booking: {
          ...updated,
          startUtc: updated.startUtc.toISOString(),
          endUtc: updated.endUtc.toISOString(),
        },
      });
    }

    if (parsed.data.action === "cancel") {
      const updated = await cancelBookingAtomic({
        bookingId: id,
        reason: parsed.data.reason,
        actorName: auth.user.name,
      });
      return NextResponse.json({
        booking: {
          ...updated,
          startUtc: updated.startUtc.toISOString(),
          endUtc: updated.endUtc.toISOString(),
        },
      });
    }

    const updated = await completeBookingAtomic({
      bookingId: id,
      actorName: auth.user.name,
    });
    return NextResponse.json({
      booking: {
        ...updated,
        startUtc: updated.startUtc.toISOString(),
        endUtc: updated.endUtc.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof SlotConflictError) {
      return NextResponse.json({ error: err.message, code: "SLOT_CONFLICT" }, { status: 409 });
    }
    if (err instanceof BookingValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update booking." },
      { status: 500 },
    );
  }
}
