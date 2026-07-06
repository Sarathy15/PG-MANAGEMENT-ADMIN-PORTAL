const { Pool } = require('pg');

async function main() {
  const pool = new Pool({
    host: 'db.uyjugjeitqmccmgfzakd.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'rohitsharma45',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    console.log("Connected to database directly. Executing column additions on properties table...");
    
    const queries = [
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Boys PG';",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS google_maps_link TEXT;",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_landmarks TEXT;",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS gallery_images TEXT;",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS building_structure TEXT;",
      "ALTER TABLE properties ADD COLUMN IF NOT EXISTS opening_date TEXT DEFAULT '2025-06-10';"
    ];

    for (const q of queries) {
      await client.query(q);
      console.log(`Executed: ${q}`);
    }
    
    console.log("Success! Columns verified/added.");
  } catch (err) {
    console.error("Migration error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
