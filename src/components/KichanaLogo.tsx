import { motion } from "framer-motion";
import kichanaLogo from "@/assets/kichana-logo.png";

const KichanaLogo = ({ size = "md", animate = true }: { size?: "sm" | "md" | "lg"; animate?: boolean }) => {
  const sizeMap = {
    sm: { img: "h-9 w-9", text: "text-xl" },
    md: { img: "h-11 w-11", text: "text-2xl" },
    lg: { img: "h-16 w-16", text: "text-[32px]" },
  };

  const logoVariants = {
    initial: { rotate: -10, scale: 0.8, opacity: 0 },
    animate: {
      rotate: 0,
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 200, damping: 15, duration: 0.6 },
    },
  };

  const textVariants = {
    initial: { x: -10, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { delay: 0.3, duration: 0.4, ease: [0.2, 0, 0, 1] },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
    },
  };

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        variants={animate ? logoVariants : undefined}
        initial={animate ? "initial" : undefined}
        animate="animate"
      >
        <motion.img
          src={kichanaLogo}
          alt="Kichana Logo"
          className={`${sizeMap[size].img} object-contain`}
          variants={animate ? pulseVariants : undefined}
          animate="animate"
        />
      </motion.div>
      <motion.span
        variants={animate ? textVariants : undefined}
        initial={animate ? "initial" : undefined}
        animate="animate"
        className={`font-display font-bold tracking-tight lowercase ${sizeMap[size].text}`}
      >
        kichana
      </motion.span>
    </div>
  );
};

export default KichanaLogo;
