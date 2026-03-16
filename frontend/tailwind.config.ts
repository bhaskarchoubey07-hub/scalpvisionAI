import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        base: "#08111f",
        panel: "#101c31",
        accent: "#3dd9b8",
        warn: "#ff8c5a",
        line: "#23324e"
      },
      boxShadow: {
        glow: "0 0 40px rgba(61, 217, 184, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
