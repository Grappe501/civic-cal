/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ark: {
          rust: "#B84A32",
          clay: "#C4785A",
          pine: "#2D4A3E",
          sage: "#6B8F71",
          wheat: "#F5E6D3",
          sky: "#7BAFD4",
          night: "#1A1F2E",
          porch: "#FAF7F2",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
