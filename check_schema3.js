const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['clubs', 'club_admins', 'club_members', 'club_requests', 'profiles'];
  
  for (const table of tables) {
    console.log('\n--- ' + table + ' ---');
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log('Error fetching', table, ':', error.message);
    } else {
      if (data && data.length > 0) {
        console.log('Columns from sample data:', Object.keys(data[0]).join(', '));
      } else {
        console.log('Table empty. Need another way to find columns. Maybe attempting an insert will reveal it in error messages, or just log nothing for now.');
      }
    }
  }
}
check();
