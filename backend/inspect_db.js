import supabase from './config/supabase.js';

async function test() {
  console.log("Querying database schema...");
  const tablesToInspect = [
    'profiles',
    'events',
    'classrooms',
    'classroom_reports',
    'classroom_votes',
    'classroom_timetables',
    'reports',
    'professor_reviews',
    'audit_log',
    'club_requests',
    'club_admins'
  ];
  
  for (const table of tablesToInspect) {
    try {
      // Fetch 1 row, but also try to get columns by specifying a non-existent column or just checking keys
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table ${table} query error: ${error.message} (code: ${error.code})`);
      } else {
        console.log(`Table ${table} exists. Columns:`, data.length > 0 ? Object.keys(data[0]) : "(empty table)");
      }
    } catch (e) {
      console.log(`Table ${table} exception:`, e.message);
    }
  }
}

test();
