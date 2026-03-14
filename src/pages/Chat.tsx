import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] },
};

const Chat = () => {
  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Chat with your stylists</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-5">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
          <MessageCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display font-medium mt-4">No messages yet</p>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Messages with your stylists will appear here after booking
        </p>
      </div>
    </motion.div>
  );
};

export default Chat;
