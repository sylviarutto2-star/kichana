import { motion } from "framer-motion";
import kichanaLogo from "@/assets/kichana-logo.png";
import kichanaAfro from "@/assets/kichana-afro.png";
import kichanaComb from "@/assets/kichana-comb.png";

const KichanaLogo = ({ size = "md", animate = true }: { size?: "sm" | "md" | "lg"; animate?: boolean }) => {
  const sizeMap = {
    sm: { img: "h-9 w-9", text: "text-xl" },
    md: { img: "h-11 w-11", text: "text-2xl" },
    lg: { img: "h-16 w-16", text: "text-[32px]" },
  };

  // Soft, premium ease-in-out curve
  const softEase = [0.45, 0, 0.25, 1] as [number, number, number, number];
  // Total combing animation duration
  const combDuration = 2.4;

  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        initial={animate ? { scale: 0.92, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: softEase }}
        className={`relative ${sizeMap[size].img}`}
      >
        {animate ? (
          <>
            {/* Afro layer — gently sways/parts as the comb passes through */}
            <motion.img
              src={kichanaAfro}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ scaleX: 1, scaleY: 1 }}
              animate={{
                scaleX: [1, 1.015, 0.99, 1.01, 1],
                scaleY: [1, 0.99, 1.015, 0.995, 1],
              }}
              transition={{
                duration: combDuration,
                ease: softEase,
                times: [0, 0.3, 0.55, 0.8, 1],
              }}
              style={{ transformOrigin: "50% 60%" }}
            />

            {/* Comb layer — starts below, slowly travels up through the afro */}
            <motion.img
              src={kichanaComb}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ y: "55%", opacity: 0 }}
              animate={{
                y: ["55%", "10%", "-30%", "-55%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: combDuration,
                ease: softEase,
                times: [0, 0.2, 0.75, 1],
              }}
            />

            {/* Final static logo — fades in once the combing finishes */}
            <motion.img
              src={kichanaLogo}
              alt="Kichana Logo"
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45, delay: combDuration - 0.15, ease: softEase }}
            />
          </>
        ) : (
          <img
            src={kichanaLogo}
            alt="Kichana Logo"
            className="absolute inset-0 w-full h-full object-contain"
          />
        )}
      </motion.div>

      <motion.span
        initial={animate ? { x: -10, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: animate ? combDuration - 0.2 : 0, duration: 0.5, ease: softEase }}
        className={`font-display font-bold tracking-tight lowercase ${sizeMap[size].text}`}
      >
        kichana
      </motion.span>
    </div>
  );
};

export default KichanaLogo;
