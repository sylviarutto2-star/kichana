import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, X, ImagePlus, Trash2 } from "lucide-react";
import { StarPicker } from "@/components/ReviewStars";
import { withTimeout } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  booking: {
    id: string;
    stylist_id: string;
    customer_id: string;
    stylists?: { display_name?: string | null } | null;
    services?: { title?: string | null } | null;
  } | null;
  onSubmitted?: (rating: number) => void;
};

const MAX_PHOTOS = 4;
const MAX_PHOTO_MB = 5;

export function LeaveReviewModal({ open, onClose, booking, onSubmitted }: Props) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setBody("");
      setFiles([]);
    }
  }, [open, booking?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open || !booking) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_PHOTOS) break;
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${f.name} is bigger than ${MAX_PHOTO_MB}MB`);
        continue;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const submit = async () => {
    if (rating < 1) return toast.error("Pick a rating first");
    setSubmitting(true);
    try {
      // Upload any photos to the public 'reviews' bucket. Falls back gracefully
      // if the bucket does not exist — the review still saves without photos.
      const photo_urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${booking.customer_id}/${booking.id}/${Date.now()}-${i}-${f.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const up = await supabase.storage.from("reviews").upload(path, f, { upsert: false });
        if (up.error) {
          console.error("review photo upload failed", up.error);
          toast.error("Couldn't upload photo, saving review without it.");
          continue;
        }
        const { data: pub } = supabase.storage.from("reviews").getPublicUrl(path);
        if (pub?.publicUrl) photo_urls.push(pub.publicUrl);
      }

      const { error } = await withTimeout(
        supabase.from("reviews" as any).insert({
          booking_id: booking.id,
          stylist_id: booking.stylist_id,
          customer_id: booking.customer_id,
          rating,
          body: body.trim() || null,
          photo_urls,
        }),
        15000,
        "Posting review",
      );
      if (error) {
        if ((error as any).code === "23505") {
          toast.error("You already reviewed this booking.");
        } else {
          toast.error(error.message || "Couldn't post review.");
        }
        return;
      }
      toast.success("Review posted. Thank you!");
      onSubmitted?.(rating);
      onClose();
    } catch (e: any) {
      console.error("LeaveReviewModal: submit threw", e);
      toast.error(e?.message || "Couldn't post review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-ink/40 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full sm:max-w-md bg-cream rounded-t-3xl sm:rounded-3xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="review-modal-title" className="font-display text-2xl">Rate your appointment</h2>
            <p className="text-xs text-mute mt-1 truncate">
              {booking.services?.title || "Service"} · {booking.stylists?.display_name || "Stylist"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-line"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 text-center">
          <StarPicker value={rating} onChange={setRating} />
          <div className="text-xs text-mute mt-1.5 h-4">
            {["", "Not good", "Could be better", "Decent", "Great", "Excellent"][rating]}
          </div>
        </div>

        <textarea
          className="input mt-4"
          rows={4}
          placeholder="Tell future clients what the appointment was like (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
        />
        <div className="text-[11px] text-mute text-right -mt-2">{body.length}/1000</div>

        <div className="mt-3">
          <div className="grid grid-cols-4 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-line">
                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                <button
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-cream/95"
                  aria-label="Remove photo"
                >
                  <Trash2 className="h-3 w-3 text-terracotta-600" />
                </button>
              </div>
            ))}
            {files.length < MAX_PHOTOS && (
              <label className="aspect-square rounded-xl border border-dashed border-line grid place-items-center cursor-pointer hover:bg-line/40">
                <ImagePlus className="h-5 w-5 text-mute" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </label>
            )}
          </div>
          <p className="text-[11px] text-mute mt-1.5">
            Add up to {MAX_PHOTOS} photos (max {MAX_PHOTO_MB}MB each). Honest before/after pictures help other clients.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || rating < 1}
          className="btn-primary w-full mt-5"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Posting…" : "Post review"}
        </button>
        <p className="text-[11px] text-mute mt-2 text-center">
          Reviews are public and tied to your name. They cannot be deleted later.
        </p>
      </div>
    </div>
  );
}
