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
  interests: string[];
  setInterests: (interests: string[]) => void;
  aiProfile: AiProfile | null;
  setAiProfile: (profile: AiProfile) => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState("Priya Sharma");
  const [email, setEmail] = useState("priya@bits-pilani.ac.in");
  const [interests, setInterests] = useState<string[]>(["Photography", "Coding", "Music", "Startups", "Film"]);
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("hmu_name");
    const savedEmail = localStorage.getItem("hmu_email");
    const savedInterests = localStorage.getItem("hmu_interests");
    const savedAiProfile = localStorage.getItem("hmu_ai_profile");
    const savedIsLoggedIn = localStorage.getItem("hmu_is_logged_in");

    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
    if (savedInterests) setInterests(JSON.parse(savedInterests));
    if (savedAiProfile) setAiProfile(JSON.parse(savedAiProfile));
    if (savedIsLoggedIn) setIsLoggedIn(savedIsLoggedIn === "true");
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("hmu_name", name);
    localStorage.setItem("hmu_email", email);
    localStorage.setItem("hmu_interests", JSON.stringify(interests));
    if (aiProfile) localStorage.setItem("hmu_ai_profile", JSON.stringify(aiProfile));
    localStorage.setItem("hmu_is_logged_in", isLoggedIn.toString());
  }, [name, email, interests, aiProfile, isLoggedIn]);

  return (
    <UserContext.Provider value={{
      name, setName,
      email, setEmail,
      interests, setInterests,
      aiProfile, setAiProfile,
      isLoggedIn, setIsLoggedIn
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
