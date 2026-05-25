import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LogOut, Award, Languages, Phone, MapPin, Settings, Scissors } from "lucide-react";
import { NAIROBI_AREAS, isValidPhone, withTimeout } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";

function AdminLink() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any).rpc("is_admin");
      if (!cancelled) setShow(data === true);
    })();
    return () => { cancelled = true; };
  }, []);
  if (!show) return null;
  return <Link to="/admin/disputes" className="btn-outline w-full mt-2">Admin · disputes</Link>;
}

export default function Profile() {
  const { profile, signOut, refreshProfile, user, loading } = useAuth();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    neighborhood: profile?.neighborhood || "Westlands",
    language: profile?.language || "en",
    hair_type: profile?.hair_type || "",
    allergies: profile?.allergies || "",
  });

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      neighborhood: profile.neighborhood || "Westlands",
      language: profile.language || "en",
      hair_type: profile.hair_type || "",
      allergies: profile.allergies || "",
    });
  }, [profile]);

  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!user) return;
    if (form.phone && !isValidPhone(form.phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await withTimeout(
        supabase.from("profiles").update(form).eq("id", user.id),
        15000,
        "Saving profile",
      );
      if (error) { toast.error(error.message); setSaving(false); return; }
    } catch (e: any) {
      console.error("Profile save failed:", e);
      toast.error(e.message || "Couldn't save");
      setSaving(false);
      return;
    }
    setSaving(false);
    await refreshProfile();
    setEditing(false);
    toast.success("Saved");
  };

  if (loading) return <LoadingScreen />;

  if (!profile) {
    return (
      <div className="pb-nav-cta min-h-screen">
        <PageHeader title="Me" />
        <div className="container-app">
          <div className="card p-5 mt-4 text-sm space-y-3">
            <div className="font-display text-lg">Finish setting up your account</div>
            <p className="text-mute">A few quick details to complete your profile.</p>
            <button className="btn-primary w-full" onClick={() => nav("/onboarding")}>
              Complete onboarding
            </button>
            <button className="btn-outline w-full text-terracotta-600" onClick={async () => { await signOut(); nav("/"); }}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="pb-nav-cta min-h-screen">
      <PageHeader title="Me" />
      <div className="container-app">
        <div className="card p-5 flex items-center gap-4">
          <Avatar src={profile.avatar_url} name={profile.full_name} size={64} />
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl truncate">{profile.full_name || "Unnamed"}</div>
            <div className="text-xs text-mute capitalize">{profile.role}</div>
          </div>
          <button onClick={() => setEditing(!editing)} className="btn-outline !py-2 !px-3 text-xs">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="card p-5 mt-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gold-400/30 text-aubergine-700"><Award className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="text-xs text-mute">Loyalty points</div>
            <div className="font-display text-2xl">{profile.loyalty_points}</div>
          </div>
          <div className="text-xs text-mute">Earn 1 pt per KES 100 spent</div>
        </div>

        {editing ? (
          <div className="card p-5 mt-4 space-y-3">
            <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <div>
              <label className="label">Neighborhood</label>
              <select className="input" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}>
                {NAIROBI_AREAS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value as any })}>
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            {profile.role === "customer" && (
              <>
                <Field label="Hair type" value={form.hair_type} onChange={(v) => setForm({ ...form, hair_type: v })} />
                <Field label="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} />
              </>
            )}
            <button className="btn-primary w-full" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <div className="card p-5 mt-4 space-y-3 text-sm">
            <Info icon={<Phone className="h-4 w-4" />} k="Phone" v={profile.phone || "—"} />
            <Info icon={<MapPin className="h-4 w-4" />} k="Area" v={profile.neighborhood || "—"} />
            <Info icon={<Languages className="h-4 w-4" />} k="Language" v={profile.language === "sw" ? "Kiswahili" : "English"} />
            {profile.role === "customer" && (
              <>
                <Info icon={<Scissors className="h-4 w-4" />} k="Hair type" v={profile.hair_type || "—"} />
                <Info icon={<Settings className="h-4 w-4" />} k="Allergies" v={profile.allergies || "—"} />
              </>
            )}
          </div>
        )}

        {profile.role === "stylist" && (
          <Link to="/studio" className="btn-dark w-full mt-4">Open Studio</Link>
        )}

        <AdminLink />

        <button
          onClick={async () => { await signOut(); nav("/"); }}
          className="mt-6 w-full btn-outline text-terracotta-600"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Info({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-mute">{icon}</span>
      <span className="text-mute w-24 text-xs uppercase tracking-wider">{k}</span>
      <span className="flex-1 text-right">{v}</span>
    </div>
  );
}
