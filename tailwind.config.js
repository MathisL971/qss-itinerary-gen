/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        bodoni: ["Bodoni72", "Bodoni 72", "serif"],
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
      fontSize: {
        "bodoni-xs": [
          "0.75rem",
          { lineHeight: "1.2", letterSpacing: "0.01em" },
        ],
        "bodoni-sm": [
          "0.875rem",
          { lineHeight: "1.3", letterSpacing: "0.01em" },
        ],
        "bodoni-base": ["1rem", { lineHeight: "1.4", letterSpacing: "0.01em" }],
        "bodoni-lg": [
          "1.125rem",
          { lineHeight: "1.4", letterSpacing: "0.01em" },
        ],
        "bodoni-xl": [
          "1.25rem",
          { lineHeight: "1.3", letterSpacing: "0.01em" },
        ],
        "bodoni-2xl": [
          "1.5rem",
          { lineHeight: "1.2", letterSpacing: "0.01em" },
        ],
        "bodoni-3xl": [
          "1.875rem",
          { lineHeight: "1.2", letterSpacing: "0.01em" },
        ],
        "bodoni-4xl": [
          "2.25rem",
          { lineHeight: "1.1", letterSpacing: "0.01em" },
        ],
        "bodoni-5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "0.01em" }],
      },
      colors: {
        border: "hsl(var(--color-border) / <alpha-value>)",
        input: "hsl(var(--color-input) / <alpha-value>)",
        ring: "hsl(var(--color-ring) / <alpha-value>)",
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          foreground: "hsl(var(--color-primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--color-secondary) / <alpha-value>)",
          foreground: "hsl(var(--color-secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--color-destructive) / <alpha-value>)",
          foreground:
            "hsl(var(--color-destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--color-muted) / <alpha-value>)",
          foreground: "hsl(var(--color-muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--color-accent) / <alpha-value>)",
          foreground: "hsl(var(--color-accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--color-popover) / <alpha-value>)",
          foreground: "hsl(var(--color-popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--color-card) / <alpha-value>)",
          foreground: "hsl(var(--color-card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
