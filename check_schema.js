const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['clubs', 'club_admins', 'club_members', 'club_requests', 'profiles'];
  
  for (const table of tables) {
    console.log(\n---  ---);
    // Instead of querying information_schema directly (needs postgres role which might not be accessible via REST API),
    // let's fetch a single row or just try to select * limit 1 to see the keys.
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log('Error fetching', table, ':', error.message);
    } else {
      if (data && data.length > 0) {
        console.log('Columns from sample data:', Object.keys(data[0]).join(', '));
      } else {
        console.log('Table empty, trying to insert an empty row and rollback or just fetch with count? That wont give schema.');
        console.log('Maybe we can check postgrest openapi spec?');
      }
    }
  }
}
check();
