"use client";

import { useState } from "react";
import Link from "next/link";
import { CalculatorActions } from "@/components/tools/CalculatorActions";
import { Icon } from "@/components/ui/Icon";
import { landedCost, type LandedCostInput } from "@/lib/tools/landed-cost";

const SUPPLIER_CURRENCIES = [
  { code: "USD", label: "USD — US Dollar", defaultRate: 1 },
  { code: "CNY", label: "CNY — Chinese Yuan", defaultRate: 0.14 },
  { code: "EUR", label: "EUR — Euro", defaultRate: 1.08 },
  { code: "GBP", label: "GBP — British Pound", defaultRate: 1.27 },
  { code: "AED", label: "AED — UAE Dirham", defaultRate: 0.2723 },
  { code: "PKR", label: "PKR — Pakistani Rupee", defaultRate: 0.0036 },
] as const;

const INITIAL_INPUT: Required<LandedCostInput> = {
  unitCost: 8,
  quantity: 500,
  currency: "USD",
  exchangeRate: 1,
  freight: 900,
  insurance: 120,
  dutyRatePct: 6.5,
  importTaxRatePct: 0,
  customsClearance: 180,
  localTransport: 140,
  otherFees: 100,
  targetSellingPrice: 28,
};

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
  hint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  step?: number;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="calc__field">
      <span>
        {label}
        {suffix ? <span className="calc__suffix"> ({suffix})</span> : null}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const parsed = e.target.value === "" ? 0 : Number(e.target.value);
          onChange(Number.isFinite(parsed) ? Math.max(parsed, min) : min);
        }}
      />
      {hint ? <small className="calc__hint">{hint}</small> : null}
    </label>
  );
}

