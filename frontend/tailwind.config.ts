import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-outfit)", "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        base: "#030712",
        panel: "#111827",
        accent: "#06b6d4",
        primary: "#6366f1",
        secondary: "#14b8a6",
        warn: "#f97316",
        line: "#1f2937"
      },
      boxShadow: {
        glow: "0 0 20px rgba(6, 182, 212, 0.15)",
        "glow-lg": "0 0 40px rgba(99, 102, 241, 0.25)"
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
