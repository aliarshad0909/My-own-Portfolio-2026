# Meridian Works — supply chain demo

Inventory, purchasing and receiving for a fictional furniture maker. Built as a
portfolio demonstration by Ali Arshad.

**Meridian Works is fictional.** Every item, supplier, order and movement is
synthetic data generated deterministically in the browser.

Project 06 of the portfolio expansion.

## The idea that holds it together

**Stock on hand is never stored.** Every receipt, production issue, adjustment
and transfer is appended to a movement ledger, and the balance for a SKU in a
warehouse is the sum of its movements. The ledger and the stock figure cannot
disagree, because they are the same number.

Everything else follows from that:

- **Nothing may go negative.** One function gates every stock change, so no screen can post a movement that would leave a negative balance. The error says exactly what is held and what the movement would leave.
- **Signs match intent.** A receipt must be positive, an issue must be negative, an adjustment may be either. A typo cannot silently invert a transaction.
- **Transfers are matched pairs.** Moving stock posts an out and an in together, so the total across warehouses is unchanged. A test asserts this.
- **Every movement carries a reference** — a PO number, a works order, a count reason — so any balance can be traced back.
- **PO status is derived, never set.** An order is `partial` or `received` because of what the ledger says was booked in, not because someone clicked a button.

## What actually works

**Inventory** — 16 SKUs across two warehouses with search, a below-reorder
filter, ABC classification, days of cover from real consumption history, and
stock value at standard cost. Adjustments (with reason codes) and inter-warehouse
transfers post straight to the ledger.

**Purchase orders** — draft, send, cancel; value and outstanding quantities;
overdue flagging. Reorder suggestions count stock already on order, so nothing
is ordered twice, and a draft PO can be raised from a suggestion in one click.

**Receiving** — book in against an open order, line by line or filled with the
outstanding quantity. Over-receipt is refused. Each accepted line posts one
receipt movement and the order status updates itself.

**Suppliers** — open order count, open value, overdue orders and SKU coverage
per supplier.

**Ledger** — every movement with a running balance per SKU and warehouse,
filterable by SKU and type.

**Reports** — inventory value by category, 30-day movement summary, ABC
classification, and items under 20 days of cover.

### Below reorder versus needing an order

These are deliberately different, and the interface shows both. An item can sit
below its reorder point and still need nothing ordered, because an open PO
already covers it. Those rows are tinted blue with the outstanding quantity in
an "On order" column; only genuinely uncovered items are flagged amber and
appear in the suggestions. A test asserts the table and the suggestions always
agree.

## What is deliberately not here

| Area | Reality |
| --- | --- |
| Persistence | In-memory only. A reload restores the seeded state. |
| Auth and roles | None. A real system would restrict who can adjust stock or approve a PO. |
| Costing method | Standard cost only. No FIFO, weighted average or landed cost. |
| Lot and serial tracking | Not modelled. |
| Supplier on-time rate | Seeded history, not calculated from the orders shown — and the interface says so. |

The ledger and purchasing modules in `src/lib/` have no React imports, so they
could run server-side against a real database unchanged.

## Running it

Requires Node.js 22.18 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm test           # 31 unit tests
```

```bash
npm run build && npx serve dist
npx playwright install chromium
node e2e/smoke.mjs http://localhost:3000
```

## Tests

| Suite | Count | Covers |
| --- | --- | --- |
| `tests/supply.test.ts` | 31 | Balances derived from movements; negative stock refused; zero, fractional and unreferenced movements refused; sign enforcement; transfers conserving total stock; unique movement ids; running balances; a deterministic seed that never holds negative stock and whose received PO lines match the ledger exactly; valuation; PO receipt, part-receipt, over-receipt and status derivation; transition rules; reorder suggestions counting stock on order and ignoring drafts; ABC; supplier exposure; consumption windows. |
| `e2e/smoke.mjs` | 27 | Search and filters, an adjustment moving the balance by exactly the amount posted, a refused negative movement leaving the ledger untouched, a transfer conserving the total, creating the shortfall then raising and sending a draft PO, the suggestion clearing once covered, receiving, over-receipt refusal, status change, ledger running balances, reports and supplier flags. |
| `qa` sweep | 8 | Layout at 5 widths, skip link, touch targets, console errors. |

All pass as of the last commit.

## Technology

React 19, TypeScript, esbuild. No state library, no UI framework, no table or
grid dependency. Fonts (Archivo, Roboto Mono) from Google Fonts under the SIL
Open Font License.

## Deploying

Static output. Deploy as its own Vercel project with root directory
`demos/supply-chain`, then set `liveUrl` in the portfolio's `lib/projects.ts`.
