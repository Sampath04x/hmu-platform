"use client";

import Link from "next/link";
import { SearchIcon, CheckCircle2Icon, UsersIcon, Building2, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function CommunitiesPage() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      const data = await apiFetch('/profiles?role=club&is_approved=true');
      setClubs(data);
    } catch (error) {
      console.error("Failed to fetch clubs:", error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background relative pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-dmserif font-semibold text-[#0f0f10]">Communities</h1>
        <p className="text-neutral-500">Find where you belong on campus.</p>

        {/* Featured Utilities */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="overflow-hidden bg-white border border-black/5 p-6 relative group shadow-sm transition-all hover:shadow-md hover:border-neutral-300">
            <Link href="/communities/vacant-classrooms" className="flex items-center justify-between relative z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-[#505f78]" />
                </div>
                <div>
                  <h3 className="text-lg font-dmserif font-bold text-[#0f0f10] group-hover:text-[#505f78] transition-colors">Vacant Classroom Locator</h3>
                  <p className="text-xs text-neutral-500 mt-1">Real-time room tracking • Find empty spots to study.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </Link>
          </Card>

          <Card className="overflow-hidden bg-white border border-black/5 p-6 relative group shadow-sm transition-all hover:shadow-md hover:border-neutral-300">
            <Link href="/communities/professor-reviews" className="flex items-center justify-between relative z-20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                  <UsersIcon className="w-7 h-7 text-[#855300]" />
                </div>
                <div>
                  <h3 className="text-lg font-dmserif font-bold text-[#0f0f10] group-hover:text-[#855300] transition-colors">Professor Reviews</h3>
                  <p className="text-xs text-neutral-500 mt-1">Anonymous student feedback • Research your instructors.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all animate-none" />
            </Link>
          </Card>
        </div>
      </div>

      <div className="relative mb-10 text-[#0f0f10] focus-within:text-black group">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-black transition-colors" />
        <Input
          type="text"
          placeholder="Search clubs, groups, interests..."
          className="pl-12 h-14 bg-white border border-black/5 rounded-xl focus-visible:ring-[#505f78] font-medium placeholder:font-normal text-base shadow-sm group-focus-within:shadow-md transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#505f78]" />
        </div>
      ) : (
        <>
          {/* Trending on Campus */}
          <section className="mb-12">
            <h2 className="text-xl font-dmserif font-semibold mb-4 text-[#0f0f10]">Official Clubs & Communities</h2>
            {clubs.length === 0 ? (
              <p className="text-neutral-500 text-sm">No communities found at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                  <Card key={club.user_id} className="overflow-hidden bg-white border border-black/5 rounded-2xl shadow-sm transition-all hover:shadow-md group relative">
                    <Link href={`/profile/${club.user_id}`} className="absolute inset-0 z-10" aria-label={`View ${club.name}`}></Link>

                    <div className="h-24 bg-gradient-to-br from-[#505f78]/10 to-[#855300]/5 transition-colors relative">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px]"></div>
                    </div>

                    <div className="px-5 pb-5 pt-0 relative z-20">
                      <div className="flex justify-between items-end mb-3">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neutral-800 to-black text-white font-bold text-2xl flex items-center justify-center -mt-8 border-[4px] border-white shadow-md overflow-hidden">
                          {club.profile_image_url ? (
                            <img src={club.profile_image_url} alt={club.name} className="w-full h-full object-cover" />
                          ) : (
                            club.name?.[0] || '?'
                          )}
                        </div>
                        <Button className="h-8 px-5 text-xs bg-black text-white hover:bg-[#505f78] rounded-full font-semibold z-30 pointer-events-none shadow-sm">View</Button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-dmserif font-semibold text-lg text-[#0f0f10] group-hover:text-[#505f78] transition-colors leading-tight">{club.name}</h3>
                        <CheckCircle2Icon className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2">
                        <span className="bg-neutral-100 px-2 py-1 rounded-md text-neutral-600 font-medium">
                          {club.club_metadata?.category || "Community"}
                        </span>
                        <span className="flex items-center gap-1">
                          <UsersIcon className="w-3.5 h-3.5" />
                          {club.followers_count || 0}
                        </span>
                      </div>

                      {club.bio && (
                        <p className="text-sm text-neutral-500 mt-3 line-clamp-2">
                          {club.bio}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
