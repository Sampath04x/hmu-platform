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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'user' | 'club' | 'founder' | 'super_admin' | 'moderator' | 'junior_moderator'>('user');
  const [has_completed_personality, setHasCompletedPersonality] = useState(false);
  const [user_id, setUserId] = useState("");
  const [permissions, setPermissions] = useState<any>({});
  const [interests, setInterests] = useState<string[]>([]);
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedInterests = localStorage.getItem("intrst_interests");
    const savedAiProfile = localStorage.getItem("intrst_ai_profile");
    
    if (savedInterests) setInterests(JSON.parse(savedInterests));
    if (savedAiProfile) setAiProfile(JSON.parse(savedAiProfile));

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
              setRole(data.profile.role || 'user');
              setPermissions(data.profile.permissions || {});
              setHasCompletedPersonality(data.profile.has_completed_personality || false);
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
            setToken(newToken);
            if (newToken !== currentToken) {
               await checkUser(newToken);
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

  // Save to localStorage on change
  useEffect(() => {
    if (interests.length > 0) localStorage.setItem("intrst_interests", JSON.stringify(interests));
    if (aiProfile) localStorage.setItem("intrst_ai_profile", JSON.stringify(aiProfile));
  }, [interests, aiProfile]);

  return (
    <UserContext.Provider value={{
      name, setName,
      email, setEmail,
      role, setRole,
      has_completed_personality, setHasCompletedPersonality,
      user_id, setUserId,
      permissions, setPermissions,
      interests, setInterests,
      aiProfile, setAiProfile,
      isLoggedIn, setIsLoggedIn,
      token, setToken,
      isAuthLoading
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
