import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Scissors, Plus, Sparkles, Calendar, ArrowRight, X, Send } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { SmartImage } from "@/components/SmartImage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { KES } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type FeedRow = {
  id: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  stylist_id: string | null;
  author_name?: string;
  stylist_name?: string;
  avatar_url?: string;
};

type TrendingStylist = {
  id: string;
  display_name: string;
  hero_image_url: string | null;
  specialties: string[];
  rating_avg: number;
  from_kes?: number;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export default function Home() {
  const { profile, user } = useAuth();
  const nav = useNavigate();
  const [posts, setPosts] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [trending, setTrending] = useState<TrendingStylist[]>([]);

  // Comments panel state
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [postsRes, reactionsRes, trendingRes] = await Promise.all([
          supabase
            .from("feed_posts")
            .select(
              "id, image_url, caption, category, likes_count, comments_count, created_at, stylist_id, profiles!feed_posts_author_id_fkey(full_name, avatar_url), stylists(display_name)"
            )
            .order("created_at", { ascending: false })
            .limit(60),
          user
            ? supabase
                .from("feed_reactions")
                .select("post_id")
                .eq("user_id", user.id)
                .eq("kind", "heart")
            : Promise.resolve({ data: [] }),
          supabase
            .from("stylists")
            .select("id, display_name, hero_image_url, specialties, rating_avg, services(price_kes)")
            .order("rating_avg", { ascending: false })
            .limit(4),
        ]);

        if (!cancelled) {
          const rows: FeedRow[] = ((postsRes.data || []) as any[]).map((r) => ({
            id: r.id,
            image_url: r.image_url,
            caption: r.caption,
            category: r.category,
            likes_count: r.likes_count,
            comments_count: r.comments_count,
            created_at: r.created_at,
            stylist_id: r.stylist_id,
            author_name: r.profiles?.full_name,
            avatar_url: r.profiles?.avatar_url,
            stylist_name: r.stylists?.display_name,
          }));
          setPosts(rows);

          const likedSet = new Set<string>(
            ((reactionsRes.data || []) as any[]).map((r) => r.post_id)
          );
          setLiked(likedSet);

          const trendingRows: TrendingStylist[] = ((trendingRes.data || []) as any[]).map((s) => {
            const prices: number[] = (s.services || []).map((x: any) => x.price_kes);
            return {
              id: s.id,
              display_name: s.display_name,
              hero_image_url: s.hero_image_url,
              specialties: s.specialties || [],
              rating_avg: s.rating_avg,
              from_kes: prices.length ? Math.min(...prices) : undefined,
            };
          });
          setTrending(trendingRows);
        }
      } catch (e) {
        console.error("Home: feed fetch threw", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggleLike = async (post: FeedRow) => {
    if (!user) { toast.error("Sign in to like posts."); return; }
    const isLiked = liked.has(post.id);
    // Optimistic update
    setLiked((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(post.id); else next.add(post.id);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
          : p
      )
    );
    try {
      if (isLiked) {
        const { error } = await supabase
          .from("feed_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .eq("kind", "heart");
        if (error) throw error;
        await supabase
          .from("feed_posts")
          .update({ likes_count: Math.max(0, post.likes_count - 1) })
          .eq("id", post.id);
      } else {
        const { error } = await supabase
          .from("feed_reactions")
          .insert({ post_id: post.id, user_id: user.id, kind: "heart" });
        if (error) throw error;
        await supabase
          .from("feed_posts")
          .update({ likes_count: post.likes_count + 1 })
          .eq("id", post.id);
      }
    } catch {
      // Rollback on error
      setLiked((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(post.id); else next.delete(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes_count: p.likes_count + (isLiked ? 1 : -1) }
            : p
        )
      );
      toast.error("Couldn't update like — try again.");
    }
  };

  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setComments([]);
    setCommentBody("");
    setCommentsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("feed_comments")
        .select("id, body, created_at, profiles:profiles!feed_comments_user_id_fkey(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch {
      toast.error("Couldn't load comments.");
    } finally {
      setCommentsLoading(false);
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  };

  const submitComment = async () => {
    if (!user || !commentsPostId || !commentBody.trim()) return;
    setSubmittingComment(true);
    const body = commentBody.trim();
    try {
      const { data, error } = await (supabase as any)
        .from("feed_comments")
        .insert({ post_id: commentsPostId, user_id: user.id, body })
        .select("id, body, created_at, profiles:profiles!feed_comments_user_id_fkey(full_name, avatar_url)")
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, data]);
      setCommentBody("");
      // Update comments_count optimistically
      setPosts((prev) =>
        prev.map((p) =>
          p.id === commentsPostId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );
      await supabase
        .from("feed_posts")
        .update({ comments_count: (posts.find((p) => p.id === commentsPostId)?.comments_count ?? 0) + 1 })
        .eq("id", commentsPostId);
    } catch {
      toast.error("Couldn't post comment — try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const saveToVault = async (image_url: string, source_post_id: string, category: string | null) => {
    if (!profile) return;
    const { error } = await supabase.from("vault_items").insert({
      owner_id: profile.id,
      image_url,
      source_post_id,
      category,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to your Vault");
  };

  return (
    <div className="pb-nav lg:pb-12 min-h-screen with-sidenav">
      <header className="container-shell pt-6 flex items-center justify-between lg:hidden">
        <Logo />
        <Link
          to="/post"
          className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream"
          aria-label="New post"
        >
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      <div className="container-shell pt-4 lg:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="h-eyebrow">For you</p>
            <h1 className="font-display text-3xl lg:text-5xl mt-1">
              {greeting()}, {profile?.full_name?.split(" ")[0] || "you"}.
            </h1>
            <p className="text-mute text-sm mt-1">Today's looks from Nairobi.</p>
          </div>
          <Link to="/post" className="hidden lg:inline-flex btn-primary">
            <Plus className="h-4 w-4" /> Share a look
          </Link>
        </div>
      </div>

      <div className="container-shell mt-6 lg:mt-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
        <section className="lg:min-w-0">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-96 rounded-3xl" />
              ))}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="card p-8 text-center text-mute">
              <div className="font-display text-xl text-ink">Nothing here yet</div>
              <p className="text-sm mt-1">Be the first to share a look from your last appointment.</p>
              <Link to="/post" className="btn-primary mt-4 inline-flex">
                <Plus className="h-4 w-4" /> Share a look
              </Link>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <article key={p.id} className="card overflow-hidden animate-fade-up flex flex-col">
                <div className="flex items-center gap-3 p-4">
                  <Avatar src={p.avatar_url} name={p.author_name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {p.author_name || "Kichana user"}
                    </div>
                    <div className="text-xs text-mute truncate">
                      {p.stylist_name ? (
                        <>at <span className="text-ink">{p.stylist_name}</span></>
                      ) : (
                        "Posted a look"
                      )}
                      <span>{" · "}{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  {p.stylist_id && (
                    <Link to={`/book/${p.stylist_id}`} className="btn-primary !py-2 !px-3 text-xs">
                      Book this
                    </Link>
                  )}
                </div>
                <SmartImage
                  src={p.image_url}
                  fallbackKey={p.id}
                  fallbackLabel={p.category || "Kichana"}
                  className="w-full aspect-[4/5]"
                  alt={p.caption || ""}
                />
                <div className="p-4 flex-1 flex flex-col">
                  {p.caption && <p className="text-sm">{p.caption}</p>}
                  <div className="mt-3 flex items-center gap-4 text-mute">
                    <button
                      onClick={() => toggleLike(p)}
                      className={`flex items-center gap-1 text-xs transition-colors ${liked.has(p.id) ? "text-terracotta-600" : "hover:text-terracotta-600"}`}
                      aria-label={liked.has(p.id) ? "Unlike" : "Like"}
                    >
                      <Heart className={`h-4 w-4 ${liked.has(p.id) ? "fill-current" : ""}`} />
                      {p.likes_count}
                    </button>
                    <button
                      onClick={() => openComments(p.id)}
                      className="flex items-center gap-1 text-xs hover:text-ink transition-colors"
                      aria-label="Comments"
                    >
                      <MessageCircle className="h-4 w-4" /> {p.comments_count}
                    </button>
                    <button
                      onClick={() => p.stylist_id ? nav(`/book/${p.stylist_id}`) : nav("/discover")}
                      className="flex items-center gap-1 text-xs hover:text-terracotta-600 transition-colors"
                      aria-label="Book this look"
                    >
                      <Scissors className="h-4 w-4" />
                      <span className="hidden xl:inline">Book this look</span>
                    </button>
                    <button
                      onClick={() => saveToVault(p.image_url, p.id, p.category)}
                      className="ml-auto flex items-center gap-1 text-xs hover:text-terracotta-600 transition-colors"
                    >
                      <Bookmark className="h-4 w-4" /> Save
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-5">
            {trending.length > 0 && (
              <div className="card p-5">
                <div className="flex items-center gap-2 h-eyebrow">
                  <Sparkles className="h-3.5 w-3.5" /> Trending in Nairobi
                </div>
                <ul className="mt-4 space-y-3">
                  {trending.map((s) => (
                    <li key={s.id}>
                      <Link to={`/stylist/${s.id}`} className="flex items-center gap-3 group">
                        <SmartImage
                          src={s.hero_image_url}
                          fallbackKey={s.id}
                          alt={s.display_name}
                          className="h-12 w-12 rounded-xl shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate group-hover:text-terracotta-700">
                            {s.display_name}
                          </div>
                          <div className="text-[11px] text-mute truncate">
                            {s.specialties.slice(0, 2).join(" · ")} ·{" "}
                            {s.rating_avg.toFixed(1)}★
                          </div>
                        </div>
                        {s.from_kes && (
                          <div className="text-xs text-mute">{KES(s.from_kes)}</div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/discover"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-terracotta-700"
                >
                  Explore all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            <div className="card p-5 bg-aubergine-700 text-cream relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_20%,rgba(216,168,90,0.6),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center gap-2 text-cream/70 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <Calendar className="h-3.5 w-3.5" /> Book again
                </div>
                <p className="mt-3 font-display text-2xl leading-tight">
                  Loved your last look? Rebook in one tap.
                </p>
                <Link
                  to="/bookings"
                  className="mt-4 inline-flex btn-primary !bg-cream !text-ink hover:!bg-white"
                >
                  See past bookings <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="card p-5">
              <div className="h-eyebrow">Categories</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Braids", "Wigs", "Locs", "Natural", "Color", "Nails", "Barber", "Lashes"].map((c) => (
                  <Link
                    key={c}
                    to={`/discover?cat=${c.toLowerCase()}`}
                    className="chip hover:border-terracotta-300"
                  >
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Comments panel */}
      {commentsPostId && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Comments">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setCommentsPostId(null)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] flex flex-col rounded-t-3xl bg-cream shadow-pop animate-fade-up">
            <div className="flex items-center justify-between p-4 border-b border-line shrink-0">
              <h2 className="font-semibold">Comments</h2>
              <button
                onClick={() => setCommentsPostId(null)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-line"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {commentsLoading && (
                <div className="text-center text-mute text-sm py-4">Loading…</div>
              )}
              {!commentsLoading && comments.length === 0 && (
                <div className="text-center text-mute text-sm py-4">No comments yet. Be the first.</div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar src={c.profiles?.avatar_url} name={c.profiles?.full_name} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">{c.profiles?.full_name || "User"}</div>
                    <p className="text-sm mt-0.5 break-words">{c.body}</p>
                    <div className="text-[11px] text-mute mt-0.5">
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {user && (
              <div className="p-4 border-t border-line shrink-0 flex gap-2">
                <input
                  ref={commentInputRef}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Add a comment…"
                  className="input flex-1 !py-2"
                  maxLength={500}
                />
                <button
                  onClick={submitComment}
                  disabled={!commentBody.trim() || submittingComment}
                  className="btn-primary !py-2 !px-3 disabled:opacity-50"
                  aria-label="Post comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Habari ya asubuhi";
  if (h < 17) return "Habari ya mchana";
  return "Habari ya jioni";
}
