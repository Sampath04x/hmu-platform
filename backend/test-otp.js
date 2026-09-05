import supabase from "./config/supabase.js";

async function run() {
  const email = "testclub_vsp@gitam.in";
  
  // 1. Ensure user does not exist
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
      console.error("List users error:", listError);
      return;
  }
  const existing = users.users.find(u => u.email === email);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
    console.log("Deleted existing test user.");
  }

  console.log("Sending OTP to:", email);
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    console.error("Error sending OTP:", error);
    return;
  }
  
  console.log("OTP Sent.");
  
  // 2. Check if user is created immediately after sending OTP
  const { data: usersAfter } = await supabase.auth.admin.listUsers();
  const created = usersAfter.users.find(u => u.email === email);
  if (created) {
    console.log("User WAS created during OTP generation. ID:", created.id);
  } else {
    console.log("User WAS NOT created during OTP generation.");
  }
}

run();
