require('dotenv').config();

async function runMigration() {
  console.log('Running Supabase migration...');

  const { Pool } = require('pg');

  // Use hardcoded Supabase connection — the psycopg URL format isn't compatible with pg
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing!');
  }
  connectionString = connectionString.replace('postgresql+psycopg://', 'postgresql://');

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('Connected! Running DDL statements...\n');

    const statements = [
      {
        name: 'Create staff table',
        sql: `CREATE TABLE IF NOT EXISTS staff (
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
        )`
      },
      {
        name: 'Create notices table',
        sql: `CREATE TABLE IF NOT EXISTS notices (
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
        )`
      },
      { name: 'Add billing_period to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS billing_period TEXT` },
      { name: 'Add receipt_number to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS receipt_number TEXT` },
      { name: 'Add payment_method to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI'` },
      { name: 'Add resolved_at to complaints', sql: `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ` },
      { name: 'Add property_code to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_code TEXT` },
      { name: 'Add city to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS city TEXT` },
      { name: 'Add state to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS state TEXT` },
      { name: 'Add pincode to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS pincode TEXT` },
      { name: 'Add owner_name to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_name TEXT` },
      { name: 'Add owner_phone to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_phone TEXT` },
      { name: 'Add total_rooms to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_rooms INT DEFAULT 0` },
      { name: 'Add total_beds to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_beds INT DEFAULT 0` },
      { name: 'Add occupied_beds to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS occupied_beds INT DEFAULT 0` },
      { name: 'Add vacant_beds to properties', sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS vacant_beds INT DEFAULT 0` },
      { name: 'Add room_type to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'Single'` },
      { name: 'Add floor to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT '1'` },
      { name: 'Add capacity to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 1` },
      { name: 'Add occupied_beds to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS occupied_beds INT DEFAULT 0` },
      { name: 'Add available_beds to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS available_beds INT DEFAULT 1` },
      { name: 'Add monthly_rent to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(10,2) DEFAULT 0` },
      { name: 'Add room_number to rooms', sql: `ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_number TEXT` },
      { name: 'Add electricity_amount to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS electricity_amount NUMERIC(10, 2) DEFAULT 0` },
      { name: 'Add misc_amount to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS misc_amount NUMERIC(10, 2) DEFAULT 0` },
      { name: 'Add security_deposit to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS security_deposit NUMERIC(10, 2) DEFAULT 0` },
      { name: 'Add notes to rent_payments', sql: `ALTER TABLE rent_payments ADD COLUMN IF NOT EXISTS notes TEXT` },
      { name: 'Add otp to visitors', sql: `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS otp TEXT` },
      { name: 'Add otp_verified to visitors', sql: `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS otp_verified BOOLEAN DEFAULT false` },
      { name: 'Add approval_status to visitors', sql: `ALTER TABLE visitors ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'Pending Resident Approval'` },
    ];

    let success = 0, skip = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt.sql);
        console.log(`  ✅ ${stmt.name}`);
        success++;
      } catch (e) {
        console.log(`  ⚠️  ${stmt.name}: ${e.message}`);
        skip++;
      }
    }

    console.log(`\n🎉 Migration complete! ${success} succeeded, ${skip} skipped/errored`);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
