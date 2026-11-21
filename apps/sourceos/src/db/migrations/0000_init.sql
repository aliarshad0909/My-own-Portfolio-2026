-- SourceOS Global Procurement & Sourcing Platform Schema
-- Uses native PostgreSQL 13+ gen_random_uuid() (no pgcrypto extension required)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('admin', 'procurement_lead', 'buyer', 'demo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  category TEXT NOT NULL,
  qualification_status TEXT NOT NULL DEFAULT 'under_review' CHECK (qualification_status IN ('approved', 'under_review', 'probation')),
  lead_time_days INTEGER NOT NULL DEFAULT 21 CHECK (lead_time_days >= 1),
  on_time_pct DOUBLE PRECISION NOT NULL DEFAULT 95.0 CHECK (on_time_pct >= 0 AND on_time_pct <= 100),
  defect_rate_pct DOUBLE PRECISION NOT NULL DEFAULT 0.8 CHECK (defect_rate_pct >= 0 AND defect_rate_pct <= 100),
  certifications TEXT NOT NULL DEFAULT 'ISO 9001',
  rating DOUBLE PRECISION NOT NULL DEFAULT 4.4 CHECK (rating >= 1 AND rating <= 5),
  contact_email TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(qualification_status);
CREATE INDEX IF NOT EXISTS idx_suppliers_country ON suppliers(country);

CREATE TABLE IF NOT EXISTS rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  target_qty INTEGER NOT NULL CHECK (target_qty >= 1),
  target_unit_cents INTEGER NOT NULL CHECK (target_unit_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'evaluating', 'awarded')),
  due_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 1),
  moq INTEGER NOT NULL DEFAULT 100 CHECK (moq >= 1),
  lead_time_days INTEGER NOT NULL DEFAULT 21 CHECK (lead_time_days >= 1),
  incoterms TEXT NOT NULL DEFAULT 'FOB',
  freight_estimate_cents INTEGER NOT NULL DEFAULT 0 CHECK (freight_estimate_cents >= 0),
  selected BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_supplier_id ON quotations(supplier_id);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_cost_cents INTEGER NOT NULL CHECK (unit_cost_cents >= 0),
  total_cents BIGINT NOT NULL CHECK (total_cents >= 0),
  incoterms TEXT NOT NULL DEFAULT 'FOB',
  status TEXT NOT NULL DEFAULT 'ordered' CHECK (status IN ('ordered', 'in_production', 'shipped', 'delivered')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'sea' CHECK (mode IN ('sea', 'air', 'express')),
  origin_port TEXT NOT NULL,
  dest_port TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'in_transit', 'customs', 'delivered')),
  eta_date TEXT NOT NULL,
  freight_cents INTEGER NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  insurance_cents INTEGER NOT NULL DEFAULT 0 CHECK (insurance_cents >= 0),
  duty_cents INTEGER NOT NULL DEFAULT 0 CHECK (duty_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_po_id ON shipments(po_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

CREATE TABLE IF NOT EXISTS landed_cost_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  product_price_cents INTEGER NOT NULL CHECK (product_price_cents >= 0),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  freight_cents INTEGER NOT NULL DEFAULT 0 CHECK (freight_cents >= 0),
  insurance_cents INTEGER NOT NULL DEFAULT 0 CHECK (insurance_cents >= 0),
  customs_duty_pct DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (customs_duty_pct >= 0 AND customs_duty_pct <= 200),
  other_expenses_cents INTEGER NOT NULL DEFAULT 0 CHECK (other_expenses_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate_to_usd DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (exchange_rate_to_usd > 0),
  total_landed_usd_cents BIGINT NOT NULL CHECK (total_landed_usd_cents >= 0),
  per_unit_landed_usd_cents INTEGER NOT NULL CHECK (per_unit_landed_usd_cents >= 0),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('commercial_invoice', 'packing_list', 'bill_of_lading', 'certificate_of_origin', 'qc_report')),
  entity_ref TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'submitted', 'verified')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
