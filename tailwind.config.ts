import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic foreground. Every `text-fg/60`, `bg-fg/5`, `border-fg/10`
        // flips automatically between themes (near-white in dark, near-black in
        // light), so the whole alpha-based design translates for free.
        fg: "rgb(var(--fg) / <alpha-value>)",
        // Surfaces, darkest → lightest in dark mode (inverted in light mode).
        ink: {
          950: "rgb(var(--page) / <alpha-value>)",
          900: "rgb(var(--panel-2) / <alpha-value>)",
          800: "rgb(var(--panel) / <alpha-value>)",
          700: "rgb(var(--panel-3) / <alpha-value>)",
          600: "rgb(var(--panel-3) / <alpha-value>)",
        },
        brand: {
          400: "#8b7cff",
          500: "#6d5efc",
          600: "#5a49e8",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [
    // `light:` variant — surfaces flip automatically via the fg/ink tokens, but
    // saturated accent colours need a darker shade to stay readable on white.
    plugin(({ addVariant }) => {
      addVariant("light", ':root[data-theme="light"] &');
    }),
  ],
};

export default config;
