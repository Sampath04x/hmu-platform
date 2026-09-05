const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('clubs').insert([{ dummy: 1 }]);
  console.log('clubs error:', error);
  
  const { data: data2, error: error2 } = await supabase.from('club_admins').insert([{ dummy: 1 }]);
  console.log('club_admins error:', error2);
}
check();
