/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        kameron: ["Kameron", "sans-serif"],
      },
      colors: {
        // Modern theme (current)
        modern: {
          peach: "#ffdab3",
          purple: "#574964",
          "purple-light": "#9f8383",
          "purple-lighter": "#c8aaaa",
          orange: "#f55d3e",
          red: "#d11f2f",
          teal: "#07707a",
          yellow: "#f5b83e",
        },
        // Dark theme
        dark: {
          bg: "#1a1a1a",
          text: "#ffffff",
          primary: "#3d3d3d",
          secondary: "#2d2d2d",
          accent: "#6366f1",
          "accent-light": "#818cf8",
        },
        // Light theme
        light: {
          bg: "#ffffff",
          text: "#1a1a1a",
          primary: "#f3f4f6",
          secondary: "#e5e7eb",
          accent: "#2563eb",
          "accent-light": "#3b82f6",
        },
        // Blue theme
        blue: {
          bg: "#f0f9ff",
          text: "#1e3a8a",
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#1d4ed8",
          "accent-light": "#2563eb",
        },
      },
    },
  },
  plugins: [],
};
