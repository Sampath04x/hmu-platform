'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { apiFetch } from '@/lib/apiClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setName, setEmail, setIsLoggedIn } = useUser();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session) {
          router.push('/signin');
          return;
        }

        const user = session.user;
        setEmail(user.email || '');
        setIsLoggedIn(true);

        // Check if profile exists
        try {
          // Add a small delay for Supabase consistency
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const response = await apiFetch(`/auth/me`);
          // response should be { user, profile }
          
          if (response && response.profile && response.profile.username) {
            router.push('/home');
          } else {
            // No profile found, need to create one (Onboarding)
            router.push('/onboarding');
          }
        } catch (profileErr: any) {
          console.log('Profile check failed, likely new user:', profileErr.message);
          // If profile fetch fails (e.g. 401/404), maybe it's a new user needing onboarding
          router.push('/onboarding');
        }

      } catch (err: any) {
        console.error('Auth callback error:', err);
        router.push(`/signin?error=${encodeURIComponent(err.message || 'auth_failed')}`);
      }
    };

    handleAuth();
  }, [router, setEmail, setIsLoggedIn]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground animate-pulse font-medium">Completing secure sign in...</p>
      </div>
    </div>
  );
}
