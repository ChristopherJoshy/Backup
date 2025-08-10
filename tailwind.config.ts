import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Courier Prime", "Courier New", "monospace"],
        mono: ["Courier Prime", "Courier New", "monospace"],
      },
      colors: {
        background: "hsl(0 0% 0%)",
        foreground: "hsl(120 100% 50%)",
        card: {
          DEFAULT: "hsl(0 0% 5%)",
          foreground: "hsl(120 100% 50%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 0%)",
          foreground: "hsl(120 100% 50%)",
        },
        primary: {
          DEFAULT: "hsl(120 100% 50%)",
          foreground: "hsl(0 0% 0%)",
        },
        secondary: {
          DEFAULT: "hsl(0 0% 20%)",
          foreground: "hsl(120 100% 50%)",
        },
        muted: {
          DEFAULT: "hsl(0 0% 10%)",
          foreground: "hsl(120 50% 25%)",
        },
        accent: {
          DEFAULT: "hsl(0 0% 15%)",
          foreground: "hsl(120 100% 50%)",
        },
        destructive: {
          DEFAULT: "hsl(0 100% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        border: "hsl(120 100% 50%)",
        input: "hsl(0 0% 5%)",
        ring: "hsl(120 100% 50%)",
        chart: {
          "1": "hsl(120 100% 50%)",
          "2": "hsl(160 100% 36%)",
          "3": "hsl(42 93% 56%)",
          "4": "hsl(147 78% 42%)",
          "5": "hsl(341 75% 51%)",
        },
        sidebar: {
          DEFAULT: "hsl(0 0% 5%)",
          foreground: "hsl(120 100% 50%)",
          primary: "hsl(120 100% 50%)",
          "primary-foreground": "hsl(0 0% 0%)",
          accent: "hsl(0 0% 15%)",
          "accent-foreground": "hsl(120 100% 50%)",
          border: "hsl(120 50% 25%)",
          ring: "hsl(120 100% 50%)",
        },
        // Terminal-specific colors
        "terminal-green": "hsl(120 100% 50%)",
        "terminal-dark-green": "hsl(120 100% 25%)",
        "terminal-bg": "hsl(0 0% 0%)",
        "terminal-yellow": "hsl(60 100% 50%)",
        "terminal-red": "hsl(0 100% 50%)",
        "terminal-gray": "hsl(0 0% 20%)",
      },
      borderRadius: {
        lg: "0rem",
        md: "0rem", 
        sm: "0rem",
      },
      keyframes: {
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "matrix-rain": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateY(100vh)", opacity: "0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "boot-text": {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0.7" },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "matrix-rain": "matrix-rain 3s linear infinite",
        "scan-line": "scan-line 2s linear infinite",
        "boot-text": "boot-text 0.05s steps(1) infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
