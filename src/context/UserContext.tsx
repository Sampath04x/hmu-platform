"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AiProfile {
  personalityType: string;
  vibe: string;
  matchStyle: string;
  compatibleWith: string[];
  matchCodename: string;
  icebreaker: string;
  strengths: string[];
  peopleLookingFor: string;
}

interface UserContextType {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  username: string;
  setUsername: (username: string) => void;
  role: 'user' | 'club' | 'founder' | 'super_admin' | 'moderator' | 'junior_moderator';
  setRole: (role: 'user' | 'club' | 'founder' | 'super_admin' | 'moderator' | 'junior_moderator') => void;
  has_completed_personality: boolean;
  setHasCompletedPersonality: (val: boolean) => void;
  user_id: string;
  setUserId: (id: string) => void;
  permissions: any;
  setPermissions: (permissions: any) => void;
  interests: string[];
  setInterests: (interests: string[]) => void;
  aiProfile: AiProfile | null;
  setAiProfile: (profile: AiProfile) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  token: string | null;
  setToken: (val: string | null) => void;
  isAuthLoading: boolean;
  isApproved: boolean;
  setIsApproved: (val: boolean) => void;
  isSuspended: boolean;
  setIsSuspended: (val: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<'user' | 'club' | 'founder' | 'super_admin' | 'moderator' | 'junior_moderator'>('user');
  const [has_completed_personality, setHasCompletedPersonality] = useState(false);
  const [user_id, setUserId] = useState("");
  const [permissions, setPermissions] = useState<any>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);

  // Load from session on mount
  useEffect(() => {

    const checkUser = async (sessionToken: string | null) => {
      if (sessionToken) {
        try {
          const { apiFetch } = await import("@/lib/apiClient");
          const data = await apiFetch("/auth/me");
          if (data && data.user) {
            setIsLoggedIn(true);
            setEmail(data.user.email || "");
            setUserId(data.user.id || "");
            if (data.profile) {
              setName(data.profile.name || "User");
              setUsername(data.profile.username || "");
              setRole(data.profile.role || 'user');
              setPermissions(data.profile.permissions || {});
              setHasCompletedPersonality(data.profile.has_completed_personality || false);
              setIsApproved(data.profile.is_approved || false);
              setIsSuspended(data.profile.is_suspended || false);
              if (data.profile.ai_profile) setAiProfile(data.profile.ai_profile);
            }
          } else {
            setIsLoggedIn(false);
          }
        } catch (e) {
          console.error("Failed to fetch user:", e);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    let subscription: any;
    const initializeAuth = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        const currentToken = session?.access_token || null;
        setToken(currentToken);
        await checkUser(currentToken);

        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            const newToken = newSession?.access_token || null;
            if (event === 'SIGNED_OUT') {
               setToken(null);
               setIsLoggedIn(false);
               return;
            }
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
               setToken(newToken);
               await checkUser(newToken);
            } else if (event === 'TOKEN_REFRESHED') {
               setToken(newToken);
            }
          }
        );
        subscription = authListener.subscription;
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);


  return (
    <UserContext.Provider value={{
      name, setName,
      email, setEmail,
      username, setUsername,
      role, setRole,
      has_completed_personality, setHasCompletedPersonality,
      user_id, setUserId,
      permissions, setPermissions,
      interests, setInterests,
      aiProfile, setAiProfile,
      isLoggedIn, setIsLoggedIn,
      token, setToken,
      isAuthLoading,
      isApproved, setIsApproved,
      isSuspended, setIsSuspended
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
