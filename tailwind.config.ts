import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: "#06060d",
          800: "#0c0c18",
          700: "#141426",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.12)",
        },
        accent: {
          violet: "#8b5cf6",
          fuchsia: "#d946ef",
          cyan: "#22d3ee",
          amber: "#fbbf24",
          emerald: "#34d399",
          rose: "#fb7185",
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%":      { transform: "translate(-20%,10%) scale(1.1)" },
          "66%":      { transform: "translate(15%,-15%) scale(0.95)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseRing: {
          "0%": { transform: "scale(.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        aurora: "aurora 20s ease infinite",
        slideUp: "slideUp .4s ease forwards",
        fadeIn: "fadeIn .35s ease forwards",
        shimmer: "shimmer 2.5s linear infinite",
        pulseRing: "pulseRing 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
