import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        panel: "#111113",
        line: "#232326",
        gold: { DEFAULT: "#D4AF37", soft: "#E6C86B", dim: "#8C7326" },
        smoke: "#9A9AA0",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(212,175,55,.45)",
        card: "0 20px 60px -20px rgba(0,0,0,.7)",
      },
      backgroundImage: {
        "gold-text": "linear-gradient(120deg,#F5E7B8 0%,#D4AF37 45%,#8C7326 70%,#D4AF37 100%)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      },
      animation: {
        shimmer: "shimmer 6s linear infinite",
        floaty: "floaty 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
