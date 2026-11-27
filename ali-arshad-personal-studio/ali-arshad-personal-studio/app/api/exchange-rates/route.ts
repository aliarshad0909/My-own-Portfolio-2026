import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCY_CODES, type CurrencyCode, type RatesMap } from "@/lib/tools/currency";

/**
 * Isolated server-side exchange-rate proxy.
 *
 * Fetches daily mid-market reference rates from ExchangeRate-API's public
 * no-key Open Access endpoint (`open.er-api.com`), filters strictly to
 * supported currency codes, and caches on the server for 1 hour.
 *
 * Retains the last verified snapshot in memory so if the upstream provider is
 * briefly unreachable, the API can serve a clearly labeled `stale: true` fallback
 * (with original `updatedAt`) instead of pretending an old rate is fresh. If no
 * prior snapshot exists, returns HTTP 503 so the UI prompts for manual rate input.
 */

const UPSTREAM_URL = "https://open.er-api.com/v6/latest/USD";
const PROVIDER_NAME = "ExchangeRate-API (open.er-api.com)";

type UpstreamPayload = {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, unknown>;
};

type CachedRates = {
  rates: RatesMap;
  updatedAt: string;
  cachedAt: string;
};

let lastVerifiedSnapshot: CachedRates | null = null;

function staleFallbackResponse(reason: string) {
  if (lastVerifiedSnapshot) {
    return NextResponse.json(
      {
        ok: true,
        stale: true,
        staleReason: reason,
        base: "USD",
        provider: PROVIDER_NAME,
        updatedAt: lastVerifiedSnapshot.updatedAt,
        cachedAt: lastVerifiedSnapshot.cachedAt,
        rates: lastVerifiedSnapshot.rates,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      stale: false,
      error: `${reason} Enter a manual exchange rate below to continue.`,
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    const res = await fetch(UPSTREAM_URL, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return staleFallbackResponse("Live exchange rates are temporarily unavailable.");
    }

    const data = (await res.json()) as UpstreamPayload;
    if (data.result !== "success" || !data.rates || typeof data.rates !== "object") {
      return staleFallbackResponse("Unexpected response from exchange-rate provider.");
    }

    const filtered: RatesMap = {};
    for (const code of SUPPORTED_CURRENCY_CODES) {
      const value = data.rates[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        filtered[code as CurrencyCode] = value;
      }
    }

    if (!filtered.USD) filtered.USD = 1;

    const updatedAt =
      typeof data.time_last_update_utc === "string" ? data.time_last_update_utc : new Date().toUTCString();
    const cachedAt = new Date().toISOString();

    lastVerifiedSnapshot = { rates: filtered, updatedAt, cachedAt };

    return NextResponse.json(
      {
        ok: true,
        stale: false,
        base: "USD",
        provider: PROVIDER_NAME,
        updatedAt,
        cachedAt,
        rates: filtered,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return staleFallbackResponse("Unable to reach the exchange-rate service right now.");
  }
}
