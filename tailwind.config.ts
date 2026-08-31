import type { Config } from "tailwindcss";

/**
 * LUXE design tokens.
 *
 * The palette rests on a warm/cool tension: gold reads as metal only when
 * there is cold ambient light around it. Everything else stays quiet so the
 * product photography and the gold are the only things that carry colour.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // depth scale — four steps instead of one flat surface
        ink:   { DEFAULT: "#08080A", deep: "#050506", raised: "#0E0E11" },
        panel: { DEFAULT: "#111113", raised: "#17171B", high: "#1E1E23" },
        line:  { DEFAULT: "#232326", soft: "#1A1A1E", bright: "#33333A" },

        // warm metal
        gold: {
          DEFAULT: "#D4AF37",
          soft:    "#E6C86B",
          pale:    "#F5E7B8",
          dim:     "#8C7326",
          deep:    "#5C4B18",
        },

        // cold ambient — what makes the gold look metallic
        steel: {
          DEFAULT: "#7E8CA0",
          light:   "#A9B6C8",
          glow:    "#4E6480",
        },

        smoke: { DEFAULT: "#9A9AA0", dim: "#6E6E76" },
      },

      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },

      // a real type scale, not ad-hoc sizes
      fontSize: {
        "display-xl": ["clamp(2.75rem, 8vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 5.5vw, 4rem)", { lineHeight: "1.02", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.75rem, 3.5vw, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },

      boxShadow: {
        // elevation ladder
        e1: "0 1px 2px rgba(0,0,0,.4)",
        e2: "0 8px 24px -12px rgba(0,0,0,.65)",
        e3: "0 24px 64px -24px rgba(0,0,0,.8)",
        e4: "0 40px 100px -30px rgba(0,0,0,.9)",
        glow: "0 0 40px -8px rgba(212,175,55,.4)",
        "glow-soft": "0 0 60px -20px rgba(212,175,55,.3)",
        "glow-cool": "0 0 50px -18px rgba(78,100,128,.35)",
        card: "0 20px 60px -20px rgba(0,0,0,.7)",
      },

      backgroundImage: {
        "gold-text": "linear-gradient(120deg,#F5E7B8 0%,#D4AF37 45%,#8C7326 70%,#D4AF37 100%)",
        "metal": "linear-gradient(135deg,#F5E7B8 0%,#D4AF37 30%,#8C7326 55%,#E6C86B 80%,#D4AF37 100%)",
      },

      transitionTimingFunction: {
        // one easing for the whole site — motion should feel like one hand
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
        "luxe-in": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      transitionDuration: {
        quick: "180ms",
        base: "320ms",
        slow: "520ms",
      },

      keyframes: {
        shimmer: { "0%": { backgroundPosition: "200% 0" }, "100%": { backgroundPosition: "-200% 0" } },
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        shimmer: "shimmer 6s linear infinite",
        floaty: "floaty 7s ease-in-out infinite",
        "rise-in": "rise-in 620ms cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
