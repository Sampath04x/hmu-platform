'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { apiFetch } from '@/lib/apiClient';
import { routeAfterAuth } from '@/lib/authRouting';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setEmail, setIsLoggedIn } = useUser();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
          router.push('/signin');
          return;
        }

        const user = session.user;

        // -----------------------------
        // Allow only GITAM emails
        // -----------------------------
        const email = (user.email || '').toLowerCase();

        const isGitam =
          email.endsWith('@gitam.in') ||
          email.endsWith('@student.gitam.edu');

        let isAdmin = false;
        if (!isGitam) {
          const { data: adminData } = await supabase
            .from('admin_whitelist')
            .select('email')
            .eq('email', email)
            .eq('is_active', true)
            .maybeSingle();
            
          if (adminData) {
            isAdmin = true;
          }
        }

        if (!isGitam && !isAdmin) {
          await supabase.auth.signOut();
          alert('Only GITAM email addresses are allowed.');
          router.replace('/signup');
          return;
        }

        // -----------------------------
        // Save user state
        // -----------------------------
        setEmail(user.email || '');
        setIsLoggedIn(true);

        // -----------------------------
        // Route based on profile role
        // -----------------------------
        await new Promise(resolve => setTimeout(resolve, 1000));
        await routeAfterAuth(router, session.access_token);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        router.push(
          `/signin?error=${encodeURIComponent(
            err.message || 'auth_failed'
          )}`
        );
      }
    };

    handleAuth();
  }, [router, setEmail, setIsLoggedIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-medium">
          Completing secure sign in...
        </p>
      </div>
    </div>
  );
}