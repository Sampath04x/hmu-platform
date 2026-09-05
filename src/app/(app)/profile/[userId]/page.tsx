"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2Icon, LockIcon, UserPlusIcon, MessageSquareIcon, ThumbsUpIcon, MessageCircleIcon, MapPinIcon, ClockIcon } from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
import { useUser } from "@/context/UserContext";
import { PostCard } from "@/components/PostCard";

const dateBlockColors = [
  "bg-[#f3f1eb]",
  "bg-[#ece9e3]",
  "bg-[#e9e6df]",
  "bg-[#efece6]"
];

function formatDate(isoString: string) {
  if (!isoString) return { dateStr: "N/A", dayStr: "N/A", timeStr: "N/A" };
  const d = new Date(isoString);
  const dateStr = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return { dateStr, dayStr, timeStr };
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user_id: currentUserId, role: currentUserRole } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const postsUrl = currentUserId
          ? `/posts?user_id=${userId}&userId=${currentUserId}`
          : `/posts?user_id=${userId}`;

        const [profileData, eventsData, postsData, followersData] = await Promise.all([
          apiFetch(`/profiles/${userId}`),
          apiFetch(`/events?created_by=${userId}`),
          apiFetch(postsUrl),
          apiFetch(`/profiles/${userId}/followers`)
        ]);

        setProfile(profileData);
        setEvents(eventsData || []);

        const mappedPosts = (postsData?.posts || []).map((p: any) => ({
          ...p,
          likes_count: p.post_likes?.[0]?.count || 0,
          comments_count: p.post_comments?.[0]?.count || 0,
        }));
        setPosts(mappedPosts);

        if (followersData && Array.isArray(followersData)) {
          const isUserFollowing = followersData.some((f: any) => f.follower_id === currentUserId);
          setIsFollowing(isUserFollowing);
          profileData.followersCount = followersData.length;
        } else {
          profileData.followersCount = 0;
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) {
      fetchProfileData();
    }
  }, [userId, currentUserId]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await apiFetch(`/profiles/${userId}/follow`, { method: "DELETE" });
        setIsFollowing(false);
        setProfile((prev: any) => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 0) - 1) }));
      } else {
        await apiFetch(`/profiles/${userId}/follow`, { method: "POST" });
        setIsFollowing(true);
        setProfile((prev: any) => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      }
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center flex-col">
        <h2 className="text-2xl font-dmserif text-[#0f0f10] mb-2">Profile Not Found</h2>
        <p className="text-neutral-500">This user or club may not exist.</p>
      </div>
    );
  }

  const isClub = profile.role === "club";

  return (
    <div className="min-h-screen relative overflow-x-hidden pb-28" style={{ backgroundColor: "#faf9f6" }}>
      {/* Background Glow Decorations (Consistent with Landing/Sign In Pages) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -left-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute -right-40 top-0 w-[500px] h-[500px] rounded-full bg-[#e9e6df] blur-[120px] opacity-35" />
        <div className="absolute top-[35%] left-[-150px] w-[400px] h-[400px] rounded-full bg-[#f3f1eb] blur-[120px] opacity-45" />
        <div className="absolute top-[60%] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#f0ede6] blur-[110px] opacity-40" />
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt={profile.name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-[#efece6] text-[#0f0f10] text-4xl font-dmserif font-bold">
                {(profile.name || "U")[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="mt-4 space-y-2">
          <h1 className="text-3xl font-dmserif font-bold text-[#0f0f10] flex items-center justify-center gap-2">
            {profile.name}
            {profile.is_approved && isClub && (
              <CheckCircle2Icon className="w-5 h-5 text-blue-500 fill-blue-500/20" />
            )}
            {profile.role === 'founder' && (
              <CheckCircle2Icon className="w-5 h-5 text-[#855300] fill-[#855300]/20" />
            )}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {!isClub && (
              <span className="text-neutral-500 font-medium">
                {profile.department || "Unknown Dept"} · {profile.year_of_study ? `${profile.year_of_study} Year` : "Unknown Year"}
              </span>
            )}
            {isClub && (
              <Badge variant="outline" className="border-[#505f78]/10 text-[#505f78] bg-[#505f78]/5 gap-1 rounded-full px-3 py-0.5 font-semibold text-xs shadow-none">
                Official Club
              </Badge>
            )}
          </div>
          {profile.bio && (
            <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed mt-2">
              {profile.bio}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        {!isOwnProfile && (
          <div className="flex gap-3 mt-7 w-full max-w-sm">
            {currentUserRole !== 'club' && (
              <Button
                onClick={handleFollowToggle}
                className={`flex-1 h-11 font-bold rounded-full gap-2 transition-all ${isFollowing
                  ? "border border-black/10 bg-white text-black hover:bg-[#f3f1eb]"
                  : "bg-black hover:bg-neutral-800 text-white shadow-sm"
                  }`}
              >
                <UserPlusIcon className="w-4 h-4" />
                {isFollowing ? (isClub ? "Unfollow" : "Connected") : (isClub ? "Follow" : "Connect")}
              </Button>
            )}
            <Button className="flex-1 h-11 border border-black/10 bg-white text-black hover:bg-[#f3f1eb] rounded-full gap-2 transition-all font-bold">
              <MessageSquareIcon className="w-4 h-4" /> Message
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-sm">
          <div className="bg-white border border-black/5 rounded-2xl py-3.5 px-2 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="text-2xl font-dmserif font-bold text-[#0f0f10]">{profile?.followersCount || "0"}</div>
            <div className="text-xs text-neutral-500 mt-1">{isClub ? "Followers" : "Connections"}</div>
          </div>
          <div className="bg-white border border-black/5 rounded-2xl py-3.5 px-2 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="text-2xl font-dmserif font-bold text-[#0f0f10]">{posts.length}</div>
            <div className="text-xs text-neutral-500 mt-1">Posts</div>
          </div>
          <div className="bg-white border border-black/5 rounded-2xl py-3.5 px-2 text-center shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <div className="text-2xl font-dmserif font-bold text-[#0f0f10]">{events.length || "0"}</div>
            <div className="text-xs text-neutral-500 mt-1">Events</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs defaultValue={isClub ? "events" : "posts"}>
          <TabsList className="w-full bg-white border border-black/5 rounded-full p-1 h-auto gap-1 shadow-sm">
            {isClub && (
              <TabsTrigger value="events" className="flex-1 capitalize rounded-full py-2 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-500 hover:text-black hover:bg-[#f3f1eb] transition-all">
                Events
              </TabsTrigger>
            )}
            <TabsTrigger value="posts" className="flex-1 capitalize rounded-full py-2 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-500 hover:text-black hover:bg-[#f3f1eb] transition-all">
              Posts
            </TabsTrigger>
            {!isClub && (
              <TabsTrigger value="connections" className="flex-1 capitalize rounded-full py-2 text-sm font-bold data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm text-neutral-500 hover:text-black hover:bg-[#f3f1eb] transition-all">
                Connections
              </TabsTrigger>
            )}
          </TabsList>

          {isClub && (
            <TabsContent value="events" className="mt-6 space-y-4">
              {events.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No events hosted yet.</p>
              ) : (
                events.map((event, idx) => {
                  const dateBlockBg = dateBlockColors[idx % dateBlockColors.length];
                  const { dateStr, dayStr, timeStr } = formatDate(event.started_at);

                  return (
                    <Card key={event.event_id} className="overflow-hidden bg-white border border-black/5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-black/10 transition-all duration-300 group flex flex-col sm:flex-row">
                      <div className={`w-full sm:w-32 h-24 sm:h-auto flex-col items-center justify-center ${dateBlockBg} shrink-0 flex relative border-b sm:border-b-0 sm:border-r border-black/5`}>
                        <span className="text-[10px] font-bold text-neutral-500 tracking-widest">{dateStr}</span>
                        <span className="text-2xl font-dmserif font-bold text-[#0f0f10] mt-0.5">{dayStr.split(" ")[1] || "—"}</span>
                        <span className="text-[10px] font-semibold text-neutral-500">{dayStr.split(" ")[0] || "—"}</span>
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="text-lg font-dmserif font-semibold text-[#0f0f10] group-hover:text-[#505f78] transition-colors leading-tight">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 pt-2">
                          <span className="flex items-center gap-1.5"><MapPinIcon className="w-3.5 h-3.5" />{event.location}</span>
                          <span className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" />{timeStr}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          )}

          <TabsContent value="posts" className="mt-6 space-y-4">
            {posts.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No posts yet.</p>
            ) : (
              posts.map((post: any) => (
                <PostCard
                  key={post.id || post.post_id}
                  post={post}
                  user_id={currentUserId}
                />
              ))
            )}
          </TabsContent>

          {!isClub && (
            <TabsContent value="connections" className="mt-6">
              <p className="text-neutral-500 text-center py-8">Connections will appear here.</p>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
