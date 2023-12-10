const gray = {
  "new-gray-25": "#FCFCFD",
  "new-gray-50": "#F9FAFB",
  "new-gray-100": "#F2F4F7",
  "new-gray-200": "#EAECF0",
  "new-gray-300": "#D0D5DD",
  "new-gray-400": "#98A2B3",
  "new-gray-500": "#667085",
  "new-gray-600": "#475467",
  "new-gray-700": "#344054",
  "new-gray-800": "#1D2939",
  "new-gray-900": "#101828",
};

const red = {
  "red-25": "#FFFBFA",
  "red-50": "#FEF3F2",
  "red-100": "#FEE4E2",
  "red-200": "#FECDCA",
  "red-300": "#FDA29B",
  "red-400": "#F97066",
  "red-500": "#F04438",
  "red-600": "#D92D20",
  "red-700": "#B42318",
  "red-800": "#912018",
  "red-900": "#7A271A",
};

const yellow = {
  "yellow-25": "#FFFCF5",
  "yellow-50": "#FFFAEB",
  "yellow-100": "#FEF0C7",
  "yellow-200": "#FEDF89",
  "yellow-300": "#FEC84B",
  "yellow-400": "#FDB022",
  "yellow-500": "#F79009",
  "yellow-600": "#DC6803",
  "yellow-700": "#B54708",
  "yellow-800": "#93370D",
  "yellow-900": "#7A2E0E",
};

const green = {
  "green-25": "#F6FEF9",
  "green-50": "#ECFDF3",
  "green-100": "#D1FADF",
  "green-200": "#A6F4C5",
  "green-300": "#6CE9A6",
  "green-400": "#32D583",
  "green-500": "#12B76A",
  "green-600": "#039855",
  "green-700": "#027A48",
  "green-800": "#05603A",
  "green-900": "#054F31",
};

const primary = {
  "blue-25": "#f5faff",
  "blue-50": "#f0f7ff",
  "blue-100": "#e0edfb",
  "blue-200": "#c3def8",
  "blue-300": "#a1ccf7",
  "blue-400": "#71aaeb",
  "blue-500": "#3b89e3",
  "blue-600": "#2575d0",
  "blue-700": "#306cbb",
  "blue-800": "#335f99",
  "blue-900": "#264773",
  "blue-950": "#1a3960",
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: { ...gray, ...red, ...yellow, ...green, ...primary },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
