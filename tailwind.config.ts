import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#8cc63f",
          greenDark: "#5a8a1f",
          blue: "#1b75bb",
          blueDark: "#155a8f",
          orange: "#f7941e",
        },
      },
      fontFamily: { sans: ["Arial", "Helvetica", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
