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

const gradients = [
  "from-brand/20 to-accent/10",
  "from-amber-600/20 to-orange-500/10",
  "from-rose-600/20 to-pink-500/10",
  "from-emerald-600/20 to-teal-500/10"
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
  const { user_id: currentUserId } = useUser();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const [profileData, eventsData, postsData] = await Promise.all([
          apiFetch(`/profiles/${userId}`),
          apiFetch(`/events?created_by=${userId}`),
          apiFetch(`/posts?user_id=${userId}`) // Assuming this filter works, or fallback to frontend filtering
        ]);

        setProfile(profileData);
        setEvents(eventsData || []);
        setPosts(postsData || []);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center flex-col">
        <h2 className="text-2xl font-dmserif text-white mb-2">Profile Not Found</h2>
        <p className="text-muted-foreground">This user or club may not exist.</p>
      </div>
    );
  }

  const isClub = profile.role === "club";

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Cover */}
      <div className="h-44 md:h-52 bg-gradient-to-br from-brand/40 via-accent/30 to-brand/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background" />
      </div>

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-16 flex flex-col items-center text-center">
        <div className="relative">
          <Avatar className="w-28 h-28 border-4 border-background shadow-2xl">
            {profile.profile_image_url ? (
              <img src={profile.profile_image_url} alt={profile.name} className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-brand to-accent text-white text-4xl font-dmserif font-bold">
                {(profile.name || "U")[0].toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="mt-4 space-y-2">
          <h1 className="text-3xl font-dmserif font-bold text-white flex items-center justify-center gap-2">
            {profile.name}
            {profile.is_approved && isClub && (
              <CheckCircle2Icon className="w-5 h-5 text-blue-500 fill-blue-500/20" />
            )}
            {profile.role === 'founder' && (
              <CheckCircle2Icon className="w-5 h-5 text-brand fill-brand/20" />
            )}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {!isClub && (
              <span className="text-muted-foreground font-medium">
                {profile.department || "Unknown Dept"} · {profile.year_of_study ? `${profile.year_of_study} Year` : "Unknown Year"}
              </span>
            )}
            {isClub && (
              <Badge variant="outline" className="border-brand/30 text-brand gap-1 rounded-full px-3">
                Official Club
              </Badge>
            )}
          </div>
          {profile.bio && (
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed mt-2">
              {profile.bio}
            </p>
          )}
        </div>

        {/* CTA Buttons */}
        {!isOwnProfile && (
          <div className="flex gap-3 mt-7 w-full max-w-sm">
            <Button className="flex-1 h-12 bg-brand hover:opacity-90 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(194,105,42,0.3)] gap-2">
              <UserPlusIcon className="w-4 h-4" /> {isClub ? "Follow" : "Connect"}
            </Button>
            <Button variant="outline" className="flex-1 h-12 border-brand/30 text-brand hover:bg-brand/10 rounded-xl gap-2 group">
              <MessageSquareIcon className="w-4 h-4" /> Message
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-sm">
          <div className="bg-card border border-border/50 rounded-2xl py-4 px-2 text-center">
            <div className="text-2xl font-dmserif font-bold text-white">{isClub ? "0" : "18"}</div>
            <div className="text-xs text-muted-foreground mt-1">{isClub ? "Followers" : "Connections"}</div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl py-4 px-2 text-center">
            <div className="text-2xl font-dmserif font-bold text-white">{posts.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Posts</div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl py-4 px-2 text-center">
            <div className="text-2xl font-dmserif font-bold text-white">{events.length || "0"}</div>
            <div className="text-xs text-muted-foreground mt-1">Events</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-8">
        <Tabs defaultValue={isClub ? "events" : "posts"}>
          <TabsList className="w-full bg-card border border-border/50 rounded-xl p-1 h-auto gap-1">
            {isClub && (
              <TabsTrigger value="events" className="flex-1 capitalize rounded-lg py-2 text-sm data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-none text-muted-foreground hover:text-white transition-colors">
                Events
              </TabsTrigger>
            )}
            <TabsTrigger value="posts" className="flex-1 capitalize rounded-lg py-2 text-sm data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-none text-muted-foreground hover:text-white transition-colors">
              Posts
            </TabsTrigger>
            {!isClub && (
              <TabsTrigger value="connections" className="flex-1 capitalize rounded-lg py-2 text-sm data-[state=active]:bg-brand data-[state=active]:text-white data-[state=active]:shadow-none text-muted-foreground hover:text-white transition-colors">
                Connections
              </TabsTrigger>
            )}
          </TabsList>

          {isClub && (
            <TabsContent value="events" className="mt-6 space-y-4">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No events hosted yet.</p>
              ) : (
                events.map((event, idx) => {
                  const gradient = gradients[idx % gradients.length];
                  const { dateStr, dayStr, timeStr } = formatDate(event.started_at);
                  
                  return (
                    <Card key={event.event_id} className="overflow-hidden bg-card border-border/50 glow-hover group flex flex-col sm:flex-row transition-all">
                      <div className={`w-full sm:w-32 h-24 sm:h-auto flex-col items-center justify-center bg-gradient-to-br ${gradient} shrink-0 flex relative border-b sm:border-b-0 sm:border-r border-border/30`}>
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
                        <span className="text-[10px] font-bold text-muted-foreground tracking-widest">{dateStr}</span>
                        <span className="text-2xl font-dmserif font-bold text-white mt-0.5">{dayStr.split(" ")[1] || "—"}</span>
                        <span className="text-[10px] font-semibold text-muted-foreground">{dayStr.split(" ")[0] || "—"}</span>
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="text-lg font-dmserif font-semibold text-white group-hover:text-brand transition-colors leading-tight">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2">
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
              <p className="text-muted-foreground text-center py-8">No posts yet.</p>
            ) : (
              posts.map((post: any) => (
                <Card key={post.post_id} className="p-5 bg-card border-border/50 glow-hover">
                  <Badge className="mb-3 rounded-full bg-accent/10 text-accent border border-accent/20" variant="outline">
                    {post.category || "General"}
                  </Badge>
                  <p className="text-foreground leading-relaxed mb-4">{post.content}</p>
                  <div className="flex items-center gap-5 text-muted-foreground text-sm">
                    <button className="flex items-center gap-1.5 hover:text-brand transition-colors">
                      <ThumbsUpIcon className="w-4 h-4" /> {post.likes_count || 0}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-accent transition-colors">
                      <MessageCircleIcon className="w-4 h-4" /> {post.comments_count || 0}
                    </button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {!isClub && (
            <TabsContent value="connections" className="mt-6">
               <p className="text-muted-foreground text-center py-8">Connections will appear here.</p>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
