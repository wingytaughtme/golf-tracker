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
        // Birdie Book Premium Golf Theme
        primary: {
          DEFAULT: '#1E4D3B',
          50: '#F0F7F4',
          100: '#D9EBE4',
          200: '#B3D7C9',
          300: '#8DC3AE',
          400: '#4A9B7C',
          500: '#1E4D3B',
          600: '#1A4334',
          700: '#15362A',
          800: '#102921',
          900: '#0B1C16',
        },
        secondary: {
          DEFAULT: '#D4AF6A',
          50: '#FBF8F1',
          100: '#F5ECDA',
          200: '#EBDAB5',
          300: '#E2C890',
          400: '#D4AF6A',
          500: '#C9A055',
          600: '#B08840',
          700: '#8A6A32',
          800: '#644D24',
          900: '#3E3016',
        },
        // Background colors
        cream: {
          DEFAULT: '#FAF8F2',
          50: '#FFFFFF',
          100: '#FDFCF9',
          200: '#FAF8F2',
          300: '#F5F1E8',
          400: '#EDE5D4',
          500: '#E0D8C8',
        },
        // Card and surface colors
        card: {
          DEFAULT: '#FDFBF7',
          border: '#E0D8C8',
        },
        // Text colors
        charcoal: '#1C1C1C',
        muted: '#5D5D5D',
        // Golf score colors (Birdie Book theme)
        score: {
          eagle: '#355E3B',         // Hunter Green (same as birdie)
          birdie: '#355E3B',        // Hunter Green
          par: '#E0D8C8',           // Beige (unchanged)
          bogey: '#E8D9B5',         // Champagne Gold
          'bogey-light': '#F5EDD8', // Lighter Champagne
          double: '#8C3A3A',        // Deep Burgundy
          'double-light': '#C4A3A3', // Lighter Burgundy
          triple: '#8C3A3A',        // Deep Burgundy (same as double)
          'triple-light': '#C4A3A3', // Lighter Burgundy
        },
        // Status colors
        status: {
          success: '#C8E6C9',
          'success-text': '#2E7D32',
          warning: '#FFE082',
          'warning-text': '#5D4037',
          error: '#FFCDD2',
          'error-text': '#C62828',
        },
        // Legacy golf colors (updated to Birdie Book theme)
        golf: {
          background: '#FAF8F2',
          text: '#1C1C1C',
          birdie: '#355E3B',        // Hunter Green
          eagle: '#355E3B',         // Hunter Green (same as birdie)
          bogey: '#E8D9B5',         // Champagne Gold
          double: '#8C3A3A',        // Deep Burgundy
          triple: '#8C3A3A',        // Deep Burgundy (same as double)
          par: '#E0D8C8',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
        'button': '6px',
        'input': '6px',
        'badge': '16px',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.1)',
        'elevated': '0 4px 12px rgba(0,0,0,0.08)',
      },
      spacing: {
        'header': '64px',
      },
    },
  },
  plugins: [],
};
export default config;
