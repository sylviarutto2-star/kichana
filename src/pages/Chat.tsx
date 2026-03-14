import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

interface Conversation {
  recipientId: string;
  recipientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!msgs) return;

      const convMap = new Map<string, { lastMsg: typeof msgs[0]; unread: number }>();
      msgs.forEach((msg) => {
        const recipientId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(recipientId)) {
          convMap.set(recipientId, { lastMsg: msg, unread: 0 });
        }
        if (msg.receiver_id === user.id && !msg.read) {
          const conv = convMap.get(recipientId)!;
          conv.unread++;
        }
      });

      const convList: Conversation[] = [];
      for (const [recipientId, { lastMsg, unread }] of convMap) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("user_id", recipientId)
          .single();

        convList.push({
          recipientId,
          recipientName: profile?.name || "User",
          lastMessage: lastMsg.message_text,
          lastMessageTime: new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread,
        });
      }
      setConversations(convList);
    };

    fetchConversations();

    const channel = supabase
      .channel("chat-list")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) {
    return (
      <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
        <div className="px-5 pt-6 pb-4">
          <h1 className="font-display text-[24px] font-semibold tracking-tight">Messages</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <p className="text-muted-foreground">Sign in to view your messages</p>
          <button onClick={() => navigate("/auth")} className="mt-4 text-primary font-medium">Sign In</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat with your stylists</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            <MessageCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-display font-medium mt-4">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Messages with your stylists will appear here after booking
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-1">
          {conversations.map((conv) => (
            <motion.button
              key={conv.recipientId}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/chat/${conv.recipientId}`)}
              className="w-full flex items-center gap-3 p-3 rounded-inner hover:bg-secondary/50 transition-colors"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-display font-bold text-primary">{conv.recipientName.charAt(0)}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{conv.recipientName}</p>
                  <span className="text-xs text-muted-foreground">{conv.lastMessageTime}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {conv.unread}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Chat;
