import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCY_CODES, type CurrencyCode, type RatesMap } from "@/lib/tools/currency";

/**
 * Isolated server-side exchange-rate proxy.
 *
 * Fetches daily mid-market reference rates from ExchangeRate-API's public
 * no-key Open Access endpoint (`open.er-api.com`), filters strictly to
 * supported currency codes, and caches on the server for 1 hour.
 *
 * Never exposes secrets and never fabricates rates when the upstream feed is
 * unreachable — returns HTTP 503 so the UI smoothly prompts for a manual rate.
 */

const UPSTREAM_URL = "https://open.er-api.com/v6/latest/USD";
const PROVIDER_NAME = "ExchangeRate-API (open.er-api.com)";

type UpstreamPayload = {
  result?: string;
  base_code?: string;
  time_last_update_utc?: string;
  rates?: Record<string, unknown>;
};

export async function GET() {
  try {
    const res = await fetch(UPSTREAM_URL, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Live exchange rates are temporarily unavailable. Enter a manual exchange rate below to continue.",
        },
        { status: 503 },
      );
    }

    const data = (await res.json()) as UpstreamPayload;
    if (data.result !== "success" || !data.rates || typeof data.rates !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: "Unexpected response from exchange-rate provider. Enter a manual exchange rate below to continue.",
        },
        { status: 503 },
      );
    }

    const filtered: RatesMap = {};
    for (const code of SUPPORTED_CURRENCY_CODES) {
      const value = data.rates[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        filtered[code as CurrencyCode] = value;
      }
    }

    if (!filtered.USD) filtered.USD = 1;

    return NextResponse.json(
      {
        ok: true,
        base: "USD",
        provider: PROVIDER_NAME,
        updatedAt: typeof data.time_last_update_utc === "string" ? data.time_last_update_utc : new Date().toUTCString(),
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
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to reach the exchange-rate service right now. Enter a manual exchange rate below to continue.",
      },
      { status: 503 },
    );
  }
}

