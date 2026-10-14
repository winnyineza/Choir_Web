import type { Config } from "tailwindcss";

// Theme-aware muted scales defined as CSS variables in index.css.
const scale = (name: string) =>
  Object.fromEntries(
    [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
      step,
      `hsl(var(--${name}-${step}) / <alpha-value>)`,
    ])
  );

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        body: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.28em",
      },
      colors: {
        // Hard-coded yellow/amber utilities across the app resolve to a champagne scale,
        // so legacy accents pick up the new palette without touching each file.
        yellow: {
          50: "#FAF6EE", 100: "#F2EADA", 200: "#E6D6B5", 300: "#D9C090", 400: "#CDB07A",
          500: "#C8A96A", 600: "#A88A4E", 700: "#86693A", 800: "#5E4A2A", 900: "#3D311E", 950: "#221B11",
        },
        amber: {
          50: "#FAF6EE", 100: "#F2EADA", 200: "#E6D6B5", 300: "#D9C090", 400: "#CDB07A",
          500: "#B8955A", 600: "#9A7A44", 700: "#7A5F33", 800: "#574427", 900: "#3A2E1C", 950: "#211A10",
        },
        green: scale("sage"),
        emerald: scale("sage"),
        lime: scale("sage"),
        teal: scale("teal"),
        cyan: scale("teal"),
        red: scale("oxblood"),
        rose: scale("oxblood"),
        blue: scale("slate"),
        sky: scale("slate"),
        indigo: scale("slate"),
        purple: scale("plum"),
        violet: scale("plum"),
        fuchsia: scale("plum"),
        pink: scale("blush"),
        orange: scale("sienna"),
        ink: {
          DEFAULT: "hsl(var(--ink))",
          soft: "hsl(var(--ink-soft))",
        },
        ivory: "hsl(var(--ivory))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
          glow: "hsl(var(--gold-glow))",
        },
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          light: "hsl(var(--charcoal-light))",
        },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      // A tighter radius scale reads as tailored rather than bubbly.
      borderRadius: {
        sm: "2px",
        md: "3px",
        lg: "var(--radius)",
        xl: "6px",
        "2xl": "8px",
        "3xl": "10px",
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
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gold-gradient": "linear-gradient(180deg, hsl(var(--gold)) 0%, hsl(var(--gold-dark)) 100%)",
        "gold-shine": "linear-gradient(90deg, hsl(var(--gold)) 0%, hsl(var(--gold-light)) 50%, hsl(var(--gold)) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
