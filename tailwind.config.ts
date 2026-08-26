import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111F",
        panel: "#0D1726",
        panel2: "#111D2E",
        border: "#203049",
        brass: "#67E8F9",
        brassdim: "#22D3EE",
        mint: "#34D399",
        coral: "#FB7185",
        ivory: "#F8FAFC",
        muted: "#94A3B8",
        violet: "#8B5CF6",
      },

      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-display)", "sans-serif"],
      },

      boxShadow: {
        glow: "0 0 30px rgba(103, 232, 249, 0.10)",
        violetGlow: "0 0 35px rgba(139, 92, 246, 0.10)",
      },

      backgroundImage: {
        "ledger-lines":
          "repeating-linear-gradient(180deg, rgba(103,232,249,0.035) 0px, rgba(103,232,249,0.035) 1px, transparent 1px, transparent 30px)",

        "app-radial":
          "radial-gradient(circle at top, rgba(139,92,246,0.12), transparent 35%), radial-gradient(circle at 80% 15%, rgba(34,211,238,0.10), transparent 30%)",
      },
    },
  },
  plugins: [],
};

export default config;