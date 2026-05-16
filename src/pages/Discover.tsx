import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { StylistCard } from "@/components/StylistCard";
import { NAIROBI_AREAS, SERVICE_CATEGORIES, cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Stylist } from "@/lib/database.types";
import { demoStylists } from "@/lib/demoData";
import { Search } from "lucide-react";

type Row = Stylist & { profile?: { full_name: string | null; avatar_url: string | null }; from_kes?: number };

export default function Discover() {
  const [area, setArea] = useState<string | "all">("all");
  const [cat, setCat] = useState<string | "all">("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stylists")
        .select("*, profiles:profiles!stylists_profile_id_fkey(full_name, avatar_url), services(price_kes)")
        .order("rating_avg", { ascending: false })
        .limit(60);
      const live: Row[] = (data || []).map((s: any) => ({
        ...s, profile: s.profiles,
        from_kes: s.services?.length ? Math.min(...s.services.map((x: any) => x.price_kes)) : undefined,
      }));
      setRows(live.length ? live : (demoStylists as any));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((s) => {
      if (area !== "all" && !(s.neighborhoods || []).includes(area)) return false;
      if (cat !== "all" && !(s.specialties || []).some((x) => x.toLowerCase().includes(cat))) return false;
      if (q && !(`${s.display_name} ${s.bio}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [rows, area, cat, q]);

  return (
    <div className="pb-28 min-h-screen">
      <PageHeader title="Discover" subtitle="Nairobi's best, sorted by rating." />

      <div className="container-app">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search braids, wigs, names…"
            className="input pl-9"
          />
        </div>

        <div className="mt-4 -mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setCat("all")} className={cn("shrink-0", cat === "all" ? "chip-active" : "chip")}>All</button>
          {SERVICE_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={cn("shrink-0", cat === c.id ? "chip-active" : "chip")}>
              <span className="mr-1">{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>

        <div className="mt-3 -mx-5 px-5 flex gap-2 overflow-x-auto no-scrollbar">
          <button onClick={() => setArea("all")} className={cn("shrink-0", area === "all" ? "chip-active" : "chip")}>All Nairobi</button>
          {NAIROBI_AREAS.map((a) => (
            <button key={a} onClick={() => setArea(a)} className={cn("shrink-0", area === a ? "chip-active" : "chip")}>{a}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          {loading && [1,2,3].map((i) => <div key={i} className="skeleton h-72 rounded-3xl" />)}
          {!loading && filtered.length === 0 && (
            <div className="card p-6 text-center text-mute">No matches. Try a different area or category.</div>
          )}
          {filtered.map((s) => (
            <StylistCard key={s.id} s={s as any} fromKes={s.from_kes} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
