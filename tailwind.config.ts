import type { Config } from "tailwindcss";

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
        heading: ["Poppins", "DM Sans", "sans-serif"],
        body: ["Inter", "Source Sans Pro", "sans-serif"],
        stats: ["DM Sans", "Montserrat", "sans-serif"],
      },
      colors: {
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
        wrenchli: {
          blue: "hsl(var(--wrenchli-deep-blue))",
          orange: "hsl(var(--wrenchli-orange))",
          green: "hsl(var(--wrenchli-green))",
          teal: "hsl(var(--wrenchli-teal))",
          "trust-blue": "hsl(var(--wrenchli-trust-blue))",
          "light-bg": "hsl(var(--wrenchli-light-bg))",
          "dark-text": "hsl(var(--wrenchli-dark-text))",
          "medium-text": "hsl(var(--wrenchli-medium-text))",
          "light-gray": "hsl(var(--wrenchli-light-gray))",
        },
        ad: {
          info: {
            bg: "hsl(var(--ad-info-bg))",
            "bg-end": "hsl(var(--ad-info-bg-end))",
            border: "hsl(var(--ad-info-border))",
            heading: "hsl(var(--ad-info-heading))",
            text: "hsl(var(--ad-info-text))",
            icon: "hsl(var(--ad-info-icon))",
            subtle: "hsl(var(--ad-info-subtle))",
          },
          success: {
            bg: "hsl(var(--ad-success-bg))",
            "bg-end": "hsl(var(--ad-success-bg-end))",
            border: "hsl(var(--ad-success-border))",
            heading: "hsl(var(--ad-success-heading))",
            text: "hsl(var(--ad-success-text))",
            icon: "hsl(var(--ad-success-icon))",
          },
          badge: {
            savings: "hsl(var(--ad-badge-savings))",
            "savings-text": "hsl(var(--ad-badge-savings-text))",
            "savings-border": "hsl(var(--ad-badge-savings-border))",
            value: "hsl(var(--ad-badge-value))",
            "value-text": "hsl(var(--ad-badge-value-text))",
            "value-border": "hsl(var(--ad-badge-value-border))",
          },
          star: "hsl(var(--ad-star))",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "vehicle-scan": {
          "0%": { transform: "translateX(0px)", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { transform: "translateX(375px)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "count-up": "count-up 0.4s ease-out forwards",
        "vehicle-scan": "vehicle-scan 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
