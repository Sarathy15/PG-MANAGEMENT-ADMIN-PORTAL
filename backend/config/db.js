const supabase = require('./supabase');

const connectDB = async () => {
  try {
    // Test Supabase connection by querying a lightweight endpoint
    const { error } = await supabase.from('properties').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table empty — that's fine
      throw new Error(error.message);
    }
    console.log('✅ Supabase PostgreSQL connected successfully');
  } catch (error) {
    console.error(`❌ Supabase Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
