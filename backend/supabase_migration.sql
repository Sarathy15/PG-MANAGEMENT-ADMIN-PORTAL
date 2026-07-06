-- ============================================================
--  PG Management Portal — Supabase SQL Migration
--  Run this in the Supabase SQL Editor to create all tables
--  needed by the Node.js backend (staff, notices, mgmt_users)
-- ============================================================

-- ─── STAFF TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id              BIGSERIAL PRIMARY KEY,
  property_id     BIGINT REFERENCES properties(id) ON DELETE SET NULL,
  employee_id     TEXT,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL,
  phone           TEXT,
  shift           TEXT DEFAULT 'Day',
  salary          NUMERIC(10, 2) DEFAULT 0,
  attendance_status TEXT DEFAULT 'Present',
  active_status   TEXT DEFAULT 'Active',
  profile_image   TEXT,
  id_proof        TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTICES TABLE ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id              BIGSERIAL PRIMARY KEY,
  property_id     BIGINT REFERENCES properties(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  content         TEXT,
  category        TEXT DEFAULT 'General',
  target_audience TEXT DEFAULT 'All Tenants',
  publish_date    DATE DEFAULT CURRENT_DATE,
  expiry_date     DATE,
  status          TEXT DEFAULT 'Active',
  read_count      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RENT PAYMENTS — ensure billing_period column exists ─────
ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS billing_period TEXT;
ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI';

-- ─── PROPERTIES — ensure all columns exist ────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_code  TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS city           TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS state          TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode        TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name     TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone    TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms    INT DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_beds     INT DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupied_beds  INT DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vacant_beds    INT DEFAULT 0;

-- ─── ROOMS — ensure all columns exist ────────────────────────
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type      TEXT DEFAULT 'Single';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor          TEXT DEFAULT '1';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity       INT DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS occupied_beds  INT DEFAULT 0;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS available_beds INT DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS monthly_rent   NUMERIC(10,2) DEFAULT 0;

-- ─── COMPLAINTS — ensure resolved_at column exists ───────────
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- ─── RLS Policies (allow service role access — already default for service_role key) ─
-- No RLS changes needed since we use service_role key in server

-- ─── Enable RLS on new tables (optional but recommended) ─────
ALTER TABLE staff   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access
CREATE POLICY "service_role_all_staff"   ON staff   USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_notices" ON notices USING (true) WITH CHECK (true);
