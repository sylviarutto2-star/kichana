import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import kichanaLogo from "@/assets/kichana-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const KichanaLogo = ({
  size = "md",
  animate = true,
  showWordmark = true,
  layout = "row",
  asLink = true,
}: {
  size?: "sm" | "md" | "lg" | "splash";
  animate?: boolean;
  showWordmark?: boolean;
  layout?: "row" | "stack";
  asLink?: boolean;
}) => {
  const { user, profile } = useAuth();
  const href = !user
    ? "/"
    : profile?.role === "stylist"
    ? "/dashboard"
    : "/";
  const sizeMap = {
    sm: { img: "h-9 w-9", text: "text-xl" },
    md: { img: "h-11 w-11", text: "text-2xl" },
    lg: { img: "h-16 w-16", text: "text-[32px]" },
    // Responsive splash: ~65% of viewport width, capped on larger screens
    splash: {
      img: "w-[65vw] max-w-[420px] aspect-square h-auto",
      text: "text-4xl sm:text-5xl",
    },
  };

  // Soft, premium ease-in-out
  const softEase = [0.45, 0, 0.25, 1] as [number, number, number, number];
  const combDuration = 2.4;

  // The comb in the source image occupies roughly the center 32%–58% horizontally.
  // We use clip-paths to isolate two regions of the SAME source image:
  //   - afroClip: hides the comb column (shows only the afro halves)
  //   - combClip: shows only the comb column (this layer animates upward)
  const combClip = "inset(0 42% 0 32%)";
  const afroClip = "polygon(0 0, 32% 0, 32% 100%, 58% 100%, 58% 0, 100% 0, 100% 100%, 0 100%)";

  const containerClass =
    layout === "stack"
      ? "flex flex-col items-center gap-4"
      : "flex items-center gap-2.5";

  return (
    <div className={containerClass}>
      <motion.div
        initial={animate ? { scale: 0.94, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: softEase }}
        className={`relative shrink-0 ${sizeMap[size].img}`}
      >
        {animate ? (
          <>
            {/* Afro layer — comb column hidden, gently parts as the comb moves through */}
            <motion.img
              src={kichanaLogo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ clipPath: afroClip, WebkitClipPath: afroClip, transformOrigin: "50% 60%" }}
              initial={{ scaleX: 1, scaleY: 1, opacity: 1 }}
              animate={{
                scaleX: [1, 1.015, 0.99, 1.01, 1],
                scaleY: [1, 0.99, 1.015, 0.995, 1],
                opacity: [1, 1, 1, 0],
              }}
              transition={{
                duration: combDuration,
                ease: softEase,
                times: [0, 0.3, 0.85, 1],
              }}
            />

            {/* Comb layer — isolated comb column, travels up from below through the afro */}
            <motion.img
              src={kichanaLogo}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain"
              style={{ clipPath: combClip, WebkitClipPath: combClip }}
              initial={{ y: "55%", opacity: 0 }}
              animate={{
                y: ["55%", "10%", "0%", "-10%"],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: combDuration,
                ease: softEase,
                times: [0, 0.25, 0.8, 1],
              }}
            />

            {/* Final intact logo — fades in as the animated layers fade out */}
            <motion.img
              src={kichanaLogo}
              alt="Kichana Logo"
              className="absolute inset-0 w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: combDuration - 0.2, ease: softEase }}
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

      {showWordmark && (
        <motion.span
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: animate ? combDuration - 0.2 : 0, duration: 0.5, ease: softEase }}
          className={`font-display font-bold tracking-tight lowercase leading-none ${sizeMap[size].text}`}
        >
          kichana
        </motion.span>
      )}
    </div>
  );
};

export default KichanaLogo;
