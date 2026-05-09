import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        cream: "#FBF6EE",
        ink: "#1B1410",
        terracotta: {
          50: "#FAEFEA",
          100: "#F2D9CE",
          300: "#E0A48B",
          500: "#C4663F",
          600: "#A8512E",
          700: "#823C20",
        },
        aubergine: {
          500: "#3F2233",
          700: "#2A1622",
        },
        gold: {
          400: "#D8A85A",
          500: "#BC8A38",
        },
        sage: "#8FA486",
        mute: "#7A6E66",
        line: "#E8DDD0",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,20,16,0.04), 0 8px 24px rgba(27,20,16,0.06)",
        pop: "0 12px 40px rgba(27,20,16,0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.2,0.8,0.2,1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
