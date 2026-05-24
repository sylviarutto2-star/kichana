import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { SmartImage } from "@/components/SmartImage";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Vault() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("vault_items")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Vault: query failed", error);
          if (!cancelled) toast.error(error.message || "Couldn't load your Vault.");
        }
        if (!cancelled) setItems(data || []);
      } catch (e) {
        console.error("Vault: fetch threw", e);
        if (!cancelled) toast.error("Couldn't load your Vault. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this from your Vault?")) return;
    const prev = items;
    setItems((s) => s.filter((x) => x.id !== id));
    const { error } = await supabase.from("vault_items").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error("Couldn't remove — try again.");
      return;
    }
    toast.success("Removed");
  };

  return (
    <div className="pb-nav-cta min-h-screen">
      <PageHeader title="Hair Vault" subtitle="Save inspirations. Reference them when you book — the stylist sees exactly what you want." />
      <div className="container-app">
        {loading && <div className="skeleton h-72 rounded-3xl" />}
        {!loading && items.length === 0 && (
          <div className="card p-8 text-center text-mute">
            <div className="font-display text-xl text-ink">Your Vault is empty</div>
            <p className="text-sm mt-2">Tap <strong>Save</strong> on any post in the feed to save inspiration here. Your stylist sees it before your appointment.</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.id} className="relative group">
              <SmartImage
                src={it.image_url}
                fallbackKey={it.id}
                fallbackLabel={it.category || "Inspiration"}
                alt={it.category || "Saved inspiration"}
                className="w-full aspect-[3/4] rounded-2xl"
              />
              <button
                onClick={() => remove(it.id)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-cream/95"
              >
                <Trash2 className="h-4 w-4 text-terracotta-600" />
              </button>
              {it.category && <span className="absolute left-2 bottom-2 chip text-[11px]">{it.category}</span>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
