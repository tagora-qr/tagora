import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0F1B3D",
          50: "#F0F2F7",
          100: "#D9DEE9",
          200: "#B3BDD4",
          300: "#8C9CBE",
          400: "#667BA9",
          500: "#3F5A93",
          600: "#324876",
          700: "#26365A",
          800: "#19243D",
          900: "#0F1B3D",
        },
        accent: {
          DEFAULT: "#D4F36A",
          50: "#F8FDEA",
          100: "#F1FAD5",
          200: "#E3F5AB",
          300: "#D4F36A",
          400: "#BCDE3F",
          500: "#A4C923",
          600: "#83A11C",
          700: "#627915",
          800: "#41510E",
          900: "#212807",
        },
        charcoal: "#1F2937",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};

export default config;
