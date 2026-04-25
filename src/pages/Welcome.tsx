import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import KichanaLogo from "@/components/KichanaLogo";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen flex flex-col bg-background relative overflow-hidden"
    >
      {/* Centered splash logo — fills ~65% of viewport width */}
      <div className="flex-1 flex items-center justify-center px-5">
        <KichanaLogo size="splash" layout="stack" />
      </div>

      {/* Tagline + CTAs */}
      <div className="px-5 pb-8 space-y-5">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.5, ease: [0.2, 0, 0, 1] as const }}
          className="text-center text-[15px] leading-[1.6] text-muted-foreground max-w-sm mx-auto"
        >
          Hand-picked stylists in Nairobi. Book braids, wigs, natural hair & more — at home or at the salon.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 0.5, ease: [0.2, 0, 0, 1] as const }}
          className="space-y-3"
        >
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/auth")}
            className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
          >
            Get Started
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/auth")}
            className="w-full h-14 rounded-outer bg-secondary text-secondary-foreground font-display font-medium text-base"
          >
            I already have an account
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Welcome;
