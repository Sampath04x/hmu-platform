"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  Sparkles,
  Target,
  Users,
  BookOpen,
  Rocket,
  Lightbulb,
  Code,
  Music,
  Palette,
  Camera,
  Gamepad2,
  Dumbbell,
  BookOpenCheck,
  Film,
  Mic2,
  Brain,
  Globe,
  PenTool,
  Coffee,
  Mountain,
  Heart,
  Zap,
  Compass,
  Trophy,
  FlaskConical,
  GraduationCap,
  MessageCircle,
  Check,
} from "lucide-react";

// =========================
// DESIGN TOKENS (matching auth pages)
// =========================
const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 },
};

const stepTransition = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

// =========================
// DATA
// =========================
const PURPOSE_OPTIONS = [
  {
    id: "find-friends",
    title: "Find My People",
    description: "Connect with students who share my vibe",
    icon: Users,
  },
  {
    id: "collaborate",
    title: "Collaborate on Projects",
    description: "Find teammates for hackathons & side-projects",
    icon: Code,
  },
  {
    id: "explore-interests",
    title: "Explore Interests",
    description: "Discover campus clubs, hobbies, and communities",
    icon: Compass,
  },
  {
    id: "mentorship",
    title: "Mentorship & Growth",
    description: "Learn from seniors and mentor juniors",
    icon: GraduationCap,
  },
];

import { INTEREST_TAGS } from "@/constants/interestTags";

const DEPARTMENTS = [
  "CSE",
  "ECE",
  "Mechanical",
  "Civil",
  "EEE",
  "IT",
  "Chemical",
  "Biotech",
  "MBA",
  "Law",
  "Pharmacy",
  "Architecture",
];

const YEARS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Ph.D.",
];

const TOTAL_STEPS = 5;

