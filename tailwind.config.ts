import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E7D46",
          dark: "#1F4D2C",
          light: "#4a9e62",
          50:  "#f0f8f3",
          100: "#d9ede0",
          200: "#b3dbc2",
          300: "#81c49e",
          400: "#4ea87a",
          500: "#2E7D46",
          600: "#256339",
          700: "#1F4D2C",
          800: "#193b23",
          900: "#12291a",
        },
        sage: {
          DEFAULT: "#8FA88A",
          light: "#b3c5ae",
          dark:  "#6b8066",
        },
        cream: {
          DEFAULT: "#F6F1E7",
          dark:   "#ece6d8",
        },
        earth: {
          DEFAULT: "#8A5A3B",
          dark:   "#6b3e27",
          light:  "#a87050",
        },
        gold: {
          DEFAULT: "#C9A94D",
          light:  "#d9be7a",
          dark:   "#a8892e",
        },
        success: "#2E7D32",
        warning: "#C77700",
        error:   "#C62828",
        info:    "#1565C0",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "Poppins", "system-ui", "sans-serif"],
        inter:   ["var(--font-inter)",   "Inter",   "system-ui", "sans-serif"],
        bengali: ["Hind Siliguri", "Noto Sans Bengali", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.625rem",
        sm:  "0.375rem",
        md:  "0.625rem",
        lg:  "0.875rem",
        xl:  "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card:       "0 2px 8px 0 rgba(30,50,20,0.08),  0 1px 2px 0 rgba(30,50,20,0.04)",
        "card-md":  "0 4px 16px 0 rgba(30,50,20,0.10), 0 2px 4px 0 rgba(30,50,20,0.05)",
        "card-lg":  "0 8px 24px 0 rgba(30,50,20,0.12), 0 2px 8px 0 rgba(30,50,20,0.06)",
        "inner-sm": "inset 0 1px 3px rgba(0,0,0,0.08)",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};

export default config;
