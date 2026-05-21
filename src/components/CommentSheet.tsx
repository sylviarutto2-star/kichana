import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author_name?: string | null;
  avatar_url?: string | null;
};

type Props = {
  postId: string;
  postCommentsCount: number;
  onClose: () => void;
  onCommentAdded: () => void;
};

const isDemo = (id: string) => id.startsWith("demo-");

export function CommentSheet({ postId, postCommentsCount, onClose, onCommentAdded }: Props) {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isDemo(postId)) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("feed_comments")
        .select("id, body, created_at, user_id, profiles(full_name, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
      } else {
        setComments(
          (data || []).map((r: any) => ({
            id: r.id,
            body: r.body,
            created_at: r.created_at,
            user_id: r.user_id,
            author_name: r.profiles?.full_name,
            avatar_url: r.profiles?.avatar_url,
          }))
        );
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  const submit = async () => {
    const text = body.trim();
    if (!text || submitting) return;
    if (!profile) {
      toast.error("Sign in to comment");
      return;
    }
    if (isDemo(postId)) {
      toast("Comments are disabled for demo posts");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("feed_comments")
      .insert({ post_id: postId, user_id: profile.id, body: text })
      .select("id, created_at")
      .single();
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    setComments((cs) => [
      ...cs,
      {
        id: data!.id,
        body: text,
        created_at: data!.created_at,
        user_id: profile.id,
        author_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
    ]);
    setBody("");
    await supabase
      .from("feed_posts")
      .update({ comments_count: postCommentsCount + 1 })
      .eq("id", postId);
    onCommentAdded();
    setSubmitting(false);
    inputRef.current?.focus();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-end lg:items-center lg:justify-center"
      onClick={onClose}
    >
      <div
        className="bg-cream w-full rounded-t-3xl lg:rounded-3xl max-h-[80vh] lg:max-w-md lg:w-full lg:mx-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink/10">
          <div className="text-sm font-semibold">Comments</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-ink/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isDemo(postId) ? (
            <p className="text-sm text-mute">Comments are disabled for demo posts.</p>
          ) : loading ? (
            <p className="text-sm text-mute">Loading…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-mute">No comments yet. Be the first.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar src={c.avatar_url} name={c.author_name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs">
                    <span className="font-semibold">{c.author_name || "Kichana user"}</span>
                    <span className="text-mute">
                      {" · "}
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 break-words">{c.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-center gap-2 p-3 border-t border-ink/10"
        >
          <input
            ref={inputRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={isDemo(postId) ? "Demo post — read only" : "Add a comment…"}
            disabled={isDemo(postId) || submitting}
            className="flex-1 rounded-full bg-white border border-ink/10 px-4 py-2 text-sm focus:outline-none focus:border-terracotta-400"
          />
          <button
            type="submit"
            disabled={!body.trim() || submitting || isDemo(postId)}
            aria-label="Send"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink text-cream disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
