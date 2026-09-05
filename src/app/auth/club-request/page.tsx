"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Loader2, Send, CheckCircle2, ArrowLeft, Trophy, Users, Star, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/apiClient";

import { INTEREST_TAGS } from "@/constants/interestTags";

const buttonClickInteraction = {
  whileHover: { scale: 1.02, y: -1 },
  whileTap: { scale: 0.98, y: 0 },
  transition: { type: "spring" as const, stiffness: 400, damping: 15 }
};

export default function RedesignedClubRequestPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [domainSearch, setDomainSearch] = useState("");

  const [mode, setMode] = useState<"request" | "status_email" | "status_otp" | "status_result">("request");

  const [statusEmail, setStatusEmail] = useState("");
  const [statusOtp, setStatusOtp] = useState("");
  const [statusResult, setStatusResult] = useState<{
    status: string;
    club_name: string;
    created_at: string;
    token?: string | null;
  } | null>(null);

  const [formData, setFormData] = useState({
    club_name: "",
    club_email: "",
    president_name: "",
    phone_number: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "description" && value.length > 200) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDomainToggle = (domain: string) => {
    if (selectedDomains.includes(domain)) {
      setSelectedDomains(prev => prev.filter(d => d !== domain));
    } else {
      if (selectedDomains.length >= 5) {
        toast.error("You can select up to 5 domains.");
        return;
      }
      setSelectedDomains(prev => [...prev, domain]);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = formData.club_email.toLowerCase().trim();

    // Basic Validation
    if (!formData.club_name || !normalizedEmail || !formData.president_name) {
      setError("Club name, email, and president name are required.");
      setLoading(false);
      return;
    }

    if (selectedDomains.length === 0) {
      setError("Please select at least 1 domain for your club.");
      setLoading(false);
      return;
    }

    try {
      // Check for existing request with this email
      const { data: existing, error: checkError } = await supabase
        .from("club_requests")
        .select("id, status")
        .eq("club_email", normalizedEmail)
        .maybeSingle();

      if (checkError) throw new Error(checkError.message);

      if (existing) {
        if (existing.status === "pending") {
          setError("A request with this email is already under review. Please wait for the admin to process it.");
          setLoading(false);
          return;
        }
        if (existing.status === "approved") {
          setError("This club email has already been approved. Please contact the admin if you need assistance.");
          setLoading(false);
          return;
        }
        // status === 'rejected': delete old record to allow resubmission
        const { error: deleteError } = await supabase
          .from("club_requests")
          .delete()
          .eq("id", existing.id);
        if (deleteError) throw new Error(deleteError.message);
      }

      // Insert into public.club_requests
      const { error: insertError } = await supabase
        .from("club_requests")
        .insert({
          club_name: formData.club_name.trim(),
          club_email: normalizedEmail,
          president_name: formData.president_name.trim(),
          category: selectedDomains.join(", "),
          description: formData.description.trim(),
          status: "pending",
        });

      if (insertError) {
        // Unique constraint violation (race condition)
        if (insertError.code === "23505") {
          setError("A request with this email is already under review. Please wait for the admin to process it.");
          setLoading(false);
          return;
        }
        throw new Error(insertError.message);
      }

      router.push('/auth/club-request/submitted');
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendStatusOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusEmail.trim()) {
      setError("Please enter your club email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/club-status/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: statusEmail }),
      });

      toast.success(data.message); // Generic success message for privacy
      setMode("status_otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStatusOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusOtp.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/auth/club-status/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email: statusEmail, otp: statusOtp }),
      });

      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      setStatusResult(data);
      setMode("status_result");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-start justify-center relative overflow-hidden p-6 pt-20 md:pt-24 lg:pt-32" style={{ backgroundColor: "#faf9f6" }}>
      {/* Background Glow Decorations */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-[-20%] top-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30"></div>
        <div className="absolute right-[-20%] bottom-[10%] w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-30"></div>
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 lg:gap-16 items-start relative z-10">

        {/* Left Side Content */}
        <div className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-10 pt-4">
          <div className="relative z-20 max-w-md select-none">
            <Link href="/" className="inline-flex items-center gap-2 group text-neutral-500 hover:text-black transition-colors mb-6">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-bold uppercase tracking-widest">Back Home</span>
            </Link>

            <div className="space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#855300]/10 border border-[#855300]/20 flex items-center justify-center text-[#855300] mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight leading-[1.1] text-[#0f0f10]">
                Elevate Your <br />
                <span className="bg-gradient-to-r from-[#505f78] to-[#855300] bg-clip-text text-transparent font-serif italic font-normal pr-4 inline-block">
                  Club&apos;s Presence.
                </span>
              </h1>
              <p className="text-sm text-neutral-500 font-normal leading-relaxed">
                The intrst platform is the exclusive campus community for clubs to host events, engage with members, and grow their influence.
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-8 border-t border-black/5 relative max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#505f78]/10 border border-[#505f78]/20 flex items-center justify-center text-[#505f78] shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f0f10] uppercase tracking-widest text-[10px] mb-0.5">Engage Students</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Reach a wider audience and get more registrations for your events.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#855300]/10 border border-[#855300]/20 flex items-center justify-center text-[#855300] shrink-0">
                <Star className="w-5 h-5 fill-[#855300]/20" />
              </div>
              <div>
                <h3 className="font-bold text-[#0f0f10] uppercase tracking-widest text-[10px] mb-0.5">Official Verification</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">Get the blue checkmark and official status on campus.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form Card Container */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-end w-full">

          {/* Back Home for Mobile */}
          <div className="w-full flex lg:hidden justify-start mb-6">
            <Link href="/" className="inline-flex items-center gap-2 group text-neutral-500 hover:text-black transition-colors">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span className="text-xs font-bold uppercase tracking-widest">Back Home</span>
            </Link>
          </div>

          <Card className="w-full max-w-[540px] border border-neutral-200/60 shadow-[0_24px_48px_rgba(0,0,0,0.03)] p-6 sm:p-10 rounded-[32px] bg-white">
            <CardHeader className="p-0 mb-8 text-center sm:text-left">
              <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm mb-3 mx-auto sm:mx-0">i</div>
              <CardTitle className="text-2xl font-bold tracking-tight text-[#0f0f10] mb-1.5">
                {mode === "request" && <>Register Your <span className="font-serif italic font-normal text-[#505f78]">Club</span></>}
                {mode !== "request" && <>Check Request <span className="font-serif italic font-normal text-[#505f78]">Status</span></>}
              </CardTitle>
              <CardDescription className="text-neutral-500 text-xs font-medium">
                {mode === "request" && "Please provide your club details for manual verification."}
                {mode === "status_email" && "Enter the email you used to request your club."}
                {mode === "status_otp" && "Enter the verification code sent to your email."}
                {mode === "status_result" && "Your current request status is displayed below."}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              {mode === "request" && (
                <form onSubmit={handleRequest} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="club_name" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Name</Label>
                      <Input
                        id="club_name"
                        name="club_name"
                        placeholder="e.g. Code Wizards"
                        value={formData.club_name}
                        onChange={handleChange}
                        className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="club_email" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Contact Email</Label>
                      <Input
                        id="club_email"
                        name="club_email"
                        type="email"
                        placeholder="club@gitam.in"
                        value={formData.club_email}
                        onChange={handleChange}
                        className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="president_name" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Representative Name</Label>
                      <Input
                        id="president_name"
                        name="president_name"
                        placeholder="Full Name"
                        value={formData.president_name}
                        onChange={handleChange}
                        className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone_number" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Representative Phone (Optional)</Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        type="tel"
                        placeholder="Phone Number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Multi-select Club Domains */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Club Domains (Select up to 5)</Label>
                      <span className="text-[10px] font-bold text-[#855300] tracking-wide">
                        {selectedDomains.length} / 5 selected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-0.5 mb-3">
                      {INTEREST_TAGS.slice(0, 6).map((item) => {
                        const domain = item.tag;
                        const isSelected = selectedDomains.includes(domain);
                        return (
                          <button
                            type="button"
                            key={domain}
                            onClick={() => handleDomainToggle(domain)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${isSelected
                              ? "bg-black border-black text-white shadow-sm"
                              : "bg-[#faf9f6] border-black/5 text-neutral-500 hover:bg-neutral-100 hover:border-black/10"
                              }`}
                          >
                            {domain}
                          </button>
                        );
                      })}
                    </div>

                    <Input
                      placeholder="Search more domains..."
                      value={domainSearch}
                      onChange={(e) => setDomainSearch(e.target.value)}
                      className="bg-white border-[#c5c6cd] rounded-xl h-10 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                    />

                    {domainSearch.trim().length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 max-h-[140px] overflow-y-auto pr-1 hide-scrollbar">
                        {INTEREST_TAGS.slice(6)
                          .filter(d => d.tag.toLowerCase().includes(domainSearch.toLowerCase()))
                          .map((item) => {
                            const domain = item.tag;
                            const isSelected = selectedDomains.includes(domain);
                            return (
                              <button
                                type="button"
                                key={domain}
                                onClick={() => handleDomainToggle(domain)}
                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 flex items-center gap-1.5 ${isSelected
                                  ? "bg-black border-black text-white shadow-sm"
                                  : "bg-[#faf9f6] border-black/5 text-neutral-500 hover:bg-neutral-100 hover:border-black/10"
                                  }`}
                              >
                                {domain}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="description" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Short Description</Label>
                      <span className="text-[10px] font-bold text-[#855300] tracking-wide">
                        {formData.description.length} / 200
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Briefly describe your club's mission and regular activities..."
                      value={formData.description}
                      onChange={handleChange}
                      className="bg-white border-[#c5c6cd] rounded-xl min-h-[100px] focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                    />
                  </div>

                  <motion.div {...buttonClickInteraction} className="pt-2">
                    <Button
                      className="w-full bg-black hover:bg-[#505f78] text-white font-bold h-12 rounded-full transition-all shadow-sm group flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          Submit Club Request
                        </>
                      )}
                    </Button>
                  </motion.div>

                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => { setError(null); setMode("status_email"); }}
                      className="text-xs text-[#855300] font-bold underline hover:text-black transition-colors"
                    >
                      Already submitted a request? Check Request Status
                    </button>
                  </div>
                </form>
              )}

              {mode === "status_email" && (
                <form onSubmit={handleSendStatusOtp} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="statusEmail" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Contact Email</Label>
                    <Input
                      id="statusEmail"
                      type="email"
                      placeholder="club@gitam.in"
                      value={statusEmail}
                      onChange={(e) => setStatusEmail(e.target.value)}
                      className="bg-white border-[#c5c6cd] rounded-xl h-11 focus:border-black focus-visible:ring-0 text-[#0f0f10] placeholder:text-neutral-300 text-xs font-medium"
                      required
                    />
                  </div>
                  <motion.div {...buttonClickInteraction} className="pt-2">
                    <Button
                      className="w-full bg-black hover:bg-[#505f78] text-white font-bold h-12 rounded-full transition-all shadow-sm flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Verification Code"}
                    </Button>
                  </motion.div>
                  <div className="pt-4 flex justify-center">
                    <button type="button" onClick={() => { setError(null); setMode("request"); }} className="text-xs text-neutral-500 font-bold hover:text-black transition-colors">
                      Back to New Request
                    </button>
                  </div>
                </form>
              )}

              {mode === "status_otp" && (
                <form onSubmit={handleVerifyStatusOtp} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                      {error}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="statusOtp" className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Verification Code</Label>
                    <Input
                      id="statusOtp"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={statusOtp}
                      onChange={(e) => setStatusOtp(e.target.value)}
                      className="bg-white border-[#c5c6cd] rounded-xl h-11 text-center text-lg tracking-widest focus:border-black focus-visible:ring-0 text-[#0f0f10] font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                  <motion.div {...buttonClickInteraction} className="pt-2">
                    <Button
                      className="w-full bg-black hover:bg-[#505f78] text-white font-bold h-12 rounded-full transition-all shadow-sm flex items-center justify-center gap-2"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : "Verify & Check Status"}
                    </Button>
                  </motion.div>
                  <div className="pt-4 flex justify-center">
                    <button type="button" onClick={() => { setError(null); setMode("status_email"); setStatusOtp(""); }} className="text-xs text-neutral-500 font-bold hover:text-black transition-colors">
                      Use a different email
                    </button>
                  </div>
                </form>
              )}

              {mode === "status_result" && statusResult && (
                <div className="space-y-8 text-center py-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f0f10] mb-2">{statusResult.club_name}</h3>
                    <p className="text-xs text-neutral-500">Submitted: {new Date(statusResult.created_at).toLocaleDateString()}</p>
                  </div>

                  {statusResult.status === "pending" && (
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center gap-3">
                      <Clock className="w-8 h-8 text-amber-500" />
                      <div>
                        <h4 className="font-bold text-amber-800 text-sm">Under Review</h4>
                        <p className="text-xs text-amber-700/80 mt-1">Your club request is currently under review by our admin team.</p>
                      </div>
                    </div>
                  )}

                  {statusResult.status === "rejected" && (
                    <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col items-center gap-3">
                      <XCircle className="w-8 h-8 text-rose-500" />
                      <div>
                        <h4 className="font-bold text-rose-800 text-sm">Not Approved</h4>
                        <p className="text-xs text-rose-700/80 mt-1">Your club request was not approved.</p>
                      </div>
                    </div>
                  )}

                  {statusResult.status === "approved" && (
                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <div>
                        <h4 className="font-bold text-emerald-800 text-sm">Approved!</h4>
                        <p className="text-xs text-emerald-700/80 mt-1">Your club request has been approved and is ready to be set up.</p>
                      </div>
                    </div>
                  )}

                  {statusResult.status === "approved" && (
                    <Link href={statusResult.token ? `/auth/club-setup?token=${statusResult.token}` : `/auth/club-setup`}>
                      <motion.div {...buttonClickInteraction} className="pt-4">
                        <Button className="w-full bg-[#855300] hover:bg-[#6c4300] text-white font-bold h-12 rounded-full transition-all shadow-sm">
                          Continue Club Setup
                        </Button>
                      </motion.div>
                    </Link>
                  )}

                  <div className="pt-4 border-t border-black/5 flex justify-center">
                    <button type="button" onClick={() => { setMode("request"); setStatusResult(null); setStatusEmail(""); setStatusOtp(""); }} className="text-xs text-neutral-500 font-bold hover:text-black transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="bg-transparent p-0 mt-8 flex justify-center items-center border-0">
              <p className="text-xs text-neutral-500 font-medium">
                Already verified? <Link href="/signin" className="text-[#855300] font-bold underline hover:text-black transition-colors">Sign in here</Link>
              </p>
            </CardFooter>
          </Card>
        </div>

      </div>
    </main>
  );
}
