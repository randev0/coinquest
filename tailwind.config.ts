import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // MMORPG Theme Palette
        mmorpg: {
          bg: "#080c14",
          bgSecondary: "#0e1525",
          panel: "#111827",
          panelLight: "#1a2235",
          border: "#2a3650",
          bevelLight: "#3d4f6b",
          bevelDark: "#050810",
          parchment: "#c8b990",
          parchmentDark: "#a89870",
          steel: "#7a8ba8",
          steelLight: "#9aaac4",
          gold: "#d4a017",
          goldLight: "#f0c040",
          goldDark: "#a07010",
          accentBlue: "#3a7bd5",
          accentBlueDark: "#2a5ba5",
          success: "#3a8a5a",
          successLight: "#4aaa6a",
          warning: "#c8a020",
          warningLight: "#e8c030",
          danger: "#a83030",
          dangerLight: "#c84040",
          purple: "#6a3aad",
          purpleLight: "#8a5acd",
          teal: "#1a8a8a",
        },
        // shadcn compat
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        bevel: "inset 1px 1px 0px rgba(255,255,255,0.15), inset -1px -1px 0px rgba(0,0,0,0.5)",
        bevelOutset: "1px 1px 0px rgba(255,255,255,0.15), -1px -1px 0px rgba(0,0,0,0.5)",
        "window": "0 0 0 1px #2a3650, 0 4px 32px rgba(0,0,0,0.7), 0 0 60px rgba(58,123,213,0.1)",
        "gold-glow": "0 0 8px rgba(212,160,23,0.5), 0 0 24px rgba(212,160,23,0.2)",
        "panel": "inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 16px rgba(0,0,0,0.5)",
        "btn": "0 2px 0 rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        "btn-pressed": "0 0 0 rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "panel-gradient": "linear-gradient(135deg, #111827 0%, #0e1525 100%)",
        "panel-light": "linear-gradient(135deg, #1a2235 0%, #111827 100%)",
        "gold-gradient": "linear-gradient(135deg, #d4a017 0%, #f0c040 50%, #d4a017 100%)",
        "danger-gradient": "linear-gradient(90deg, #a83030 0%, #c84040 100%)",
        "success-gradient": "linear-gradient(90deg, #3a8a5a 0%, #4aaa6a 100%)",
        "warning-gradient": "linear-gradient(90deg, #c8a020 0%, #e8c030 100%)",
        "xp-gradient": "linear-gradient(90deg, #3a7bd5 0%, #6a9aff 100%)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(212,160,23,0.4)" },
          "50%": { boxShadow: "0 0 16px rgba(212,160,23,0.8)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "count-up": "count-up 0.3s ease-out",
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "flicker": "flicker 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
