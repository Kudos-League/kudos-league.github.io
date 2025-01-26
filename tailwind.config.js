module.exports = {
  content: [
    "./App.tsx",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./shared/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      gap: {
        DEFAULT: "0",
        0: "0",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
      },
      colors: {
        blue: {
          500: "#3b82f6",
        },
        gray: {
          100: "#f3f3f3",
        },
        black: "#000000",
      },
    },
  },
  plugins: [],
  corePlugins: require("tailwind-rn/unsupported-core-plugins"), // Fix the typo "scorePlugins"
};