// =========================
// PAGE
// =========================
export default function OnboardingPage() {
  const router = useRouter();
  const {
    name,
    setName,
    username: contextUsername,
    setUsername: setContextUsername,
    role,
    interests: contextInterests,
    setInterests: setContextInterests,
    aiProfile,
    setIsLoggedIn,
    user_id,
    setProfileImageUrl,
  } = useUser();


  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Step 2: Purpose
  const [selectedPurpose, setSelectedPurpose] = useState<string[]>([]);

  // Step 3: Interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    contextInterests || []
  );

  // Step 4: Profile
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  // useState(name || ""); // Pre-fills with their name if available
  const [displayName, setDisplayName] = useState(name || "");
  const [username, setUsername] = useState(contextUsername || "");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  // General
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fromSignup, setFromSignup] = useState(false);

  const isProfileValid = Boolean(
    displayName.trim() &&
    username.trim() &&
    department &&
    year &&
    gender
  );

  // Role Safety: Redirect Club Admins to Club Dashboard
  useEffect(() => {
    if (role === "club") {
      router.replace("/club-dashboard");
    }
  }, [role, router]);

  // Restore step from session
  useEffect(() => {
    const saved = sessionStorage.getItem("onboarding_step");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= TOTAL_STEPS) {
        setStep(parsed);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem("onboarding_step", step.toString());
  }, [step]);

  // Sync interests back to context
  useEffect(() => {
    setContextInterests(selectedInterests);
  }, [selectedInterests, setContextInterests]);

  // Sync username back to context
  useEffect(() => {
    const pendingProfile = sessionStorage.getItem("intrst_pending_profile");

    if (pendingProfile) {
      try {
        const data = JSON.parse(pendingProfile);
        if (data.name) setDisplayName(data.name);
        if (data.username) setUsername(data.username);
        setFromSignup(true); // lock fields since data came from signup
      } catch (e) {
        // ignore parse errors
      }
    }
  }, []);

  // Keep this ONLY if you're going to use Supabase avatar upload later
  const [previewUrl, setPreviewUrl] = useState<string>("");
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const togglePurpose = (id: string) => {
    setSelectedPurpose((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length < 10) return [...prev, tag];
      return prev;
    });
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (!user_id) {
        throw new Error("User session not found in context. Please refresh and try again.");
      }

      let avatarUrl = "";

      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const fileName = `${user_id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, profileImage);
        console.log("Upload done, uploadError =", uploadError);
        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
        console.log("avatarUrl =", avatarUrl);
      }

      let parsedYear = parseInt(year);
      if (isNaN(parsedYear)) parsedYear = 6;

      // const bio = "";

      const payload: Record<string, unknown> = {
        username: username || undefined,
        name: displayName || name,
        gender,
        bio,
        department,
        year_of_study: parsedYear,
        interests: selectedInterests,
        purposes: selectedPurpose,
      };

      if (avatarUrl) {
        payload.profile_image_url = avatarUrl;
      }

      console.log("About to call apiFetch...");
      console.log("user_id =", user_id);
      console.log("api url =", `/profiles/${user_id}`);
      await apiFetch(`/profiles/${user_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      sessionStorage.removeItem("onboarding_step");
      sessionStorage.removeItem("privacy_settings");
      if (displayName) {
        setName(displayName);
      }
      if (avatarUrl) {
        setProfileImageUrl(avatarUrl);
      }
      console.log("apiFetch done, redirecting...");
      setIsLoggedIn(true);
      router.push("/home");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile";
      setErrorMsg(message);
      setIsLoading(false);
    }
  };

  // =========================
  // PROGRESS BAR
  // =========================
  const progressPercent = (step / TOTAL_STEPS) * 100;

  const stepLabels = ["Welcome", "Purpose", "Interests", "Details", "Ready"];

  return (
    <main
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 md:p-6"
      style={{ backgroundColor: "#faf9f6", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(80,95,120,0.06), transparent);
          background-size: 200% 100%;
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float-anim {
          animation: float 3.5s ease-in-out infinite;
        }
        @keyframes confetti-pop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .confetti-pop {
          animation: confetti-pop 0.5s ease-out forwards;
        }
      `}</style>

      {/* Background Glow Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[-20%] top-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30" />
        <div className="absolute right-[-20%] bottom-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30" />
        <div className="absolute top-[50%] left-[30%] w-[300px] h-[300px] rounded-full bg-[#dfe8f0] blur-[100px] opacity-20" />
      </div>

      {/* Main Card Container */}
      <div className="w-full max-w-[520px] relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2.5 mb-6"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">
              i
            </div>
            <span className="text-lg font-bold tracking-tight text-[#0f0f10]">
              intrst
            </span>
          </Link>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          {/* Step Labels */}
          <div className="flex items-center justify-between mb-3 px-1">
            {stepLabels.map((label, i) => {
              const stepNum = i + 1;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${isCompleted
                      ? "bg-black text-white"
                      : isActive
                        ? "bg-[#505f78] text-white shadow-[0_0_12px_rgba(80,95,120,0.3)]"
                        : "bg-[#f0edee] text-neutral-400"
                      }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-bold tracking-wider uppercase hidden sm:block transition-colors duration-300 ${isActive
                      ? "text-[#505f78]"
                      : isCompleted
                        ? "text-neutral-600"
                        : "text-neutral-300"
                      }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-[#f0edee] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #505f78, #6b7a94, #505f78)",
              }}
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>

          {/* Step Counter */}
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] font-bold text-neutral-400 tracking-wide">
              Step {step} of {TOTAL_STEPS}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 tracking-wide">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200/60 rounded-xl text-red-600 text-xs text-center font-medium"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.04)] rounded-[28px] p-6 md:p-8 relative overflow-hidden">
          {/* Subtle shimmer overlay */}
          <div className="absolute inset-0 shimmer-bg pointer-events-none rounded-[28px]" />

          <AnimatePresence mode="wait" custom={direction}>
            {/* ============================
                STEP 1 — WELCOME
            ============================ */}
            {step === 1 && (
              <motion.div
                key="step-1"
                {...stepTransition}
                className="relative z-10"
              >
                <div className="text-center mb-8">

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f0f10] mb-2">
                    Welcome to{" "}
                    <span className="bg-gradient-to-r from-[#505f78] to-[#855300] bg-clip-text text-transparent font-serif italic font-normal">
                      intrst
                    </span>
                  </h1>

                  <p className="text-neutral-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                    Let&apos;s get you set up in just a few steps. We&apos;ll help you
                    find your people and build genuine campus connections.
                  </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  {[
                    {
                      icon: Target,
                      title: "Find Your Vibe",
                      desc: "AI-powered matching",
                    },
                    {
                      icon: Users,
                      title: "Real People",
                      desc: "Verified students only",
                    },
                    {
                      icon: Sparkles,
                      title: "Niche Hubs",
                      desc: "40+ campus communities",
                    },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="text-center p-4 rounded-2xl bg-[#faf9f6] border border-black/[0.04] hover:shadow-sm transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#ece9e3] flex items-center justify-center mx-auto mb-2.5">
                        <item.icon className="w-4.5 h-4.5 text-[#505f78]" />
                      </div>
                      <h3 className="text-xs font-bold text-[#0f0f10] mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-neutral-400">
                        {item.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* CTA */}
                <motion.div {...buttonClickInteraction}>
                  <button
                    type="button"
                    onClick={goNext}
                    className="w-full h-12 rounded-full text-xs font-bold bg-black text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    Let&apos;s Go <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>

                <p className="text-center text-[10px] text-neutral-400 mt-4 tracking-wide">
                  Takes less than 2 minutes
                </p>
              </motion.div>
            )}

            {/* ============================
                STEP 2 — PURPOSE
            ============================ */}
            {step === 2 && (
              <motion.div
                key="step-2"
                {...stepTransition}
                className="relative z-10"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f0f10] mb-1">
                    What brings you{" "}
                    <span className="font-serif italic font-normal text-[#505f78]">
                      here?
                    </span>
                  </h2>
                  <p className="text-neutral-400 text-xs font-medium leading-relaxed">
                    Select all that apply — this helps us personalize your
                    experience.
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  {PURPOSE_OPTIONS.map((option, i) => {
                    const isSelected = selectedPurpose.includes(option.id);
                    const IconComp = option.icon;
                    return (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => togglePurpose(option.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 group ${isSelected
                          ? "bg-[#505f78]/[0.06] border-[#505f78]/30 shadow-[0_0_16px_rgba(80,95,120,0.08)]"
                          : "bg-[#faf9f6] border-black/[0.04] hover:border-[#505f78]/20 hover:bg-[#f5f3ef]"
                          }`}
                      >
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? "bg-[#505f78] text-white"
                            : "bg-[#ece9e3] text-[#505f78] group-hover:bg-[#e3e0d8]"
                            }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#0f0f10]">
                            {option.title}
                          </h3>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected
                            ? "bg-black border-black"
                            : "border-neutral-300"
                            }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Buttons */}
                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.div {...buttonClickInteraction} className="shrink-0">
                    <button
                      onClick={goBack}
                      className="h-12 w-12 rounded-full border border-black/10 bg-white text-[#0f0f10] hover:bg-[#f3f1eb] transition-all flex items-center justify-center shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </motion.div>
                  <motion.div {...buttonClickInteraction} className="flex-1">
                    <button
                      onClick={goNext}
                      disabled={selectedPurpose.length === 0}
                      className="w-full h-12 rounded-full text-xs font-bold bg-black text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ============================
                STEP 3 — INTERESTS
            ============================ */}
            {step === 3 && (
              <motion.div
                key="step-3"
                {...stepTransition}
                className="relative z-10"
              >
                <div className="text-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f0f10] mb-1">
                    What are you{" "}
                    <span className="font-serif italic font-normal text-[#505f78]">
                      into?
                    </span>
                  </h2>
                  <p className="text-neutral-400 text-xs font-medium leading-relaxed">
                    Pick up to 10 interests that define your vibe.{" "}
                    <span className="text-[#505f78] font-bold">
                      {selectedInterests.length}/10
                    </span>
                  </p>
                </div>

                {/* Interest Chips */}
                <div className="flex flex-wrap gap-2 mb-6 max-h-[320px] overflow-y-auto pr-1 hide-scrollbar">
                  {INTEREST_TAGS.map((item, i) => {
                    const isSelected = selectedInterests.includes(item.tag);
                    const IconComp = item.icon;
                    return (
                      <motion.button
                        key={item.tag}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => toggleInterest(item.tag)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border transition-all duration-200 ${isSelected
                          ? "bg-black text-white border-black shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                          : "bg-white text-neutral-700 border-neutral-200/80 hover:border-[#505f78]/30 hover:bg-[#faf9f6]"
                          }`}
                      >
                        <IconComp
                          className={`w-3.5 h-3.5 ${isSelected ? "text-white/80" : "text-neutral-400"
                            }`}
                        />
                        {item.tag}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.div {...buttonClickInteraction} className="shrink-0">
                    <button
                      onClick={goBack}
                      className="h-12 w-12 rounded-full border border-black/10 bg-white text-[#0f0f10] hover:bg-[#f3f1eb] transition-all flex items-center justify-center shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </motion.div>
                  <motion.div {...buttonClickInteraction} className="flex-1">
                    <button
                      onClick={goNext}
                      disabled={selectedInterests.length === 0}
                      className="w-full h-12 rounded-full text-xs font-bold bg-black text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue ({selectedInterests.length} selected){" "}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
            {/* ============================
                STEP 4 — PROFILE DETAILS
            ============================ */}
            {step === 4 && (
              <motion.div
                key="step-4"
                {...stepTransition}
                className="relative z-10"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f0f10] mb-1">
                    Almost{" "}
                    <span className="font-serif italic font-normal text-[#505f78]">
                      there
                    </span>
                  </h2>
                  <p className="text-neutral-400 text-xs font-medium leading-relaxed">
                    A few optional details to improve your matches.
                  </p>
                </div>

                {/* Form fields wrapper container */}
                <div className="space-y-4 mb-6">
                  {/* Profile Image Upload */}
                  <div className="flex flex-col items-center justify-center mb-4">
                    <label className="cursor-pointer group relative flex flex-col items-center justify-center w-24 h-24 rounded-full border border-black/10 bg-white hover:bg-[#f3f1eb] transition-all shadow-sm">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && typeof setProfileImage === 'function') {
                            setProfileImage(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <>
                          <svg className="w-5 h-5 text-neutral-400 mb-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-[9px] font-bold tracking-wider uppercase text-neutral-400">Upload</span>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Display Name
                      {fromSignup && (
                        <span className="ml-2 text-[#505f78] normal-case tracking-normal font-normal text-[9px]">
                          · set during signup
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => !fromSignup && setDisplayName(e.target.value)}
                      readOnly={fromSignup}
                      placeholder="e.g. Priya S."
                      className={`w-full h-11 border rounded-xl px-3.5 text-xs outline-none transition-all font-medium ${fromSignup
                        ? "bg-neutral-50 border-neutral-200 text-neutral-500 cursor-not-allowed"
                        : "bg-white border-[#c5c6cd] focus:border-black focus:ring-1 focus:ring-black text-neutral-900"
                        }`}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Username
                      {fromSignup && (
                        <span className="ml-2 text-[#505f78] normal-case tracking-normal font-normal text-[9px]">
                          · set during signup
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => !fromSignup && setUsername(e.target.value)}
                      readOnly={fromSignup}
                      placeholder="@ unique_username"
                      className={`w-full h-11 border rounded-xl px-3.5 text-xs outline-none transition-all font-medium ${fromSignup
                        ? "bg-neutral-50 border-neutral-200 text-neutral-500 cursor-not-allowed"
                        : "bg-white border-[#c5c6cd] focus:border-black focus:ring-1 focus:ring-black text-neutral-900"
                        }`}
                    />
                    {!fromSignup && (
                      <p className="text-[10px] text-neutral-400 mt-1.5 pl-1">
                        Letters, numbers, and underscores only.
                      </p>
                    )}
                  </div>

                  {/* Department Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Department
                    </label>
                    <select
                      value={department || ''}
                      onChange={(e) => setDepartment && setDepartment(e.target.value)}
                      className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 font-medium bg-white cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                    >
                      <option value="" disabled hidden>Select Department</option>
                      {DEPARTMENTS && DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Year of Study
                    </label>
                    <select
                      value={year || ''}
                      onChange={(e) => setYear && setYear(e.target.value)}
                      className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 font-medium bg-white cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                    >
                      <option value="" disabled hidden>Select Year</option>
                      {YEARS && YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender || ""}
                      onChange={(e) => setGender && setGender(e.target.value)}
                      className="w-full h-11 border border-[#c5c6cd] rounded-xl px-3.5 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 font-medium bg-white cursor-pointer appearance-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 14px center",
                      }}
                    >
                      <option value="" disabled hidden>Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Prefer Not To Say">Prefer Not To Say</option>
                    </select>
                  </div>
                </div>

                {/* Bio Input */}
                <div>
                  <label className="block text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-1.5">
                    Bio (Optional)
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={200}
                    placeholder="What's your vibe?"
                    className="w-full min-h-[90px] border border-[#c5c6cd] rounded-xl px-3.5 py-3 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black transition-all text-neutral-900 font-medium bg-white resize-none"
                  />

                  <p className="text-[10px] text-neutral-400 mt-1">
                    {bio.length}/200
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <motion.div {...buttonClickInteraction} className="shrink-0">
                    <button
                      type="button"
                      onClick={goBack}
                      className="h-12 w-12 rounded-full border border-black/10 bg-white text-[#0f0f10] hover:bg-[#f3f1eb] transition-all flex items-center justify-center shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </motion.div>
                  <motion.div {...buttonClickInteraction} className="flex-1">
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={!isProfileValid}
                      className="w-full h-12 rounded-full text-xs font-bold bg-black text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ============================
                STEP 5 — CONFIRMATION
            ============================ */}
            {step === 5 && (
              <motion.div
                key="step-5"
                {...stepTransition}
                className="relative z-10"
              >
                <div className="text-center mb-6">


                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0f0f10] mb-1">
                    You&apos;re all{" "}
                    <span className="bg-gradient-to-r from-[#505f78] to-[#855300] bg-clip-text text-transparent font-serif italic font-normal">
                      set!
                    </span>
                  </h2>

                  <p className="text-neutral-400 text-xs font-medium leading-relaxed max-w-xs mx-auto">
                    Your profile is ready. Time to discover your campus tribe
                    and make real connections.
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="space-y-3 mb-6">
                  {/* Purpose Summary */}
                  {selectedPurpose.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="p-4 rounded-2xl bg-[#faf9f6] border border-black/[0.04]"
                    >
                      <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">
                        Your Goals
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPurpose.map((id) => {
                          const found = PURPOSE_OPTIONS.find(
                            (p) => p.id === id
                          );
                          return found ? (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#505f78]/[0.08] text-[10px] font-bold text-[#505f78]"
                            >
                              <Check className="w-2.5 h-2.5" /> {found.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Interests Summary */}
                  {selectedInterests.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="p-4 rounded-2xl bg-[#faf9f6] border border-black/[0.04]"
                    >
                      <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">
                        Your Interests
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedInterests.slice(0, 8).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-1 rounded-full bg-black text-white text-[10px] font-bold"
                          >
                            {tag}
                          </span>
                        ))}
                        {selectedInterests.length > 8 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ece9e3] text-[10px] font-bold text-neutral-600">
                            +{selectedInterests.length - 8} more
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Profile Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl bg-[#faf9f6] border border-black/[0.04]"
                  >
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-400 mb-2">
                      Profile
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#505f78]/20 to-[#855300]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#505f78]">
                          {(displayName || name)?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0f0f10]">
                          {displayName || name || "Student"}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {department} · {year}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <motion.div {...buttonClickInteraction} className="shrink-0">
                    <button
                      onClick={goBack}
                      className="h-12 w-12 rounded-full border border-black/10 bg-white text-[#0f0f10] hover:bg-[#f3f1eb] transition-all flex items-center justify-center shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </motion.div>
                  <motion.div {...buttonClickInteraction} className="flex-1">
                    <button
                      onClick={handleFinish}
                      disabled={isLoading}
                      className="w-full h-12 rounded-full text-xs font-bold bg-black text-white transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Setting up...
                        </>
                      ) : (
                        <>
                          Get Started <ArrowUpRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>
    </main>
  );
}