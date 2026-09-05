"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, ArrowLeft, Upload, CheckCircle2, ShieldCheck, Globe, Share2, Link as LinkIcon, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiClient";
import { useUser } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";

const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 }
};

const CATEGORY_OPTIONS = [
  "Technical",
  "Cultural",
  "Sports",
  "Social & Service",
  "Academic & Research",
  "Media & Arts",
  "Literary",
  "General"
];

export default function ClubSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user_id, email: userEmail, setIsLoggedIn, setRole } = useUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingRequest, setFetchingRequest] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Logo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Username validation state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    category: "General",
    description: "",
    instagram: "",
    linkedin: "",
    website: "",
    other_links: ""
  });

  const [alreadyHasAccount, setAlreadyHasAccount] = useState(false);

  // Verify session & pre-fill from club request
  useEffect(() => {
    async function loadInitialData() {
      try {
        setFetchingRequest(true);
        setError(null);
        const { data: { session } } = await supabase.auth.getSession();
        let tokenEmail: string | null = null;

        // Verify setup token if present in URL params
        if (token) {
          try {
            const parts = token.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && Date.now() >= payload.exp * 1000) {
                setError("Setup link is invalid or has expired. Please request a new link.");
                setFetchingRequest(false);
                return;
              }
              if (payload.purpose && payload.purpose !== "club-setup") {
                setError("Invalid setup link.");
                setFetchingRequest(false);
                return;
              }
              if (payload.email) {
                tokenEmail = payload.email.toLowerCase().trim();
              }
            } else {
              setError("Invalid setup link format.");
              setFetchingRequest(false);
              return;
            }
          } catch {
            setError("Invalid setup link.");
            setFetchingRequest(false);
            return;
          }
        }

        // Check if token email belongs to an already completed club account
        if (tokenEmail) {
          const { data: profileByTokenEmail } = await supabase
            .from("profiles")
            .select("role, username")
            .eq("email", tokenEmail)
            .maybeSingle();

          if (profileByTokenEmail && profileByTokenEmail.role === "club" && profileByTokenEmail.username) {
            setAlreadyHasAccount(true);
            setFetchingRequest(false);
            return;
          }
        }

        if (!session?.user) {
          toast.error("No active authentication session. Please verify OTP or sign in.");
          router.push("/auth/club-request");
          return;
        }

        const emailToUse = session.user.email || userEmail || tokenEmail;
        const currentUid = session.user.id;

        // Check whether authenticated user is already associated with an existing completed club account/profile
        const [adminRes, directClubRes, profileRes, profileByEmailRes] = await Promise.all([
          supabase.from("club_admins").select("club_id").eq("user_id", currentUid).maybeSingle(),
          supabase.from("clubs").select("club_id").eq("created_by", currentUid).maybeSingle(),
          supabase.from("profiles").select("role, username").eq("user_id", currentUid).maybeSingle(),
          emailToUse ? supabase.from("profiles").select("role, username").eq("email", emailToUse.toLowerCase().trim()).maybeSingle() : Promise.resolve({ data: null })
        ]);

        const isClubAdmin = !!adminRes.data?.club_id;
        const isClubCreator = !!directClubRes.data?.club_id;
        const isCompletedProfile = !!(profileRes.data && profileRes.data.role === "club" && profileRes.data.username);
        const isCompletedByEmail = !!(profileByEmailRes.data && profileByEmailRes.data.role === "club" && profileByEmailRes.data.username);

        if (isClubAdmin || isClubCreator || isCompletedProfile || isCompletedByEmail) {
          setAlreadyHasAccount(true);
          setFetchingRequest(false);
          return;
        }

        if (emailToUse) {
          const { data: req } = await supabase
            .from("club_requests")
            .select("*")
            .eq("club_email", emailToUse.toLowerCase().trim())
            .maybeSingle();

          if (req) {
            if (req.status !== "approved") {
              setError("Forbidden: Club request is not approved.");
              setFetchingRequest(false);
              return;
            }

            setFormData(prev => ({
              ...prev,
              name: req.club_name || "",
              category: req.category || "General",
              description: req.description || ""
            }));

            // Auto-generate candidate username from club name
            if (req.club_name) {
              const suggested = req.club_name.toLowerCase().replace(/[^a-z0-9]/g, "");
              setFormData(prev => ({ ...prev, username: suggested }));
              checkUsername(suggested);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load club request details:", err);
      } finally {
        setFetchingRequest(false);
      }
    }

    loadInitialData();
  }, [router, userEmail, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "username") {
      setUsernameAvailable(null);
      if (value.trim().length >= 3) {
        checkUsername(value.trim());
      }
    }
  };

  const checkUsername = async (un: string) => {
    if (!un || un.length < 3) return;
    setUsernameChecking(true);
    try {
      const res = await apiFetch(`/auth/check-username/${encodeURIComponent(un)}`);
      setUsernameAvailable(res.available);
    } catch {
      setUsernameAvailable(true);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo image must be under 5MB.");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setError(null);
  };

  const uploadLogo = async (uid: string): Promise<string | null> => {
    if (!logoFile) return logoPreview;
    try {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `club-logos/${uid}-${Date.now()}.${ext}`;

      // Try 'avatar' bucket first, fallback to 'avatars'
      let uploadRes = await supabase.storage.from("avatar").upload(path, logoFile, { upsert: true });
      let bucketUsed = "avatar";

      if (uploadRes.error) {
        uploadRes = await supabase.storage.from("avatars").upload(path, logoFile, { upsert: true });
        bucketUsed = "avatars";
      }

      if (uploadRes.error) {
        console.error("Upload error:", uploadRes.error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage.from(bucketUsed).getPublicUrl(path);
      return publicUrlData.publicUrl;
    } catch (e) {
      console.error("Logo upload failed:", e);
      return null;
    }
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Club display name is required.");
        return false;
      }
      if (!formData.username.trim()) {
        setError("Club handle (username) is required.");
        return false;
      }
      if (formData.username.length < 3) {
        setError("Club handle must be at least 3 characters.");
        return false;
      }
      if (usernameAvailable === false) {
        setError("This club handle is already taken. Please choose another.");
        return false;
      }
    } else if (step === 2) {
      if (!formData.description.trim()) {
        setError("A short description of the club is required.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("Session expired. Please verify OTP again.");
      }

      const currentUid = session.user.id;
      const uploadedLogoUrl = await uploadLogo(currentUid);

      const payload = {
        user_id: currentUid,
        email: session.user.email,
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        category: formData.category,
        description: formData.description.trim(),
        logo_url: uploadedLogoUrl || "",
        profile_image_url: uploadedLogoUrl || "",
        social_links: {
          instagram: formData.instagram.trim(),
          linkedin: formData.linkedin.trim(),
          website: formData.website.trim(),
          other: formData.other_links.trim()
        },
        instagram: formData.instagram.trim(),
        linkedin: formData.linkedin.trim(),
        website: formData.website.trim(),
        other_links: formData.other_links.trim()
      };

      const resData = await apiFetch("/auth/initialize-profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (resData) {
        toast.success("Club setup completed successfully!");
        setIsLoggedIn(true);
        setRole("club");
        router.push("/club-dashboard");
      }
    } catch (err: any) {
      console.error("Club setup submission error:", err);
      if (err.message?.includes("already have a club account") || err.alreadyExists) {
        setAlreadyHasAccount(true);
      } else {
        setError(err.message || "An error occurred during club setup. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRequest) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-6 bg-[#faf9f6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-black" />
          <p className="text-xs font-semibold text-neutral-500">Loading Club Details...</p>
        </div>
      </main>
    );
  }

  if (alreadyHasAccount) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#faf9f6]">
        {/* Background Decor */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
          <div className="absolute -right-40 bottom-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        </div>

        <Card className="w-full max-w-[540px] border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-[32px] bg-white relative z-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-[#0f0f10]">
              You already have a club account.
            </CardTitle>

            <CardDescription className="text-xs font-medium text-neutral-500 max-w-md leading-relaxed">
              Your club profile has already been set up. Please sign in to continue.
            </CardDescription>

            <div className="pt-4 w-full">
              <Button
                type="button"
                onClick={() => router.push("/signin")}
                className="w-full bg-black hover:bg-[#505f78] text-white font-bold h-12 rounded-full transition-all text-xs flex items-center justify-center gap-2 shadow-md"
              >
                Sign In <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#faf9f6]">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute -right-40 bottom-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
      </div>

      <Card className="w-full max-w-[540px] border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.03)] p-6 sm:p-8 rounded-[32px] bg-white relative z-10">
        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 mb-2">
            <span>STEP {currentStep} OF 4</span>
            <span className="font-mono">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        <CardHeader className="p-0 mb-6 text-left">
          <CardTitle className="text-2xl font-bold tracking-tight text-[#0f0f10] flex items-center gap-2">
            {currentStep === 1 && <>Club <span className="font-serif italic font-normal text-[#505f78]">Profile</span></>}
            {currentStep === 2 && <>About <span className="font-serif italic font-normal text-[#505f78]">Your Club</span></>}
            {currentStep === 3 && <>Links & <span className="font-serif italic font-normal text-[#505f78]">Socials</span></>}
            {currentStep === 4 && <>Review & <span className="font-serif italic font-normal text-[#505f78]">Confirm</span></>}
          </CardTitle>
          <CardDescription className="text-neutral-500 text-xs font-medium mt-1">
            {currentStep === 1 && "Set up your club's identity, display name, handle, and logo."}
            {currentStep === 2 && "Provide a compelling description so members know what your club is about."}
            {currentStep === 3 && "Add social media handles and website link for your club (optional)."}
            {currentStep === 4 && "Review your information before finalizing your official club profile."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium leading-relaxed">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: PROFILE */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                {/* Logo Upload */}
                <div className="flex flex-col items-center sm:flex-row gap-4 p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-neutral-300 flex items-center justify-center cursor-pointer hover:border-black transition-all overflow-hidden bg-white relative group"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Club Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-neutral-400 group-hover:text-black">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-bold">Logo</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-bold text-[#0f0f10]">Club Logo / Avatar</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">Upload high-res JPG, PNG or WEBP (max 5MB).</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-black underline mt-2 hover:text-neutral-600"
                    >
                      {logoPreview ? "Change Photo" : "Upload File"}
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Display Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Coding Club"
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                    required
                  />
                </div>

                {/* Username / Handle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Handle / Username</Label>
                    {usernameChecking && <span className="text-[10px] text-neutral-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>}
                    {!usernameChecking && usernameAvailable === true && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Available</span>}
                    {!usernameChecking && usernameAvailable === false && <span className="text-[10px] text-red-500 font-bold">Already Taken</span>}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-neutral-400 text-xs font-bold">@</span>
                    <Input
                      id="username"
                      name="username"
                      placeholder="codingclub"
                      value={formData.username}
                      onChange={handleChange}
                      className="bg-white border-[#c5c6cd] rounded-xl h-11 pl-8 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Category</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#c5c6cd] rounded-xl h-11 px-3 focus:border-black focus:outline-none text-[#0f0f10] text-xs font-medium"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ABOUT */}
            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Short Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    placeholder="Describe your club's mission, activities, and who should join..."
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-[#c5c6cd] rounded-xl p-3.5 focus:border-black focus:outline-none text-[#0f0f10] text-xs font-medium leading-relaxed resize-none"
                    required
                  />
                  <p className="text-[10.5px] text-neutral-400 text-right">{formData.description.length} characters</p>
                </div>
              </motion.div>
            )}

            {/* STEP 3: LINKS & SOCIAL */}
            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-pink-600" /> Instagram Handle / URL
                  </Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    placeholder="e.g. instagram.com/codingclub or @codingclub"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Page URL
                  </Label>
                  <Input
                    id="linkedin"
                    name="linkedin"
                    placeholder="e.g. linkedin.com/company/codingclub"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" /> Official Website
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="e.g. https://codingclub.org"
                    value={formData.website}
                    onChange={handleChange}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="other_links" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-600" /> Other Social / Linktree
                  </Label>
                  <Input
                    id="other_links"
                    name="other_links"
                    placeholder="e.g. linktr.ee/codingclub"
                    value={formData.other_links}
                    onChange={handleChange}
                    className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] text-xs font-medium"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW */}
            {currentStep === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div className="p-4 border border-neutral-100 rounded-2xl bg-neutral-50/50 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border border-neutral-200">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        formData.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0f0f10]">{formData.name}</h3>
                      <p className="text-xs text-neutral-400 font-mono">@{formData.username}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 bg-black/5 text-black rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {formData.category}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200/60">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Description</p>
                    <p className="text-xs text-neutral-700 mt-1 leading-relaxed whitespace-pre-wrap">{formData.description}</p>
                  </div>

                  {(formData.instagram || formData.linkedin || formData.website || formData.other_links) && (
                    <div className="pt-3 border-t border-neutral-200/60 space-y-1 text-xs">
                      <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Social Links</p>
                      {formData.instagram && <p className="text-neutral-600"><strong>Instagram:</strong> {formData.instagram}</p>}
                      {formData.linkedin && <p className="text-neutral-600"><strong>LinkedIn:</strong> {formData.linkedin}</p>}
                      {formData.website && <p className="text-neutral-600"><strong>Website:</strong> {formData.website}</p>}
                      {formData.other_links && <p className="text-neutral-600"><strong>Other:</strong> {formData.other_links}</p>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        {/* Footer Navigation Controls */}
        <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={loading}
              className="rounded-full h-11 px-5 border-[#c5c6cd] hover:bg-neutral-100 text-[#0f0f10] font-bold text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : <div />}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-black hover:bg-[#505f78] text-white font-bold h-11 px-7 rounded-full transition-all text-xs flex items-center gap-1.5 ml-auto"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="bg-black hover:bg-[#505f78] text-white font-bold h-11 px-8 rounded-full transition-all text-xs flex items-center gap-2 shadow-md ml-auto"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>Complete Setup <Sparkles className="w-3.5 h-3.5" /></>}
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
