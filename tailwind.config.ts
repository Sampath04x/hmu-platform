import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        dmserif: ["var(--font-dmserif)", "serif"],
        dmsans: ["var(--font-dmsans)", "sans-serif"],
        jetbrains: ["var(--font-jetbrains)", "monospace"],
      },
      colors: {
        brand: "#C2692A",
        accent: "#E8A87C",
        background: "#FDF6EE",
        foreground: "#1C1A17",
        primary: {
          DEFAULT: "#C2692A",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F0E6D3",
          foreground: "#1C1A17",
        },
        muted: {
          DEFAULT: "#DDD0BB",
          foreground: "#5C5347",
        },
        "bg-base": "#FDF6EE",
        "bg-surface": "#F0E6D3",
        "bg-elevated": "#E8D8C0",
        card: "#F0E6D3",
        popover: "#F0E6D3",
        "text-primary": "#1C1A17",
        "text-secondary": "#5C5347",
        "text-muted": "#9C9080",
        border: "#DDD0BB",
        success: "#3D7A5A",
        danger: "#B94040",
        destructive: {
          DEFAULT: "#B94040",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
