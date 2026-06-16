import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Bookmark, Calendar, Star, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Notif = {
  id: string;
  title: string;
  body: string;
  kind: string;
  read: boolean;
  link: string | null;
  created_at: string;
};

const KIND_ICON: Record<string, typeof Bell> = {
  booking_new: Calendar,
  booking_confirmed: Calendar,
  booking_cancelled: Calendar,
  review_new: Star,
  reminder: Bell,
};

export default function Notifications() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled) {
        setNotifs((data as Notif[]) || []);
        setLoading(false);
      }

      // Mark all as read
      await (supabase as any)
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleClick = (n: Notif) => {
    if (n.link) nav(n.link);
  };

  return (
    <div className="pb-nav min-h-screen with-sidenav">
      <PageHeader title="Notifications" />
      <div className="container-app">
        {loading && (
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        )}
        {!loading && notifs.length === 0 && (
          <div className="card p-10 mt-6 text-center">
            <CheckCheck className="h-8 w-8 mx-auto text-mute mb-3" />
            <div className="font-display text-xl">You're all caught up</div>
            <p className="text-mute text-sm mt-1">Booking confirmations, new reviews, and reminders will appear here.</p>
          </div>
        )}
        {!loading && notifs.length > 0 && (
          <div className="mt-4 space-y-2">
            {notifs.map((n) => {
              const Icon = KIND_ICON[n.kind] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "card p-4 w-full text-left flex items-start gap-3 transition",
                    !n.read && "border-terracotta-200 bg-terracotta-50/30",
                    n.link && "hover:border-terracotta-300"
                  )}
                >
                  <div className={cn(
                    "shrink-0 grid h-9 w-9 place-items-center rounded-full",
                    n.read ? "bg-line text-mute" : "bg-terracotta-100 text-terracotta-700"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn("font-semibold text-sm", !n.read && "text-ink")}>
                        {n.title}
                      </div>
                      <div className="text-[11px] text-mute shrink-0">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <p className="text-sm text-mute mt-0.5">{n.body}</p>
                  </div>
                  {!n.read && (
                    <div className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-terracotta-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
