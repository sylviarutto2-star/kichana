import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, Scissors, Plus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
import { SmartImage } from "@/components/SmartImage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { demoFeed } from "@/lib/demoData";
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

export default function Home() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<FeedRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("feed_posts")
        .select("id, image_url, caption, category, likes_count, comments_count, created_at, stylist_id, profiles!feed_posts_author_id_fkey(full_name, avatar_url), stylists(display_name)")
        .order("created_at", { ascending: false })
        .limit(40);
      let rows: FeedRow[] = (data || []).map((r: any) => ({
        id: r.id, image_url: r.image_url, caption: r.caption, category: r.category,
        likes_count: r.likes_count, comments_count: r.comments_count, created_at: r.created_at,
        stylist_id: r.stylist_id,
        author_name: r.profiles?.full_name, avatar_url: r.profiles?.avatar_url,
        stylist_name: r.stylists?.display_name,
      }));
      if (rows.length < 5) rows = [...rows, ...demoFeed];
      setPosts(rows);
      setLoading(false);
    })();
  }, []);

  const saveToVault = async (image_url: string, source_post_id: string, category: string | null) => {
    if (!profile) return;
    if (source_post_id.startsWith("demo-")) {
      // store image only, no source link (avoids FK violation)
      const { error } = await supabase.from("vault_items").insert({
        owner_id: profile.id, image_url, category, note: null,
      });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("vault_items").insert({
        owner_id: profile.id, image_url, source_post_id, category,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved to your Vault ✨");
  };

  return (
    <div className="pb-24 min-h-screen">
      <header className="container-app pt-6 flex items-center justify-between">
        <Logo />
        <Link to="/post" className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream">
          <Plus className="h-5 w-5" />
        </Link>
      </header>

      <div className="container-app pt-4">
        <p className="h-eyebrow">For you</p>
        <h1 className="font-display text-3xl mt-1">{greeting()}, {profile?.full_name?.split(" ")[0] || "you"}.</h1>
        <p className="text-mute text-sm mt-1">Today's looks from Nairobi.</p>
      </div>

      <div className="container-app mt-6 space-y-5">
        {loading && [1,2,3].map((i) => <div key={i} className="skeleton h-96 rounded-3xl" />)}
        {posts.map((p) => (
          <article key={p.id} className="card overflow-hidden animate-fade-up">
            <div className="flex items-center gap-3 p-4">
              <Avatar src={p.avatar_url} name={p.author_name} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.author_name || "Kichana user"}</div>
                <div className="text-xs text-mute truncate">
                  {p.stylist_name ? <>at <span className="text-ink">{p.stylist_name}</span></> : "Posted a look"}
                  <span> · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                </div>
              </div>
              {p.stylist_id && !p.stylist_id.startsWith("demo-") && (
                <Link to={`/book/${p.stylist_id}`} className="btn-primary !py-2 !px-3 text-xs">Book this</Link>
              )}
              {p.stylist_id?.startsWith("demo-") && (
                <Link to={`/stylist/${p.stylist_id}`} className="btn-primary !py-2 !px-3 text-xs">Book this</Link>
              )}
            </div>
            <SmartImage src={p.image_url} fallbackKey={p.id} fallbackLabel={p.category || "Kichana"} className="w-full aspect-[4/5]" alt={p.caption || ""} />
            <div className="p-4">
              {p.caption && <p className="text-sm">{p.caption}</p>}
              <div className="mt-3 flex items-center gap-4 text-mute">
                <button className="flex items-center gap-1 text-xs hover:text-terracotta-600"><Heart className="h-4 w-4" /> {p.likes_count}</button>
                <button className="flex items-center gap-1 text-xs"><MessageCircle className="h-4 w-4" /> {p.comments_count}</button>
                <button className="flex items-center gap-1 text-xs">🔥</button>
                <button className="flex items-center gap-1 text-xs"><Scissors className="h-4 w-4" /> book intent</button>
                <button onClick={() => saveToVault(p.image_url, p.id, p.category)} className="ml-auto flex items-center gap-1 text-xs hover:text-terracotta-600">
                  <Bookmark className="h-4 w-4" /> Save
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

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
