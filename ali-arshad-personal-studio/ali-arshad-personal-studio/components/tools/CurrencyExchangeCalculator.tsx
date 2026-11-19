"use client";

import { useCallback, useEffect, useState } from "react";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import {
  CURRENCIES,
  POPULAR_PAIRS,
  convertCurrency,
  formatCurrencyAmount,
  type CurrencyCode,
  type RatesMap,
} from "@/lib/tools/currency";

type FeedState =
  | { status: "loading" }
  | { status: "ready"; rates: RatesMap; updatedAt: string; provider: string }
  | { status: "error"; message: string };

const DEFAULT_AMOUNT = 1000;
const DEFAULT_FROM: CurrencyCode = "USD";
const DEFAULT_TO: CurrencyCode = "PKR";

export function CurrencyExchangeCalculator() {
  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [from, setFrom] = useState<CurrencyCode>(DEFAULT_FROM);
  const [to, setTo] = useState<CurrencyCode>(DEFAULT_TO);
  const [manualRateStr, setManualRateStr] = useState<string>("");
  const [feed, setFeed] = useState<FeedState>({ status: "loading" });

  const loadRates = useCallback(async () => {
    setFeed({ status: "loading" });
    try {
      const res = await fetch("/api/exchange-rates");
      const data = (await res.json().catch(() => null)) as
        | { ok: true; rates: RatesMap; updatedAt: string; provider: string }
        | { ok: false; error?: string }
        | null;

      if (res.ok && data && data.ok === true && data.rates) {
        setFeed({ status: "ready", rates: data.rates, updatedAt: data.updatedAt, provider: data.provider });
      } else {
        setFeed({
          status: "error",
          message:
            (data && "error" in data && data.error) ||
            "Live exchange rates are temporarily unavailable. Enter a manual exchange rate below to continue.",
        });
      }
    } catch {
      setFeed({
        status: "error",
        message: "Unable to reach the exchange-rate service right now. Enter a manual exchange rate below to continue.",
      });
    }
  }, []);

  useEffect(() => {
    void loadRates();
  }, [loadRates]);

  const parsedManual = manualRateStr.trim() === "" ? null : Number(manualRateStr);
  const validManual = typeof parsedManual === "number" && Number.isFinite(parsedManual) && parsedManual > 0 ? parsedManual : null;

  const result = convertCurrency({
    amount,
    from,
    to,
    rates: feed.status === "ready" ? feed.rates : null,
    manualRate: validManual,
  });

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
    if (validManual) {
      const inv = Math.round((1 / validManual) * 100000) / 100000;
      setManualRateStr(String(inv));
    }
  };

  const handleReset = () => {
    setAmount(DEFAULT_AMOUNT);
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setManualRateStr("");
  };

  const summaryText = result.ok
    ? [
        `Currency Exchange Conversion`,
        `${formatCurrencyAmount(result.amount, result.from)} = ${formatCurrencyAmount(result.convertedAmount, result.to)}`,
        `Exchange rate: 1 ${result.from} = ${result.rate} ${result.to}`,
        `Inverse rate: 1 ${result.to} = ${result.inverseRate} ${result.from}`,
        `Rate source: ${
          result.source === "manual"
            ? "User manual rate override"
            : result.source === "identity"
              ? "Same currency (1:1)"
              : feed.status === "ready"
                ? `${feed.provider} (updated ${feed.updatedAt})`
                : "Reference feed"
        }`,
      ].join("\n")
    : `Currency Exchange (${from} → ${to}): Live rate unavailable — enter a manual exchange rate to calculate.`;

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__field">
          <span>Popular currency pairs</span>
          <div className="calc__choices" aria-label="Popular currency pairs">
            {POPULAR_PAIRS.map((pair) => {
              const active = from === pair.from && to === pair.to;
              return (
                <button
                  key={pair.label}
                  type="button"
                  className={`calc__choice ${active ? "is-on" : ""}`}
                  onClick={() => {
                    setFrom(pair.from);
                    setTo(pair.to);
                    setManualRateStr("");
                  }}
                >
                  {pair.label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="calc__field">
          <span>
            Amount <span className="calc__suffix">({from})</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={10}
            value={Number.isFinite(amount) ? amount : 0}
            onChange={(e) => {
              const n = e.target.value === "" ? 0 : Number(e.target.value);
              setAmount(Number.isFinite(n) ? Math.max(n, 0) : 0);
            }}
          />
        </label>

        <div className="calc__fx-pair">
          <label className="calc__field">
            <span>From currency</span>
            <select value={from} onChange={(e) => setFrom(e.target.value as CurrencyCode)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn--secondary btn--sm calc__swap-btn"
            onClick={handleSwap}
            aria-label={`Swap ${from} and ${to}`}
            title="Swap currencies"
          >
            <Icon name="swap" size={16} />
            <span>Swap</span>
          </button>

          <label className="calc__field">
            <span>To currency</span>
            <select value={to} onChange={(e) => setTo(e.target.value as CurrencyCode)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="calc__field">
          <span>
            Manual exchange rate override <span className="calc__suffix">(optional: 1 {from} = ? {to})</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.0001}
            placeholder={result.ok && result.source === "live" ? `Using live rate (${result.rate})` : `Enter 1 ${from} in ${to}`}
            value={manualRateStr}
            onChange={(e) => setManualRateStr(e.target.value)}
          />
          <small className="calc__hint">
            Leave blank to use the cached mid-market reference rate, or type your bank or supplier&rsquo;s exact quote.
          </small>
        </label>

        {feed.status === "error" ? (
          <div className="notice" role="status">
            <Icon name="alert" size={16} />
            <div>
              <p>{feed.message}</p>
              <button type="button" className="calc__retry-link" onClick={() => void loadRates()}>
                Retry fetching live rates
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">
          {amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {from} equals
        </p>

        {result.ok ? (
          <>
            <p className="calc__out-value">{formatCurrencyAmount(result.convertedAmount, result.to)}</p>
            <p className="calc__out-pill">
              {result.source === "manual"
                ? "Manual rate override active"
                : result.source === "identity"
                  ? "Same currency selected"
                  : "Cached mid-market reference rate"}
            </p>

            <dl className="calc__breakdown">
              <div>
                <dt>Exchange rate</dt>
                <dd>
                  1 {result.from} = {result.rate} {result.to}
                </dd>
              </div>
              <div>
                <dt>Inverse rate</dt>
                <dd>
                  1 {result.to} = {result.inverseRate} {result.from}
                </dd>
              </div>
              <div>
                <dt>Rate source</dt>
                <dd>
                  {result.source === "manual"
                    ? "Custom user rate"
                    : feed.status === "ready"
                      ? feed.provider
                      : "Identity"}
                </dd>
              </div>
              {result.source === "live" && feed.status === "ready" ? (
                <div>
                  <dt>Last updated</dt>
                  <dd>{feed.updatedAt}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : feed.status === "loading" ? (
          <p className="calc__out-sub">Loading reference exchange rates…</p>
        ) : (
          <>
            <p className="calc__out-value calc__out-value--muted">Manual rate needed</p>
            <p className="calc__out-sub">
              Live exchange rates could not be loaded. Enter a custom exchange rate in the manual override field to compute {from} → {to} without
              guessing.
            </p>
          </>
        )}

        <CalculatorActions summaryText={summaryText} onReset={handleReset} />
      </output>
    </div>
  );
}

