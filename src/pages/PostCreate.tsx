import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/PageHeader";
import { SERVICE_CATEGORIES, cn, withTimeout } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PostCreate() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<string>("braids");
  const [busy, setBusy] = useState(false);

  // Build the preview URL once per file and revoke it when it changes/unmounts
  // so we don't leak object URLs on repeated visits.
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async () => {
    if (!user || !file) return toast.error("Pick an image first");
    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-z0-9.]/gi, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error: upErr } = await withTimeout(
        supabase.storage.from("feed").upload(path, file, { cacheControl: "3600", upsert: false }),
        30000,
        "Uploading image",
      );
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("feed").getPublicUrl(path);
      const { error } = await withTimeout(
        supabase.from("feed_posts").insert({
          author_id: user.id, image_url: pub.publicUrl, caption, category,
        }),
        15000,
        "Posting",
      );
      if (error) throw error;
      toast.success("Posted ✨");
      nav("/home");
    } catch (e: any) {
      console.error("Post failed:", e);
      toast.error(e.message || "Couldn't post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-24 min-h-screen">
      <PageHeader title="Post a look" subtitle="Photos auto-expire after 90 days." back />
      <div className="container-app space-y-4">
        <label className="card p-6 grid place-items-center text-center cursor-pointer">
          {file && preview ? (
            <img src={preview} className="w-full aspect-[4/5] object-cover rounded-2xl" />
          ) : (
            <>
              <div className="font-semibold">Tap to upload</div>
              <p className="text-xs text-mute mt-1">JPG or PNG · vertical photos look best.</p>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>

        <div>
          <label className="label">Caption</label>
          <textarea rows={3} className="input" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Share what you got done." />
        </div>

        <div>
          <label className="label">Category</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)} className={cn(category === c.id ? "chip-active" : "chip")}>
                <span className="mr-1">{c.emoji}</span>{c.label}
              </button>
            ))}
          </div>
        </div>

        <button disabled={busy || !file} onClick={submit} className="btn-primary w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Post
        </button>
      </div>
    </div>
  );
}
