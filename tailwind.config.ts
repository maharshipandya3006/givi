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
        background: "var(--color-paper, oklch(98.2% 0.005 85))",
        surface: {
          DEFAULT: "var(--color-paper-2, oklch(95.5% 0.008 85))",
          elevated: "var(--color-paper-3, oklch(92.0% 0.012 85))",
          highlight: "var(--color-paper-highlight, oklch(88.0% 0.015 85))",
        },
        border: {
          subtle: "var(--color-rule-subtle, oklch(92.5% 0.007 85))",
          DEFAULT: "var(--color-rule, oklch(88.0% 0.010 85))",
          focus: "var(--color-focus, oklch(45% 0.125 158))",
        },
        ink: {
          DEFAULT: "var(--color-ink, oklch(18% 0.018 50))",
          muted: "var(--color-muted, oklch(52% 0.012 50))",
          dim: "var(--color-ink-2, oklch(34% 0.015 50))",
        },
        accent: {
          DEFAULT: "#166534",
          hover: "#14532d",
          ink: "#ffffff",
        },
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#166534",
          500: "#166534",
          600: "#14532d",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          "Monaco",
          '"Cascadia Code"',
          '"Source Code Pro"',
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "emerald-sm": "0 2px 8px -2px rgba(22, 101, 52, 0.25)",
        "emerald-md": "0 8px 24px -4px rgba(22, 101, 52, 0.3)",
        "emerald-lg": "0 16px 36px -6px rgba(22, 101, 52, 0.35)",
        "card": "0 14px 34px -10px rgba(28, 25, 23, 0.08)",
        "curtain": "var(--shadow-curtain, 0 -24px 60px rgba(28, 25, 23, 0.06))",
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
