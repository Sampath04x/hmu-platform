const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: '.env.local'});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function check() {
  const url = supabaseUrl + '/rest/v1/?apikey=' + supabaseKey;
  try {
    const res = await fetch(url);
    const spec = await res.json();
    console.log("Keys:", Object.keys(spec));
    if (spec.components && spec.components.schemas) {
      console.log('Clubs:', spec.components.schemas.clubs?.properties ? Object.keys(spec.components.schemas.clubs.properties) : 'not found');
      console.log('Club Admins:', spec.components.schemas.club_admins?.properties ? Object.keys(spec.components.schemas.club_admins.properties) : 'not found');
      console.log('Club Members:', spec.components.schemas.club_members?.properties ? Object.keys(spec.components.schemas.club_members.properties) : 'not found');
    } else if (spec.definitions) {
      console.log('Clubs:', spec.definitions.clubs?.properties ? Object.keys(spec.definitions.clubs.properties) : 'not found');
      console.log('Club Admins:', spec.definitions.club_admins?.properties ? Object.keys(spec.definitions.club_admins.properties) : 'not found');
    }
  } catch (e) {
    console.log(e);
  }
}
check();
