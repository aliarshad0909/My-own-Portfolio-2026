export type AttendanceSample = {
  logDate: string;
  status: string;
};

export type CurrentAttendanceAnalytics = {
  latestAttendanceDate: string | null;
  attendanceRatePct: number;
  remoteSharePct: number;
  totalAttendanceSamples: number;
  presentOrRemoteCount: number;
  remoteCount: number;
};

export function todayIsoDateUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Picks the latest attendance logDate on or before referenceDateStr (YYYY-MM-DD),
 * ignoring future-dated entries (such as approved upcoming leave rows).
 */
export function selectCurrentAttendanceDate(
  logs: readonly AttendanceSample[],
  referenceDateStr: string = todayIsoDateUtc(),
): string | null {
  let latest: string | null = null;
  for (const row of logs) {
    if (row.logDate <= referenceDateStr) {
      if (latest === null || row.logDate > latest) {
        latest = row.logDate;
      }
    }
  }
  return latest;
}

/**
 * Computes attendance rate and remote share strictly from the latest attendance date
 * on or before referenceDateStr (defaults to today UTC), ensuring approved future
 * leave rows never replace current operational attendance analytics.
 */
export function computeCurrentAttendanceAnalytics(
  logs: readonly AttendanceSample[],
  referenceDateStr: string = todayIsoDateUtc(),
): CurrentAttendanceAnalytics {
  const latestAttendanceDate = selectCurrentAttendanceDate(logs, referenceDateStr);
  if (!latestAttendanceDate) {
    return {
      latestAttendanceDate: null,
      attendanceRatePct: 0,
      remoteSharePct: 0,
      totalAttendanceSamples: 0,
      presentOrRemoteCount: 0,
      remoteCount: 0,
    };
  }

  const latestAttendance = logs.filter((a) => a.logDate === latestAttendanceDate);
  const presentOrRemoteCount = latestAttendance.filter(
    (a) => a.status === "present" || a.status === "remote",
  ).length;
  const remoteCount = latestAttendance.filter((a) => a.status === "remote").length;
  const attendanceRatePct =
    latestAttendance.length > 0
      ? Math.round((presentOrRemoteCount / latestAttendance.length) * 100)
      : 0;
  const remoteSharePct =
    presentOrRemoteCount > 0 ? Math.round((remoteCount / presentOrRemoteCount) * 100) : 0;

  return {
    latestAttendanceDate,
    attendanceRatePct,
    remoteSharePct,
    totalAttendanceSamples: latestAttendance.length,
    presentOrRemoteCount,
    remoteCount,
  };
}
