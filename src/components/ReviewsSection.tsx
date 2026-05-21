import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar } from "@/components/Avatar";
import { ReviewStars } from "@/components/ReviewStars";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  body: string | null;
  photo_urls: string[] | null;
  reply: string | null;
  reply_at: string | null;
  created_at: string;
  customer: { full_name: string | null; avatar_url: string | null } | null;
};

const PAGE_SIZE = 8;

export function ReviewsSection({
  stylistId,
  ratingAvg,
  ratingCount,
}: {
  stylistId: string;
  ratingAvg: number;
  ratingCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const [list, dist] = await Promise.all([
        supabase
          .from("reviews" as any)
          .select(
            "id, rating, body, photo_urls, reply, reply_at, created_at, customer:profiles!reviews_customer_id_fkey(full_name, avatar_url)",
          )
          .eq("stylist_id", stylistId)
          .order("created_at", { ascending: false })
          .range(from, to),
        // Distribution only on first page
        page === 0
          ? supabase
              .from("reviews" as any)
              .select("rating")
              .eq("stylist_id", stylistId)
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (cancelled) return;
      if (list.error) {
        console.error("ReviewsSection: list failed", list.error);
      }
      const rows = (list.data as any as Review[]) || [];
      setReviews((prev) => (page === 0 ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      if (page === 0 && dist.data) {
        const d: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        (dist.data as any[]).forEach((r) => {
          d[r.rating] = (d[r.rating] || 0) + 1;
        });
        setDistribution(d);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [stylistId, page]);

  const total = ratingCount || Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <section aria-labelledby="reviews-heading">
      <div className="flex items-end justify-between mb-3">
        <h2 id="reviews-heading" className="font-display text-2xl">
          Reviews
        </h2>
        <span className="text-xs text-mute">{total} total</span>
      </div>

      {total === 0 && !loading ? (
        <div className="card p-8 text-center">
          <MessageSquare className="h-7 w-7 mx-auto text-mute" />
          <p className="font-display text-lg mt-2">No reviews yet</p>
          <p className="text-mute text-sm mt-1">
            Be the first — every review you leave after a completed booking shows up here for everyone to see.
          </p>
        </div>
      ) : (
        <>
          <div className="card p-5 mb-4">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <div className="font-display text-5xl leading-none">{ratingAvg.toFixed(1)}</div>
                <ReviewStars value={ratingAvg} size={18} className="mt-2" />
                <div className="text-xs text-mute mt-1">{total} review{total === 1 ? "" : "s"}</div>
              </div>
              <div className="flex-1 min-w-[180px] space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star] || 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-mute">{star}</span>
                      <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                        <div
                          className="h-full bg-gold-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-mute tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={r.customer?.avatar_url}
                    name={r.customer?.full_name || "Client"}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {r.customer?.full_name || "Verified client"}
                      </span>
                      <ReviewStars value={r.rating} size={14} />
                      <span className="text-[11px] text-mute">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {r.body && (
                      <p className="text-sm text-ink/90 mt-1.5 whitespace-pre-wrap">{r.body}</p>
                    )}
                    {r.photo_urls && r.photo_urls.length > 0 && (
                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {r.photo_urls.slice(0, 4).map((u, i) => (
                          <img
                            key={i}
                            src={u}
                            alt=""
                            className="aspect-square rounded-lg object-cover"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}
                    {r.reply && (
                      <div className="mt-3 rounded-2xl bg-cream/70 border border-line p-3">
                        <div className="text-[11px] uppercase tracking-wider text-mute">
                          Stylist replied
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{r.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {loading && <div className="skeleton h-24 rounded-2xl mt-3" />}

          {hasMore && !loading && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn-outline w-full mt-4"
            >
              Show more reviews
            </button>
          )}
        </>
      )}
    </section>
  );
}
