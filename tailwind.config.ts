import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        primary: {
          DEFAULT: "var(--accent-primary)",
          text: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
        },
        border: "var(--border-default)",
        brand: {
          paypal: "#0070ba",
          paypalDark: "#003087",
        },
        state: {
          success: "var(--state-success)",
          warning: "var(--state-warning)",
          danger: "var(--state-danger)",
        },
        category: {
          utilities: "#f59e0b",
          medical: "#10b981",
          education: "#6366f1",
          food: "#f43f5e",
          climate: "#14b8a6",
          community: "#8b5cf6",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

