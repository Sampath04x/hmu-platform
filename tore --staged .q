[35mbackend/.env.example[m[36m:[mSUPABASE_URL=https://uxbndxymxrzvhlxgvqyn.[1;31msupabase[m.co/rest/v1/
[35mbackend/config/supabase.js[m[36m:[mimport { createClient } from "@[1;31msupabase[m/[1;31msupabase[m-js";
[35mbackend/config/supabase.js[m[36m:[mconst [1;31msupabase[m = createClient(
[35mbackend/config/supabase.js[m[36m:[mexport default [1;31msupabase[m;
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/[1;31msupabase[m-js": "^2.99.1",
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/auth-js": {
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/functions-js": {
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/postgrest-js": {
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/realtime-js": {
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/storage-js": {
[35mbackend/package-lock.json[m[36m:[m    "node_modules/@[1;31msupabase[m/[1;31msupabase[m-js": {
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/auth-js": "2.99.1",
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/functions-js": "2.99.1",
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/postgrest-js": "2.99.1",
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/realtime-js": "2.99.1",
[35mbackend/package-lock.json[m[36m:[m        "@[1;31msupabase[m/storage-js": "2.99.1"
[35mbackend/package.json[m[36m:[m    "@[1;31msupabase[m/[1;31msupabase[m-js": "^2.99.1",
[35mbackend/routes/admin.js[m[36m:[mimport [1;31msupabase[m from "../config/[1;31msupabase[m.js";
[35mbackend/routes/admin.js[m[36m:[m      const { data, error } = await [1;31msupabase[m.auth.getUser(token);
[35mbackend/routes/admin.js[m[36m:[m      const { data: profile } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { count: userCount } = await [1;31msupabase[m.from("profiles").select("*", { count: "exact", head: true });
[35mbackend/routes/admin.js[m[36m:[m    const { count: pendingCount } = await [1;31msupabase[m.from("profiles").select("*", { count: "exact", head: true }).eq("is_approved", false);
[35mbackend/routes/admin.js[m[36m:[m    const { count: canteenCount } = await [1;31msupabase[m.from("canteens").select("*", { count: "exact", head: true });
[35mbackend/routes/admin.js[m[36m:[m    const { count: reportedPlaybook } = await [1;31msupabase[m.from("reports").select("*", { count: "exact", head: true });
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m      const { data: userData } = await [1;31msupabase[m.auth.admin.getUserById(userId);
[35mbackend/routes/admin.js[m[36m:[m    const { error: deleteError } = await [1;31msupabase[m.auth.admin.deleteUser(userId);
[35mbackend/routes/admin.js[m[36m:[m    await [1;31msupabase[m.from("profiles").delete().eq("user_id", userId);
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { error: authError } = await [1;31msupabase[m.auth.admin.deleteUser(userId);
[35mbackend/routes/admin.js[m[36m:[m    await [1;31msupabase[m.from("profiles").delete().eq("user_id", userId);
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { error } = await [1;31msupabase[m.from("canteens").delete().eq("id", id);
[35mbackend/routes/admin.js[m[36m:[m      const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m.rpc('increment_warning', { user_id_param: userId });
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    const { data: request, error: fetchErr } = await [1;31msupabase[m
[35mbackend/routes/admin.js[m[36m:[m    await [1;31msupabase[m.from("club_requests").update({ status: "approved" }).eq("id", id);
[35mbackend/routes/admin.js[m[36m:[m    await [1;31msupabase[m.from("club_requests").update({ status: "rejected" }).eq("id", id);
[35mbackend/routes/admin.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[mimport [1;31msupabase[m from "../config/[1;31msupabase[m.js";
[35mbackend/routes/auth.js[m[36m:[m    const { data: profile, error: profileError } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[m      const { data: existingInterests } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[m        const { data: newInterests } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[m        await [1;31msupabase[m.from('user_interests').insert(userInterests);
[35mbackend/routes/auth.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[m    const { data: { user }, error: authErr } = await [1;31msupabase[m.auth.getUser(token);
[35mbackend/routes/auth.js[m[36m:[m    const { data: profile } = await [1;31msupabase[m
[35mbackend/routes/auth.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[mimport [1;31msupabase[m from "../config/[1;31msupabase[m.js";
[35mbackend/routes/canteens.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[m    const { data: profile, error: profileError } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[m    const { data: review, error: fetchError } = await [1;31msupabase[m
[35mbackend/routes/canteens.js[m[36m:[m      const { data: profile } = await [1;31msupabase[m.from('profiles').select('role').eq('user_id', userId).single();
[35mbackend/routes/canteens.js[m[36m:[m    const { error: deleteError } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[mimport [1;31msupabase[m from "../config/[1;31msupabase[m.js";
[35mbackend/routes/classrooms.js[m[36m:[m    const { data, error } = await [1;31msupabase[m.auth.getUser(token);
[35mbackend/routes/classrooms.js[m[36m:[m    const { data: profile } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    const { data: profile } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    const { data, error } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    let query = [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    const { data: profile } = await [1;31msupabase[m
[35mbackend/routes/classrooms.js[m[36m:[m    const { data: report, error: reportError } = await [1;31msupabase[m
[35mbackend/routes/