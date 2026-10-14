import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        umss: {
          navy: '#1E3A5F',
          orange: '#E8503A',
          cream: '#F5F0E8',
          light: '#F5F5F5',
          dark: '#1B2632',
          sand: '#EEE9DF',
          red: '#8B0000',
        },
        palladian: "#EEE9DF",
        oatmeal: "#C9C1B1",
        "blue-fantastic": "#2C3B4D",
        "burning-flame": "#FFB162",
        "truffle-trouble": "#A35139",
        "abyssal-blue": "#1B2632",
        abyssal: "#1B2632",
      },
      boxShadow: {
        umss: '0 4px 14px 0 rgba(30, 58, 95, 0.10)',
        'umss-lg': '0 10px 30px 0 rgba(30, 58, 95, 0.15)',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
