/**
 * authRouting.ts
 *
 * Centralized post-authentication routing.
 * Every auth entry point (password login, OTP verify, OAuth callback)
 * must call routeAfterAuth() instead of hardcoding /home.
 *
 * Decision tree:
 *
 *   fetch /auth/me (profile)
 *       │
 *       ├── profile exists?
 *       │       ├── YES + admin role  → /admin
 *       │       └── YES + other role  → /home
 *       │
 *       └── profile does NOT exist
 *               ├── admin role hint   → /auth/admin/setup
 *               └── otherwise         → /onboarding
 */

import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiClient";

/** Roles that belong to the admin surface */
const ADMIN_ROLES = ["super_admin", "founder", "moderator", "junior_moderator"] as const;
type AdminRole = typeof ADMIN_ROLES[number];

function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Determines the post-login destination from `public.profiles` and
 * calls `router.replace(destination)`.
 *
 * @param router   The Next.js AppRouter instance (from useRouter()).
 * @param token    Optional: an explicit access token (available right after
 *                 signInWithPassword / verifyOtp). If omitted the function
 *                 reads the active Supabase session automatically.
 */
export async function routeAfterAuth(
  router: { replace: (path: string) => void },
  token?: string | null
): Promise<void> {
  try {
    let accessToken = token ?? null;

    if (!accessToken) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      accessToken = session?.access_token ?? null;
    }

    if (!accessToken) {
      router.replace("/signin");
      return;
    }

    let profileData: any = null;
    try {
      profileData = await apiFetch("/auth/me", { token: accessToken });
    } catch (fetchErr) {
      console.error("[routeAfterAuth] /auth/me fetch failed:", fetchErr);
    }

    const profile = profileData?.profile ?? null;
    const user = profileData?.user ?? null;
    const email = user?.email?.toLowerCase().trim() || "";
    
    // Check if the user is in admin_whitelist
    let isAdminWhitelist = false;
    if (email) {
       const { data: adminData } = await supabase.from('admin_whitelist').select('email').eq('email', email).eq('is_active', true).maybeSingle();
       isAdminWhitelist = !!adminData;
    }

    // Check if it's a club email
    let clubReq = null;
    if (email) {
       const { data: req } = await supabase.from('club_requests').select('status').eq('club_email', email).maybeSingle();
       clubReq = req;
    }

    // Check if user is associated with a Club in public.club_admins or public.clubs
    const userIdToUse = user?.id || profile?.user_id;
    let isClubAdmin = false;
    if (userIdToUse) {
       const { data: clubAdminData } = await supabase
          .from("club_admins")
          .select("club_id")
          .eq("user_id", userIdToUse)
          .maybeSingle();
       isClubAdmin = !!clubAdminData?.club_id;
       if (!isClubAdmin) {
          const { data: directClubData } = await supabase
             .from("clubs")
             .select("club_id")
             .eq("created_by", userIdToUse)
             .maybeSingle();
          isClubAdmin = !!directClubData?.club_id;
       }
    }

    if (!profile) {
      // No profile exists yet
      if (isAdminWhitelist) {
         router.replace("/auth/admin/setup");
      } else if (isClubAdmin) {
         router.replace("/club-dashboard");
      } else if (clubReq) {
         if (clubReq.status === 'approved') {
            router.replace("/auth/club-setup"); 
         } else {
            router.replace("/auth/club-request/submitted");
         }
      } else {
         router.replace("/onboarding");
      }
      return;
    }

    // Profile exists
    const role: string = profile.role ?? "";
    
    if (isAdminRole(role)) {
       // Profile exists, meaning Admin Setup is complete
       router.replace("/admin");
    } else if (role === "club" || isClubAdmin) {
       const isCompletedClub = isClubAdmin || (role === "club" && !!profile.username);
       if (isCompletedClub) {
          router.replace("/club-dashboard");
       } else if (clubReq?.status === 'approved' || profile.is_approved) {
          router.replace("/auth/club-setup");
       } else {
          router.replace("/auth/club-request/submitted");
       }
    } else {
       // Regular User
       // Use department or year_of_study to infer if onboarding is complete
       if (!profile.department && !profile.year_of_study) {
          router.replace("/onboarding");
       } else {
          router.replace("/home");
       }
    }
  } catch (err) {
    console.error("[routeAfterAuth] Unexpected error:", err);
    // Safe fallback
    router.replace("/home");
  }
}
