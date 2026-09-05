import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
console.log("SUPABASE_URL Loaded as:", process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export default supabase;
