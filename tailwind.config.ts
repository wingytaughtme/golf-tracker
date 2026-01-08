import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Golf Tracker color palette
        primary: {
          DEFAULT: '#1B4D3E',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#1B4D3E',
          600: '#164034',
          700: '#11332A',
          800: '#0C2620',
          900: '#071916',
        },
        secondary: {
          DEFAULT: '#2D5A27',
          500: '#2D5A27',
          600: '#254B20',
          700: '#1D3C19',
        },
        accent: {
          DEFAULT: '#C5A572',
          light: '#D4BC94',
          dark: '#B08E50',
        },
        golf: {
          background: '#F5F5F0',
          text: '#1A1A1A',
          birdie: '#228B22',
          eagle: '#DAA520',
          bogey: '#CD5C5C',
          par: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Roboto Slab', 'serif'],
        mono: ['ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
