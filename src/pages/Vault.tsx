import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Vault() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("vault_items")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      setItems(data || []);
      setLoading(false);
    })();
  }, [user]);

  const remove = async (id: string) => {
    await supabase.from("vault_items").delete().eq("id", id);
    setItems((s) => s.filter((x) => x.id !== id));
    toast.success("Removed");
  };

  return (
    <div className="pb-28 min-h-screen">
      <PageHeader title="Hair Vault" subtitle="Save inspirations. Reference them when you book — the stylist sees exactly what you want." />
      <div className="container-app">
        {loading && <div className="skeleton h-72 rounded-3xl" />}
        {!loading && items.length === 0 && (
          <div className="card p-8 text-center text-mute">
            Your Vault is empty. Tap <strong>Save</strong> on any post in the feed to add it here.
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <div key={it.id} className="relative group">
              <img src={it.image_url} className="w-full aspect-[3/4] rounded-2xl object-cover" />
              <button
                onClick={() => remove(it.id)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-cream/95"
              >
                <Trash2 className="h-4 w-4 text-terracotta-600" />
              </button>
              {it.category && <span className="absolute left-2 bottom-2 chip text-[10px]">{it.category}</span>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
