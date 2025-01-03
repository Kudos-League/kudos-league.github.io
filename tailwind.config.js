module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}", "./App.tsx"],
  theme: {
    extend: {
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
  corePlugins: require("tailwind-rn/unsupported-core-plugins"),
};