export function LandedCostCalculator() {
  const [input, setInput] = useState<Required<LandedCostInput>>(INITIAL_INPUT);
  const r = landedCost(input);

  const update = <K extends keyof Required<LandedCostInput>>(key: K, value: Required<LandedCostInput>[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCurrencyChange = (code: string) => {
    const found = SUPPLIER_CURRENCIES.find((c) => c.code === code);
    setInput((prev) => ({
      ...prev,
      currency: code,
      exchangeRate: found ? found.defaultRate : 1,
    }));
  };

  const summaryText = [
    `Landed Cost Estimate (${input.quantity.toLocaleString("en-US")} units)`,
    `Supplier price: ${input.unitCost} ${r.currency}/unit (FX: 1 ${r.currency} = ${r.exchangeRate} USD) → Goods total: ${usd(r.goodsValue)}`,
    `International shipping: ${usd(r.freight)} | Insurance: ${usd(r.insurance)}`,
    `Customs duty (${input.dutyRatePct}%): ${usd(r.duty)} | Import tax (${input.importTaxRatePct}%): ${usd(r.importTax)}`,
    `Customs clearance: ${usd(r.customsClearance)} | Local transport: ${usd(r.localTransport)} | Additional expenses: ${usd(r.otherFees)}`,
    `Total landed cost: ${usd(r.totalLandedCost)} (${r.upliftFactor}× raw goods value)`,
    `Landed cost per unit: ${usd(r.perUnitLandedCost)}`,
    ...(r.grossMarginPct !== null && r.markupPct !== null && r.profitPerUnit !== null
      ? [
          `At target selling price ${usd(input.targetSellingPrice)}: Profit ${usd(r.profitPerUnit)}/unit | Gross margin ${r.grossMarginPct}% | Markup ${r.markupPct}%`,
        ]
      : []),
    `Note: Planning estimate only — confirm tariff classification with a licensed customs broker.`,
  ].join("\n");

  return (
    <div className="calc">
      <div className="calc__fields">
        <div className="calc__row">
          <label className="calc__field">
            <span>Supplier currency</span>
            <select value={input.currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
              {SUPPLIER_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <NumberField
            label={`Exchange rate (1 ${input.currency} → USD)`}
            value={input.exchangeRate}
            onChange={(n) => update("exchangeRate", n || 1)}
            min={0.0001}
            step={0.01}
            hint={input.currency === "USD" ? "1.00 when supplier invoices in USD." : "Editable planning FX rate."}
          />
        </div>

        <div className="calc__row">
          <NumberField
            label="Unit price from supplier"
            suffix={input.currency}
            value={input.unitCost}
            onChange={(n) => update("unitCost", n)}
            step={0.1}
          />
          <NumberField label="Order quantity" suffix="units" value={input.quantity} onChange={(n) => update("quantity", n)} step={10} />
        </div>

        <div className="calc__row">
          <NumberField
            label="International shipping / freight"
            suffix="USD"
            value={input.freight}
            onChange={(n) => update("freight", n)}
            step={25}
          />
          <NumberField label="Cargo insurance" suffix="USD" value={input.insurance} onChange={(n) => update("insurance", n)} step={10} />
        </div>

        <div className="calc__row">
          <NumberField
            label="Customs duty"
            suffix="% of goods"
            value={input.dutyRatePct}
            onChange={(n) => update("dutyRatePct", n)}
            step={0.1}
          />
          <NumberField
            label="Import taxes / VAT / GST"
            suffix="% of goods + duty"
            value={input.importTaxRatePct}
            onChange={(n) => update("importTaxRatePct", n)}
            step={0.1}
          />
        </div>

        <div className="calc__row calc__row--3">
          <NumberField
            label="Customs clearance"
            suffix="USD"
            value={input.customsClearance}
            onChange={(n) => update("customsClearance", n)}
            step={10}
          />
          <NumberField
            label="Local transport"
            suffix="USD"
            value={input.localTransport}
            onChange={(n) => update("localTransport", n)}
            step={10}
          />
          <NumberField
            label="Additional expenses"
            suffix="USD"
            value={input.otherFees}
            onChange={(n) => update("otherFees", n)}
            step={10}
          />
        </div>

        <NumberField
          label="Target selling price per unit (optional)"
          suffix="USD"
          value={input.targetSellingPrice}
          onChange={(n) => update("targetSellingPrice", n)}
          step={0.5}
          hint="Enter 0 to hide margin analysis, or add your planned retail/wholesale price to see profit per unit, markup and gross margin."
        />
      </div>

      <output className="calc__out" aria-live="polite">
        <p className="calc__out-label">Landed cost per unit</p>
        <p className="calc__out-value">{usd(r.perUnitLandedCost)}</p>
        <p className="calc__out-pill">
          Total landed cost: <strong>{usd(r.totalLandedCost)}</strong> · {r.upliftFactor}× raw goods value
        </p>

        <dl className="calc__breakdown">
          <div>
            <dt>Product purchase total</dt>
            <dd>
              {usd(r.goodsValue)}
              {r.currency !== "USD" ? ` (${r.supplierGoodsValue.toLocaleString("en-US")} ${r.currency})` : ""}
            </dd>
          </div>
          <div>
            <dt>International shipping</dt>
            <dd>{usd(r.freight)}</dd>
          </div>
          <div>
            <dt>Insurance</dt>
            <dd>{usd(r.insurance)}</dd>
          </div>
          <div>
            <dt>Customs duty ({input.dutyRatePct}%)</dt>
            <dd>{usd(r.duty)}</dd>
          </div>
          <div>
            <dt>Import taxes ({input.importTaxRatePct}%)</dt>
            <dd>{usd(r.importTax)}</dd>
          </div>
          <div>
            <dt>Customs clearance</dt>
            <dd>{usd(r.customsClearance)}</dd>
          </div>
          <div>
            <dt>Local transportation</dt>
            <dd>{usd(r.localTransport)}</dd>
          </div>
          <div>
            <dt>Additional expenses</dt>
            <dd>{usd(r.otherFees)}</dd>
          </div>
          <div className="calc__breakdown-total">
            <dt>Total landed cost</dt>
            <dd>{usd(r.totalLandedCost)}</dd>
          </div>
        </dl>

        {r.grossMarginPct !== null && r.markupPct !== null && r.profitPerUnit !== null ? (
          <div className="calc__margin-box">
            <p className="calc__margin-title">Profitability at {usd(input.targetSellingPrice)} / unit</p>
            <div className="calc__kpis">
              <div>
                <span>Profit / unit</span>
                <strong className={r.profitPerUnit < 0 ? "is-neg" : ""}>{usd(r.profitPerUnit)}</strong>
              </div>
              <div>
                <span>Gross margin</span>
                <strong className={r.grossMarginPct < 0 ? "is-neg" : ""}>{r.grossMarginPct}%</strong>
              </div>
              <div>
                <span>Markup</span>
                <strong className={r.markupPct < 0 ? "is-neg" : ""}>{r.markupPct}%</strong>
              </div>
            </div>
          </div>
        ) : null}

        <CalculatorActions summaryText={summaryText} onReset={() => setInput(INITIAL_INPUT)} />

        <div className="calc__cta-box">
          <p>Need help estimating freight weight or live FX rates first?</p>
          <div className="calc__cta-links">
            <Link href="/tools/shipping-cost-calculator" className="arrow-link">
              <span>Shipping Cost Calculator</span>
              <Icon name="arrow-right" size={15} />
            </Link>
            <Link href="/tools/currency-exchange-calculator" className="arrow-link">
              <span>Currency Converter</span>
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </output>
    </div>
  );
}
