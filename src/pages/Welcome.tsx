import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroBraids from "@/assets/hero-braids.jpg";
import KichanaLogo from "@/components/KichanaLogo";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const },
};

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <motion.div {...pageTransition} className="min-h-screen flex flex-col bg-background">
      {/* Hero Image */}
      <div className="relative h-[60vh] overflow-hidden">
        <img
          src={heroBraids}
          alt="Beautiful braids hairstyle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-5 -mt-16 relative z-10 flex flex-col">
        <KichanaLogo size="lg" />

        <h1 className="font-display text-[32px] font-semibold tracking-tight leading-[1.1] mt-4">
          Your style,{" "}
          <span className="text-primary">delivered.</span>
        </h1>

        <p className="text-[15px] leading-[1.6] text-muted-foreground mt-3">
          Hand-picked stylists in Nairobi. Book braids, wigs, natural hair & more — at home or at the salon.
        </p>

        <div className="mt-auto pb-8 space-y-3">
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
        </div>
      </div>
    </motion.div>
  );
};

export default Welcome;
