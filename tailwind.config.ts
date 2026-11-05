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
        background: "#000000",
        surface: "#0a0a0a",
        elevated: "#121212",
        primary: {
          DEFAULT: "#118C4F",
          text: "#ffffff",
        },
        brand: {
          DEFAULT: "#118C4F",
          dark: "#0a5c33",
          light: "#1cb668",
          black: "#000000",
        },
        muted: {
          DEFAULT: "#8e8e93",
        },
        border: "#1f1f23",
        state: {
          success: "#118C4F",
          warning: "#118C4F",
          danger: "#ef4444",
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
