/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sv: {
          primary: "#ffffff",
          secondary: "#c1fbdf",
          danger: "#e5411e",
          "primary-200": "#BAA9FF",
          "primary-900": "#380788",
          "gray-100": "#FAFAFC",
          "gray-200": "#E9E5EF",
          "gray-300": "#C9C4D1",
          "gray-400": "#AEA9B8",
          "gray-500": "#7E7A88",
          "gray-600": "#57535F",
          "gray-700": "#39363E",
          "gray-800": "#26242A",
          purple: "#6210cc",
          neutral: "#aea9b8",
          muted: "#f2f2f2",
          gray: "#454545",
          "light-purple": "#957aff",
        },
      },
    },
  },
  plugins: [],
};
