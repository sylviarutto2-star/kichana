import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { X, Upload, Loader2 } from "lucide-react";

type Reason = "stylist_no_show" | "service_not_delivered" | "health_emergency" | "other";

const REASON_LABELS: Record<Reason, string> = {
  stylist_no_show: "Stylist didn't show up",
  service_not_delivered: "Service wasn't delivered as agreed",
  health_emergency: "Health or family emergency",
  other: "Something else",
};

type Props = {
  bookingId: string;
  userId: string;
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
};

export function DisputeModal({ bookingId, userId, open, onClose, onSubmitted }: Props) {
  const [reason, setReason] = useState<Reason>("stylist_no_show");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (next.length >= 4) break;
      if (!f.type.startsWith("image/")) continue;
      next.push(f);
    }
    setFiles(next);
  };

  const submit = async () => {
    if (description.trim().length < 10) {
      toast.error("Add a bit more detail (10 characters minimum).");
      return;
    }
    setSubmitting(true);
    try {
      const evidenceUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const ext = f.name.split(".").pop() || "jpg";
        const path = `${userId}/${bookingId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("dispute-evidence")
          .upload(path, f, { upsert: false });
        if (upErr) {
          toast.error(`Couldn't upload ${f.name}.`);
          continue;
        }
        evidenceUrls.push(path);
      }

      const { error } = await (supabase as any).from("disputes").insert({
        booking_id: bookingId,
        customer_id: userId,
        reason,
        description: description.trim(),
        evidence_urls: evidenceUrls,
      });
      if (error) {
        toast.error(error.message || "Couldn't submit your dispute.");
        setSubmitting(false);
        return;
      }
      toast.success("Dispute submitted. We'll review and email you within 48 hours.");
      onSubmitted();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40" onClick={onClose}>
      <div
        className="card w-full max-w-lg p-5 rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="font-display text-xl">Request a refund</div>
          <button onClick={onClose} className="p-1" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-mute mb-4">
          Tell us what happened. We review every dispute within 48 hours and refund
          the deposit when the situation warrants it.
        </p>

        <label className="block text-xs uppercase tracking-wider text-mute mb-1">Reason</label>
        <select
          className="input mb-3"
          value={reason}
          onChange={(e) => setReason(e.target.value as Reason)}
        >
          {(Object.keys(REASON_LABELS) as Reason[]).map((k) => (
            <option key={k} value={k}>{REASON_LABELS[k]}</option>
          ))}
        </select>

        <label className="block text-xs uppercase tracking-wider text-mute mb-1">What happened</label>
        <textarea
          rows={4}
          className="input mb-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="When and how it happened, what was agreed, anything we should know."
        />

        <label className="block text-xs uppercase tracking-wider text-mute mb-1">Photos (optional, up to 4)</label>
        <label className="btn-outline w-full flex items-center justify-center gap-2 mb-2 cursor-pointer">
          <Upload className="h-4 w-4" /> Add photo
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {files.map((f, i) => (
              <div key={i} className="aspect-square rounded-lg bg-line overflow-hidden text-xs text-mute flex items-center justify-center p-1 text-center break-all">
                {f.name}
              </div>
            ))}
          </div>
        )}

        <button
          className="btn-primary w-full"
          disabled={submitting}
          onClick={submit}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </span>
          ) : (
            "Submit dispute"
          )}
        </button>
      </div>
    </div>
  );
}
