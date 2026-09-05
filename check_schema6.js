const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  try {
    const res = await fetch(supabaseUrl + '/rest/v1/clubs?limit=1', {
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'return=representation'
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text);
  } catch (e) {
    console.log(e);
  }
}
check();
