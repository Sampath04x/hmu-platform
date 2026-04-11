"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CameraIcon, ChevronLeftIcon, SparkleIcon, AtSignIcon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/apiClient";

const ALL_INTERESTS = [
  "Photography", "Music", "Gaming", "Anime", "Fitness", "Coding",
  "Chess", "Poetry", "Cooking", "Hiking", "Debate", "Film",
  "Books", "Startups", "Art", "Football", "Cricket", "Finance",
  "Psychology", "Philosophy", "Design", "Memes", "Cafe Hopping",
  "Open Mic", "Esports", "AI / ML", "Writing", "Robotics",
  "Cycling", "Yoga", "Dance", "Travel", "Journaling",
];

const DEPARTMENTS = ["CSE", "ECE", "Mechanical", "Civil", "EEE", "IT", "Chemical", "Biotech", "MBA", "Law", "Pharmacy", "Architecture"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Ph.D."];

const CLUB_CATEGORIES = ["Technical", "Cultural", "Sports", "Media", "Literature", "Social", "Other"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("onboarding_step");
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  
  useEffect(() => {
    sessionStorage.setItem("onboarding_step", step.toString());
  }, [step]);

  const { name, setName, role, interests: selectedTags, setInterests: setSelectedTags, aiProfile, setIsLoggedIn, user_id } = useUser();
  
  const [username, setUsername] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState(YEARS[0]);
  const [bio, setBio] = useState("");
  const [clubCategory, setClubCategory] = useState(CLUB_CATEGORIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [privacySettings, setPrivacySettings] = useState({
    showPhoto: false,
    showDepartment: true,
    showYear: true,
    allowMessageRequests: false,
    girlsFirstProtection: true
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFinish = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      if (!user_id) {
        throw new Error("User session not found. Please log in again.");
      }

      let parsedYear = parseInt(year);
      if (isNaN(parsedYear)) parsedYear = 6;

      const payload: any = {
        username,
        name,
        bio,
      };

      if (role === 'club') {
        payload.club_metadata = {
          category: clubCategory
        };
      } else {
        payload.department = department;
        payload.year_of_study = parsedYear;
        payload.interests = selectedTags;
        payload.privacy_settings = privacySettings;
      }

      await apiFetch(`/profiles/${user_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setIsLoggedIn(true);
      router.push("/home");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile");
      setIsLoading(false);
    }
  };

  // Club Onboarding Flow
  if (role === 'club') {
    return (
      <div className="min-h-screen bg-background flex flex-col pt-10 p-4">
        <div className="max-w-xl mx-auto w-full space-y-6">
          <header className="mb-4">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-dmserif font-semibold">Club Profile</h1>
              <p className="text-muted-foreground">Set up your community space.</p>
            </div>
          </header>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm animate-in fade-in zoom-in-95">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="flex justify-center py-2">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-brand/50 transition-colors">
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-brand transition-colors">
                    <CameraIcon className="w-7 h-7" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Logo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Club Name</label>
                <Input 
                  placeholder="e.g. Photography Club" 
                  className="h-12 bg-card rounded-xl border-border focus-visible:ring-brand shadow-sm" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Club Username</label>
                <div className="relative">
                  <AtSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="club_username" 
                    className="h-12 bg-card rounded-xl border-border focus-visible:ring-brand pl-10 shadow-sm" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select 
                  className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm cursor-pointer"
                  value={clubCategory}
                  onChange={(e) => setClubCategory(e.target.value)}
                >
                  {CLUB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Club Bio</label>
                <Textarea
                  placeholder="Describe your club's mission and regular activities..."
                  className="min-h-24 bg-card rounded-xl resize-none focus-visible:ring-brand shadow-sm"
                  maxLength={500}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
                <p className="text-xs text-right text-muted-foreground">{bio.length}/500</p>
              </div>
            </div>

            <Button
              className="w-full h-14 bg-brand hover:opacity-90 rounded-xl text-base font-semibold transition-all shadow-[0_4px_12px_rgba(194,105,42,0.2)] disabled:opacity-50"
              onClick={handleFinish}
              disabled={isLoading || !name || !username}
            >
              {isLoading ? "Saving..." : "Submit for Approval"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal User Onboarding Flow
  return (
    <div className="min-h-screen bg-background flex flex-col pt-10 p-4">
      <div className="max-w-xl mx-auto w-full space-y-6">
        {/* Progress */}
        <header className="flex items-center gap-4 mb-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="p-2 bg-card rounded-full hover:bg-card/80 transition-colors border border-border">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-card rounded-full overflow-hidden border border-border/30">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(194,105,42,0.5)]"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm animate-in fade-in zoom-in-95">
            {errorMsg}
          </div>
        )}

        {/* AI Profile Banner */}
        {aiProfile && step === 1 && (
          <div className="flex items-center gap-3 bg-brand/10 border border-brand/20 rounded-2xl p-4 mb-2">
            <SparkleIcon className="w-5 h-5 text-brand shrink-0" />
            <div>
              <p className="text-accent text-sm font-semibold">AI profile ready: <span className="text-white">{aiProfile.personalityType}</span></p>
              <p className="text-brand/70 text-xs mt-0.5">Interests pre-filled from your discovery session · Codename: {aiProfile.matchCodename}</p>
            </div>
          </div>
        )}

        {/* Step 1 — Your Profile */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-center space-y-1">
              <h1 className="text-3xl font-dmserif font-semibold">Your Profile</h1>
              <p className="text-muted-foreground">This is how you appear to connections.</p>
            </div>

            <div className="flex justify-center py-2">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-card border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-brand/50 transition-colors">
                  <div className="flex flex-col items-center gap-1.5 text-muted-foreground group-hover:text-brand transition-colors">
                    <CameraIcon className="w-7 h-7" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Upload</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input 
                  placeholder="e.g. Priya S." 
                  className="h-12 bg-card rounded-xl border-border focus-visible:ring-brand shadow-sm" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <div className="relative">
                  <AtSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="unique_username" 
                    className="h-12 bg-card rounded-xl border-border focus-visible:ring-brand pl-10 shadow-sm" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-2">Letters, numbers, and underscores only.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm cursor-pointer"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Year</label>
                  <select 
                    className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm cursor-pointer"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  >
                    {YEARS.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Short Bio</label>
                <Textarea
                  placeholder="What's your vibe?"
                  className="min-h-24 bg-card rounded-xl resize-none focus-visible:ring-brand shadow-sm"
                  maxLength={200}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
                <p className="text-xs text-right text-muted-foreground">{bio.length}/200</p>
              </div>
            </div>

            <Button 
              className="w-full h-14 bg-brand hover:opacity-90 rounded-xl text-base font-semibold transition-all shadow-[0_4px_12px_rgba(194,105,42,0.2)]" 
              onClick={() => setStep(2)}
              disabled={!name || !username}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2 — Interests */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-dmserif font-semibold">What are you into?</h1>
              <p className="text-muted-foreground">
                Pick up to 10. {selectedTags.length > 0 && aiProfile
                  ? <span className="text-brand font-medium">Pre-filled from your AI session ✓</span>
                  : "This powers our AI matching."
                }
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {ALL_INTERESTS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isSelected
                        ? "bg-brand/20 text-accent border-brand/60 shadow-[0_0_12px_rgba(194,105,42,0.2)]"
                        : "bg-card border-border text-foreground hover:border-brand/30 hover:bg-card/80"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <Button
              className="w-full h-14 bg-brand hover:opacity-90 rounded-xl text-base font-semibold shadow-[0_4px_12px_rgba(194,105,42,0.2)]"
              onClick={() => setStep(3)}
              disabled={selectedTags.length === 0}
            >
              Continue ({selectedTags.length}/10 selected)
            </Button>
          </div>
        )}

        {/* Step 3 — Three Questions */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-dmserif font-semibold">Three quick ones.</h1>
              <p className="text-muted-foreground">Only used for AI matching. Never shown publicly.</p>
            </div>

            <div className="space-y-5">
              {[
                "What's something most people don't know about you?",
                "What are you actually trying to figure out right now?",
                "What kind of person do you click with?",
              ].map((q, i) => (
                 <div key={i} className="space-y-2">
                  <label className="text-sm font-medium text-accent/90">{q}</label>
                  <Textarea className="min-h-[90px] bg-card rounded-xl border-border resize-none focus-visible:ring-brand shadow-sm" maxLength={150} />
                </div>
              ))}
            </div>

            <Button className="w-full h-14 bg-brand hover:opacity-90 rounded-xl text-base font-semibold shadow-[0_4px_12px_rgba(194,105,42,0.2)]" onClick={() => setStep(4)}>
              Continue
            </Button>
          </div>
        )}

        {/* Step 4 — Privacy */}
        {step === 4 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-dmserif font-semibold">Your privacy, your rules.</h1>
              <p className="text-muted-foreground">You can change these anytime in settings.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: "showPhoto", label: "Show my photo to non-connections" },
                { key: "showDepartment", label: "Show my department" },
                { key: "showYear", label: "Show my year" },
                { key: "allowMessageRequests", label: "Allow message requests from anyone" },
                { key: "girlsFirstProtection", label: "Enable girls-first protection", desc: "Only people who've interacted with your content can message you first" },
              ].map((item, i) => {
                const isActive = privacySettings[item.key as keyof typeof privacySettings];
                return (
                  <div key={i} className="flex justify-between items-start p-4 bg-card border border-border rounded-xl">
                    <div className="flex-1 pr-5">
                      <h3 className="font-medium text-foreground text-sm">{item.label}</h3>
                      {item.desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>}
                    </div>
                    <button
                      onClick={() => setPrivacySettings(prev => ({ ...prev, [item.key]: !isActive }))}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isActive ? "bg-brand" : "bg-muted"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            <Button
              className="w-full h-14 bg-brand hover:opacity-90 rounded-xl text-base font-semibold shadow-[0_0_20px_rgba(194,105,42,0.3)] disabled:opacity-50"
              onClick={handleFinish}
              disabled={isLoading}
            >
              {isLoading ? "Saving Profile..." : "Finish Setup →"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
