import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { BookingValidationError, computeAvailableSlots } from "@/lib/scheduling";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") || "";
  const staffId = url.searchParams.get("staffId") || "";
  const dateKey = url.searchParams.get("date") || "";
  const timezone = url.searchParams.get("timezone") || "America/New_York";
  const excludeBookingId = url.searchParams.get("excludeBookingId") || undefined;

  if (!serviceId || !staffId || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return NextResponse.json(
      { error: "serviceId, staffId, and date (YYYY-MM-DD) are required." },
      { status: 400 },
    );
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: "Invalid IANA timezone parameter." }, { status: 400 });
  }

  try {
    const result = await computeAvailableSlots({
      serviceId,
      staffId,
      dateKey,
      viewerTimezone: timezone,
      excludeBookingId,
    });

    return NextResponse.json({
      date: dateKey,
      timezone,
      staffTimezone: result.staffMember.timezone,
      durationMins: result.service.durationMins,
      bufferMins: result.service.bufferMins,
      slots: result.slots,
    });
  } catch (err) {
    if (err instanceof BookingValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to compute available slots." },
      { status: 500 },
    );
  }
}
