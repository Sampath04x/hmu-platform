"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUpIcon, MessageCircleIcon, BookmarkIcon, PlusIcon, XIcon, LockIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/context/UserContext";
import { PersonalityPrompt } from "@/components/PersonalityPrompt";
import { PostCard } from "@/components/PostCard";

const tabs = ["All", "Tips", "Questions", "Events", "Utilities", "Opinions"];

export default function HomePage() {
  const { user_id, has_completed_personality, setHasCompletedPersonality, role, isAuthLoading, interests } = useUser();
  const [activeTab, setActiveTab] = useState("All");
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [postTag, setPostTag] = useState("QUESTION");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const showPersonalityPrompt = !isAuthLoading && !has_completed_personality && !!user_id;

  useEffect(() => {
    console.log("PersonalityPrompt Debug:", {
      showPersonalityPrompt,
      isAuthLoading,
      has_completed_personality,
      user_id
    });
  }, [showPersonalityPrompt, isAuthLoading, has_completed_personality, user_id]);

  const router = import("next/navigation").then(m => m.useRouter);

  useEffect(() => {
    if (!isAuthLoading && role === "club") {
      window.location.href = "/club-dashboard";
    }
  }, [isAuthLoading, role]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const url = user_id ? `/posts?userId=${user_id}` : "/posts";
      const data = await apiFetch(url);
      const mappedPosts = (data?.posts || []).map((p: any) => ({
        ...p,
        likes_count: p.post_likes?.[0]?.count || 0,
      }));
      setPosts(mappedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeaturedEvents = async () => {
    try {
      setEventsLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          event_id,
          title,
          poster_url,
          clubs (
            club_name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setFeaturedEvents(data || []);
    } catch (err) {
      console.error("Error fetching featured events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    if (!user_id) return;

    const { data, error } = await supabase
      .from("saved_posts")
      .select("post_id")
      .eq("user_id", user_id);

    if (!error && data) {
      setSavedPosts(data.map(item => item.post_id));
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchFeaturedEvents();
    fetchSavedPosts();
  }, [user_id]);

  const handleCreatePost = async () => {
    if (!postContent.trim() || !postTag) return;

    try {
      setIsPosting(true);
      const response = await apiFetch("/posts", {
        method: "POST",
        body: JSON.stringify({
          content: postContent,
          post_type: postTag,
          title: postTitle || "New Post",
          is_anonymous: isAnonymous
        }),
      });

      if (response && response.post) {
        setPostContent("");
        setPostTitle("");
        setIsAnonymous(false);
        setIsFabOpen(false);
        fetchPosts(); // Refresh feed
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/posts/${postId}`, {
        method: "DELETE",
      });

      setPosts(prev =>
        prev.filter(post => post.id !== postId)
      );

      fetchPosts();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const toggleSavePost = async (postId: string) => {
    if (!user_id) return;
    console.log("Saving post:", postId);
    console.log("User:", user_id);

    try {
      const isSaved = savedPosts.includes(postId);

      if (isSaved) {
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("user_id", user_id)
          .eq("post_id", postId);


        if (error) throw error;
        console.log("Insert success");

        setSavedPosts(prev =>
          prev.filter(id => id !== postId)
        );
      } else {
        const { error } = await supabase
          .from("saved_posts")
          .insert({
            user_id,
            post_id: postId,
          });

        if (error) throw error;

        setSavedPosts(prev => [...prev, postId]);
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "EVENT": return "bg-[#505f78]/10 text-[#505f78] border border-[#505f78]/20";
      case "QUESTION": return "bg-[#855300]/10 text-[#855300] border border-[#855300]/20";
      case "TIP": return "bg-emerald-600/10 text-emerald-700 border border-emerald-600/20";
      case "UTILITY": return "bg-blue-600/10 text-blue-700 border border-blue-600/20";
      case "OPINION": return "bg-rose-600/10 text-rose-700 border border-rose-600/20";
      default: return "bg-neutral-100 text-neutral-600 border border-black/5";
    }
  };

  const filteredPosts = activeTab === "All" ? posts : posts.filter(p => p.post_type === activeTab.toUpperCase().replace(/S$/, ''));

  return (
    <div className="w-full min-h-screen bg-transparent relative flex flex-col md:flex-row overflow-hidden">
      {showPersonalityPrompt && (
        <PersonalityPrompt
          user_id={user_id}
          onComplete={() => setHasCompletedPersonality(true)}
        />
      )}
      <div className="flex-1 max-w-full md:max-w-3xl mx-auto w-full min-w-0 min-h-screen relative pb-20 overflow-x-hidden">  {/* Top Header - Mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-black/5 pt-[calc(env(safe-area-inset-top)+64px)] px-4 pb-3 overflow-x-auto hide-scrollbar flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-white/40 backdrop-blur-sm text-neutral-500 hover:text-black hover:bg-white border border-black/5 shadow-[0_1px_8px_rgba(0,0,0,0.01)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top Header - Desktop */}
        <div className="hidden md:flex sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-black/5 px-6 py-4 gap-3 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-white/40 backdrop-blur-sm text-neutral-500 hover:text-black hover:bg-white border border-black/5 shadow-[0_1px_8px_rgba(0,0,0,0.01)]'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="p-4 sm:p-6 space-y-4">

          {/* Pinned Posts Section (Clubs/Events) - Dynamic Form */}
          <div className="mb-10 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Featured Events</span>
              <Badge variant="outline" className="text-[9px] border-emerald-600/20 bg-emerald-500/5 text-emerald-700 px-1.5 py-0">LIVE</Badge>
            </div>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
              {eventsLoading ? (
                <div className="w-full h-[180px] rounded-[32px] border border-dashed border-black/10 bg-white/40 animate-pulse" />
              ) : featuredEvents.length === 0 ? (
                <div className="w-full py-10 bg-white/40 border border-dashed border-black/10 rounded-[32px] flex flex-col items-center justify-center text-center px-6">

                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-300">
                    📅
                  </div>

                  <p className="text-[11px] text-neutral-400 uppercase tracking-[0.15em] font-bold">
                    No Featured Events Today
                  </p>

                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1">
                  {featuredEvents.map((evt) => (
                    <Link
                      key={evt.event_id}
                      href={`/events/${evt.event_id}`}
                    >
                      <div className="min-w-[240px] bg-white/80 backdrop-blur-sm border border-black/5 rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:bg-white hover:border-black/10">

                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 rounded-xl bg-white overflow-hidden border border-black/5">
                            {evt.clubs?.logo_url ? (
                              <img
                                src={evt.clubs.logo_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                📅
                              </div>
                            )}
                          </div>

                          <span className="text-xs font-semibold text-neutral-700 truncate">
                            {evt.clubs?.club_name || "Campus Event"}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-[#0f0f10] line-clamp-2">
                          {evt.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-dmserif font-semibold text-[#0f0f10]">Campus Pulse</h1>
              <p className="text-neutral-500">What&apos;s happening on campus right now.</p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab !== "All" && (
                <Badge className="bg-[#505f78]/10 text-[#505f78] border-[#505f78]/20">Showing {activeTab}s</Badge>
              )}
              <Button onClick={() => setIsFabOpen(true)} className="bg-black hover:bg-[#505f78] text-white rounded-full flex items-center gap-2 px-5 font-semibold text-xs h-9">
                <PlusIcon className="w-4 h-4" /> Create Post
              </Button>
            </div>
          </div>

          {/* Fallback prompt banner when no interests selected */}
          {(!interests || interests.length === 0) && (
            <Card className="p-6 bg-[#855300]/5 backdrop-blur-sm border border-[#855300]/10 rounded-[24px] shadow-sm space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#855300]/10 border border-[#855300]/20 flex items-center justify-center text-[#855300] shrink-0">
                  <span className="text-lg">✨</span>
                </div>
                <div className="space-y-1">
                  <h3 className="font-dmserif font-bold text-lg text-[#0f0f10]">Personalize Your Feed</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    You haven&apos;t selected any interests yet. Setup your interests to see discussions, events, and clubs custom-tailored to your exact vibe!
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pl-[52px]">
                <Link href="/profile/me">
                  <Button className="h-9 px-5 bg-black hover:bg-[#505f78] text-white font-semibold rounded-full text-xs transition-colors">
                    Set Interests
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4"></div>
              <p>Loading your campus pulse...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No posts yet. Be the first to post something!</p>
            </div>
          ) : filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user_id={user_id}
              onDelete={() => handleDeletePost(post.id)}
              isSaved={savedPosts.includes(post.id)}
              onSave={() => toggleSavePost(post.id)}
            />
          ))}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsFabOpen(true)}
        className="absolute bottom-0 md:bottom-0 right-10 md:right-16 w-14 h-14 bg-black hover:bg-[#505f78] active:scale-95 transition-all text-white rounded-full shadow-md flex items-center justify-center z-40"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Create Post Modal */}
      {isFabOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#faf9f6]/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-black/5 sm:rounded-[24px] rounded-t-[24px] shadow-2xl safe-area-bottom animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-black/5">
              <h3 className="text-lg font-dmserif font-semibold text-[#0f0f10]">Create Post</h3>
              <button onClick={() => { setIsFabOpen(false); setIsAnonymous(false); }} className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {["TIP", "QUESTION", "EVENT", "UTILITY", "OPINION"].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setPostTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${postTag === tag ? getTagColor(tag) : 'bg-white/40 border-black/5 text-neutral-500 hover:text-black hover:bg-white'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="min-h-[150px] bg-white/60 border border-black/5 rounded-[18px] p-3.5 focus-visible:ring-0 text-sm resize-none placeholder:text-neutral-400 focus:border-black/10 focus:bg-white transition-colors"
              />

              {/* Media Upload for Clubs */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <button className={`px-3 py-1.5 rounded-full border flex items-center gap-2 text-xs font-semibold bg-white/40 border-black/5 hover:bg-white hover:border-black/10 transition-all ${role === 'club' ? 'text-[#505f78]' : 'text-neutral-400 cursor-not-allowed'}`}>
                    <PlusIcon className="w-4 h-4" /> Add Photo/Video
                  </button>
                  {role !== 'club' && (
                    <p className="text-[10px] text-muted-foreground italic">Only clubs can post media for now.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-black/5 transition-colors flex items-center gap-2 ${isAnonymous ? 'bg-black text-white border border-black/10' : 'text-neutral-700 bg-white/40 hover:bg-white hover:border-black/10'}`}
                >
                  <LockIcon className="w-4 h-4" /> {isAnonymous ? 'Posting Anonymously' : 'Anonymous'}
                </button>
                <Button
                  className={`px-6 rounded-full font-semibold ${postTag && postContent.trim() ? 'bg-black text-white hover:bg-[#505f78]' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    }`}
                  disabled={!postTag || !postContent.trim() || isPosting}
                  onClick={handleCreatePost}
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}