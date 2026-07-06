"""
Run this script to create the missing tables in Supabase.
It uses SQLAlchemy (already installed for the Python backend) with the
DATABASE_URL from .env which works correctly via the Python psycopg driver.

Run: python create_tables.py
"""
from dotenv import load_dotenv
load_dotenv()

import os
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

statements = [
    # staff table
    """
    CREATE TABLE IF NOT EXISTS staff (
        id BIGSERIAL PRIMARY KEY,
        property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
        employee_id TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        shift TEXT DEFAULT 'Day',
        salary NUMERIC(10, 2) DEFAULT 0,
        attendance_status TEXT DEFAULT 'Present',
        active_status TEXT DEFAULT 'Active',
        profile_image TEXT,
        id_proof TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    # notices table
    """
    CREATE TABLE IF NOT EXISTS notices (
        id BIGSERIAL PRIMARY KEY,
        property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        content TEXT,
        category TEXT DEFAULT 'General',
        target_audience TEXT DEFAULT 'All Tenants',
        publish_date DATE DEFAULT CURRENT_DATE,
        expiry_date DATE,
        status TEXT DEFAULT 'Active',
        read_count INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
    """,
    # alter statements for missing columns
    "ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS billing_period TEXT",
    "ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS receipt_number TEXT",
    "ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI'",
    "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_code TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone TEXT",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 0",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_beds INT DEFAULT 0",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupied_beds INT DEFAULT 0",
    "ALTER TABLE properties ADD COLUMN IF NOT EXISTS vacant_beds INT DEFAULT 0",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'Single'",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT '1'",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS occupied_beds INT DEFAULT 0",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS available_beds INT DEFAULT 1",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(10,2) DEFAULT 0",
    "ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number TEXT",
    "ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS notes TEXT",
]

with engine.begin() as conn:
    for stmt in statements:
        try:
            conn.execute(text(stmt.strip()))
            short = stmt.strip()[:60].replace('\n', ' ')
            print(f"  ✅ {short}...")
        except Exception as e:
            short = stmt.strip()[:60].replace('\n', ' ')
            print(f"  ⚠️  {short}... -> {e}")

print("\n🎉 Migration complete!")
