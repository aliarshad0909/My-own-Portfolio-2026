/**
 * Currency Exchange Calculator — pure conversion logic, unit tested.
 *
 * Works with live rates fetched through `/api/exchange-rates` (USD base) or an
 * explicit user-supplied manual exchange rate whenever live rates are offline
 * or the user wants to test a specific bank/supplier quote.
 *
 * Never fabricates live rates when data is missing.
 */

export type CurrencyCode =
  | "USD"
  | "PKR"
  | "EUR"
  | "GBP"
  | "AED"
  | "CNY"
  | "CAD"
  | "AUD"
  | "SAR"
  | "JPY"
  | "TRY"
  | "INR"
  | "CHF"
  | "SGD";

export type CurrencyMeta = {
  code: CurrencyCode;
  name: string;
  symbol: string;
};

export const CURRENCIES: CurrencyMeta[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "Rs" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
];

export const SUPPORTED_CURRENCY_CODES: CurrencyCode[] = CURRENCIES.map((c) => c.code);

export const POPULAR_PAIRS: { from: CurrencyCode; to: CurrencyCode; label: string }[] = [
  { from: "USD", to: "CNY", label: "USD → CNY" },
  { from: "CNY", to: "USD", label: "CNY → USD" },
  { from: "USD", to: "PKR", label: "USD → PKR" },
  { from: "EUR", to: "USD", label: "EUR → USD" },
  { from: "GBP", to: "USD", label: "GBP → USD" },
  { from: "AED", to: "USD", label: "AED → USD" },
];

export type RatesMap = Partial<Record<CurrencyCode, number>>;

export type CurrencyConversionInput = {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  /** USD-based rates map from /api/exchange-rates (where rates.USD === 1). */
  rates?: RatesMap | null;
  /** Optional explicit user override: 1 `from` = `manualRate` `to`. */
  manualRate?: number | null;
};

export type CurrencyConversionResult =
  | {
      ok: true;
      amount: number;
      from: CurrencyCode;
      to: CurrencyCode;
      rate: number;
      inverseRate: number;
      convertedAmount: number;
      source: "live" | "manual" | "identity";
    }
  | {
      ok: false;
      reason: "rate_unavailable";
      from: CurrencyCode;
      to: CurrencyCode;
    };

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const round6 = (n: number) => Math.round(n * 1_000_000) / 1_000_000;

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function convertCurrency(input: CurrencyConversionInput): CurrencyConversionResult {
  const amount = Number.isFinite(input.amount) ? Math.max(input.amount, 0) : 0;
  const { from, to, rates, manualRate } = input;

  if (from === to) {
    return {
      ok: true,
      amount,
      from,
      to,
      rate: 1,
      inverseRate: 1,
      convertedAmount: round4(amount),
      source: "identity",
    };
  }

  if (typeof manualRate === "number" && Number.isFinite(manualRate) && manualRate > 0) {
    return {
      ok: true,
      amount,
      from,
      to,
      rate: round6(manualRate),
      inverseRate: round6(1 / manualRate),
      convertedAmount: round4(amount * manualRate),
      source: "manual",
    };
  }

  const fromRate = rates?.[from];
  const toRate = rates?.[to];
  if (
    typeof fromRate === "number" &&
    typeof toRate === "number" &&
    Number.isFinite(fromRate) &&
    Number.isFinite(toRate) &&
    fromRate > 0 &&
    toRate > 0
  ) {
    const rate = toRate / fromRate;
    return {
      ok: true,
      amount,
      from,
      to,
      rate: round6(rate),
      inverseRate: round6(1 / rate),
      convertedAmount: round4(amount * rate),
      source: "live",
    };
  }

  return {
    ok: false,
    reason: "rate_unavailable",
    from,
    to,
  };
}

export function formatCurrencyAmount(value: number, code: CurrencyCode): string {
  const maxFraction = code === "JPY" ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: maxFraction,
      minimumFractionDigits: maxFraction,
    }).format(value);
  } catch {
    const meta = getCurrencyMeta(code);
    return `${meta.symbol} ${value.toLocaleString("en-US", { maximumFractionDigits: maxFraction })}`;
  }
}

