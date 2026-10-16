/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}",
    "./src/hooks/**/*.{js,jsx,ts,tsx}",
    "./src/utils/**/*.{js,jsx,ts,tsx}",
    "./src/constants/**/*.{js,jsx,ts,tsx}",
    "./src/context/**/*.{js,jsx,ts,tsx}",
    "./src/store/**/*.{js,jsx,ts,tsx}",
    "./src/layout/**/*.{js,jsx,ts,tsx}",
    "./src/builder/**/*.{js,jsx,ts,tsx}",
    "./src/types/**/*.{js,jsx,ts,tsx}",
    "./src/enums/**/*.{js,jsx,ts,tsx}",
    "./src/lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Jade Forest — Primary Palette
        primary: "#059669",
        "primary-hover": "#047857",
        secondary: "#34D399",
        tint: "#A7F3D0",
        dark: "#1C2D24",
        surface: "#F0FFF4",

        // Text Colors
        "text-primary": "#1C2D24",
        "text-secondary": "#4B5563",
        "text-muted": "#9CA3AF",
        "text-disabled": "#D1D5DB",
        "text-on-primary": "#FFFFFF",

        // Surface & Border
        "surface-app": "#F0FFF4",
        "surface-card": "#FFFFFF",
        "surface-tint": "#D1FAE5",
        "border-default": "#D1FAE5",
        "border-focus": "#059669",

        // Semantic
        success: "#059669",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Poppins_400Regular", "sans-serif"],
        poppins: ["Poppins_400Regular", "sans-serif"],
        "poppins-medium": ["Poppins_500Medium", "sans-serif"],
        "poppins-semibold": ["Poppins_600SemiBold", "sans-serif"],
        "poppins-bold": ["Poppins_700Bold", "sans-serif"],
        "poppins-light": ["Poppins_300Light", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "48px",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
