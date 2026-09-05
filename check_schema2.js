const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  const url = supabaseUrl + '/rest/v1/?apikey=' + supabaseKey;
  try {
    const res = await fetch(url);
    const spec = await res.json();
    console.log(JSON.stringify(spec.definitions.clubs.properties));
    console.log(JSON.stringify(spec.definitions.club_admins.properties));
    console.log(JSON.stringify(spec.definitions.club_requests.properties));
    console.log(JSON.stringify(spec.definitions.profiles.properties));
  } catch (e) {
    console.log(e);
  }
}
check();
