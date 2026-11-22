CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'demo',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  reference TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate REAL NOT NULL DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  base_amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'cleared',
  reconciled INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  direction TEXT NOT NULL DEFAULT 'receivable',
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate REAL NOT NULL DEFAULT 1,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate_pct REAL NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  base_total_cents INTEGER NOT NULL DEFAULT 0,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  paid_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 0,
  line_total_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  monthly_limit_cents INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT '2026-Q4',
  owner_name TEXT NOT NULL DEFAULT 'Finance Ops',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS currency_rates (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rate_to_usd REAL NOT NULL,
  note TEXT NOT NULL DEFAULT 'User-configured demonstration rate',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_date TEXT NOT NULL,
  description TEXT NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'unmatched',
  matched_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS financeos_ar_invoice_seq START WITH 2000 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS financeos_ap_bill_seq START WITH 2000 INCREMENT BY 1;

SELECT setval(
  'financeos_ar_invoice_seq',
  GREATEST(
    COALESCE(
      (SELECT MAX(substring(invoice_number FROM '^INV-\d{4}-(\d+)$')::bigint)
       FROM invoices
       WHERE invoice_number ~ '^INV-\d{4}-\d+$'),
      1999
    ),
    (SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END FROM financeos_ar_invoice_seq)
  ),
  true
);

SELECT setval(
  'financeos_ap_bill_seq',
  GREATEST(
    COALESCE(
      (SELECT MAX(substring(invoice_number FROM '^BILL-\d{4}-(\d+)$')::bigint)
       FROM invoices
       WHERE invoice_number ~ '^BILL-\d{4}-\d+$'),
      1999
    ),
    (SELECT CASE WHEN is_called THEN last_value ELSE last_value - 1 END FROM financeos_ap_bill_seq)
  ),
  true
);
