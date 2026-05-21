import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Scissors, Plus, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { SmartImage } from "@/components/SmartImage";
import { CommentSheet } from "@/components/CommentSheet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { demoFeed, demoStylists } from "@/lib/demoData";
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

type ReactionKind = "heart" | "scissors";
const isDemo = (id: string) => id.startsWith("demo-");

export default function Home() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myReactions, setMyReactions] = useState<Record<string, Set<ReactionKind>>>({});
  const [openComments, setOpenComments] = useState<FeedRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("feed_posts")
          .select(
            "id, image_url, caption, category, likes_count, comments_count, created_at, stylist_id, profiles!feed_posts_author_id_fkey(full_name, avatar_url), stylists(display_name)"
          )
          .order("created_at", { ascending: false })
          .limit(60);
        if (error) console.error("Home: feed_posts query failed", error);
        let rows: FeedRow[] = (data || []).map((r: any) => ({
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
        if (rows.length < 5) rows = [...rows, ...demoFeed];
        if (!cancelled) setPosts(rows);
      } catch {
        if (!cancelled) setPosts([...demoFeed]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!profile) {
      setMyReactions({});
      return;
    }
    const realIds = posts.map((p) => p.id).filter((id) => !isDemo(id));
    if (realIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("feed_reactions")
        .select("post_id, kind")
        .eq("user_id", profile.id)
        .in("post_id", realIds);
      if (cancelled || error || !data) return;
      const map: Record<string, Set<ReactionKind>> = {};
      for (const r of data as { post_id: string; kind: string }[]) {
        if (r.kind !== "heart" && r.kind !== "scissors") continue;
        (map[r.post_id] ??= new Set()).add(r.kind as ReactionKind);
      }
      setMyReactions(map);
    })();
    return () => { cancelled = true; };
  }, [profile?.id, posts.length]);

  const toggleReaction = async (post: FeedRow, kind: ReactionKind) => {
    if (!profile) {
      toast.error("Sign in to react");
      return;
    }
    const prevSet = myReactions[post.id] ?? new Set<ReactionKind>();
    const active = prevSet.has(kind);
    const nextSet = new Set(prevSet);
    if (active) nextSet.delete(kind); else nextSet.add(kind);

    setMyReactions((m) => ({ ...m, [post.id]: nextSet }));
    if (kind === "heart") {
      setPosts((ps) =>
        ps.map((x) =>
          x.id === post.id ? { ...x, likes_count: x.likes_count + (active ? -1 : 1) } : x
        )
      );
    }

    if (isDemo(post.id)) return;

    const revert = () => {
      setMyReactions((m) => ({ ...m, [post.id]: prevSet }));
      if (kind === "heart") {
        setPosts((ps) =>
          ps.map((x) =>
            x.id === post.id ? { ...x, likes_count: x.likes_count + (active ? 1 : -1) } : x
          )
        );
      }
    };

    if (active) {
      const { error } = await supabase
        .from("feed_reactions")
        .delete()
        .match({ post_id: post.id, user_id: profile.id, kind });
      if (error) { revert(); toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("feed_reactions")
        .insert({ post_id: post.id, user_id: profile.id, kind });
      if (error) { revert(); toast.error(error.message); return; }
      if (kind === "scissors" && post.stylist_id) {
        toast.success("Stylist notified ✂️");
      }
    }

    if (kind === "heart") {
      const newCount = post.likes_count + (active ? -1 : 1);
      await supabase.from("feed_posts").update({ likes_count: newCount }).eq("id", post.id);
    }
  };

  const bumpCommentsCount = (postId: string) => {
    setPosts((ps) =>
      ps.map((x) => (x.id === postId ? { ...x, comments_count: x.comments_count + 1 } : x))
    );
  };

  const saveToVault = async (
    image_url: string,
    source_post_id: string,
    category: string | null
  ) => {
    if (!profile) return;
    if (source_post_id.startsWith("demo-")) {
      const { error } = await supabase.from("vault_items").insert({
        owner_id: profile.id,
        image_url,
        category,
        note: null,
      });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("vault_items").insert({
        owner_id: profile.id,
        image_url,
        source_post_id,
        category,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved to your Vault ✨");
  };

  return (
    <div className="pb-24 lg:pb-12 min-h-screen with-sidenav">
      {/* Mobile header (sidebar shows logo on desktop) */}
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
          <Link
            to="/post"
            className="hidden lg:inline-flex btn-primary"
          >
            <Plus className="h-4 w-4" /> Share a look
          </Link>
        </div>
      </div>

      {/* Desktop: two-column with sticky right rail. Mobile: single column. */}
      <div className="container-shell mt-6 lg:mt-10 lg:grid lg:grid-cols-[1fr_320px] lg:gap-10">
        {/* Feed */}
        <section className="lg:min-w-0">
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-96 rounded-3xl" />
              ))}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <article
                key={p.id}
                className="card overflow-hidden animate-fade-up flex flex-col"
              >
                <div className="flex items-center gap-3 p-4">
                  <Avatar src={p.avatar_url} name={p.author_name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {p.author_name || "Kichana user"}
                    </div>
                    <div className="text-xs text-mute truncate">
                      {p.stylist_name ? (
                        <>
                          at <span className="text-ink">{p.stylist_name}</span>
                        </>
                      ) : (
                        "Posted a look"
                      )}
                      <span>
                        {" · "}
                        {formatDistanceToNow(new Date(p.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  {p.stylist_id && (
                    <Link
                      to={
                        p.stylist_id.startsWith("demo-")
                          ? `/stylist/${p.stylist_id}`
                          : `/book/${p.stylist_id}`
                      }
                      className="btn-primary !py-2 !px-3 text-xs"
                    >
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
                    {(() => {
                      const heartActive = myReactions[p.id]?.has("heart");
                      const scissorsActive = myReactions[p.id]?.has("scissors");
                      return (
                        <>
                          <button
                            onClick={() => toggleReaction(p, "heart")}
                            className={`flex items-center gap-1 text-xs hover:text-terracotta-600 ${heartActive ? "text-terracotta-600" : ""}`}
                            aria-pressed={heartActive}
                          >
                            <Heart className="h-4 w-4" fill={heartActive ? "currentColor" : "none"} /> {p.likes_count}
                          </button>
                          <button
                            onClick={() => setOpenComments(p)}
                            className="flex items-center gap-1 text-xs hover:text-terracotta-600"
                          >
                            <MessageCircle className="h-4 w-4" /> {p.comments_count}
                          </button>
                          <button
                            onClick={() => toggleReaction(p, "scissors")}
                            className={`flex items-center gap-1 text-xs hover:text-aubergine-700 ${scissorsActive ? "text-aubergine-700" : ""}`}
                            aria-pressed={scissorsActive}
                          >
                            <Scissors className="h-4 w-4" fill={scissorsActive ? "currentColor" : "none"} />
                            <span className="hidden xl:inline">I'd book this</span>
                          </button>
                        </>
                      );
                    })()}
                    <button
                      onClick={() =>
                        saveToVault(p.image_url, p.id, p.category)
                      }
                      className="ml-auto flex items-center gap-1 text-xs hover:text-terracotta-600"
                    >
                      <Bookmark className="h-4 w-4" /> Save
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Right rail (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-8 space-y-5">
            <div className="card p-5">
              <div className="flex items-center gap-2 h-eyebrow">
                <Sparkles className="h-3.5 w-3.5" /> Trending in Nairobi
              </div>
              <ul className="mt-4 space-y-3">
                {demoStylists.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/stylist/${s.id}`}
                      className="flex items-center gap-3 group"
                    >
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
                          {s.rating_avg.toFixed(1)}★ ({s.rating_count})
                        </div>
                      </div>
                      <div className="text-xs text-mute">{KES(s.from_kes)}</div>
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

            <div className="card p-5 bg-aubergine-700 text-cream relative overflow-hidden">
              <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_80%_20%,rgba(216,168,90,0.6),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-center gap-2 text-cream/70 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  <Calendar className="h-3.5 w-3.5" /> Book again
                </div>
                <p className="mt-3 font-display text-2xl leading-tight">
                  Loved your last look? One tap to rebook your stylist.
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
                {[
                  "Braids",
                  "Wigs",
                  "Locs",
                  "Natural",
                  "Color",
                  "Nails",
                  "Barber",
                  "Lashes",
                ].map((c) => (
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

      {openComments && (
        <CommentSheet
          postId={openComments.id}
          postCommentsCount={openComments.comments_count}
          onClose={() => setOpenComments(null)}
          onCommentAdded={() => bumpCommentsCount(openComments.id)}
        />
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
