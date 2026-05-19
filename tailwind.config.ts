// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#E6F0FA',
          100: '#B3D4F0',
          200: '#80B8E5',
          300: '#4D9CDB',
          400: '#1A80D0',
          500: '#0077C0',
          600: '#005F9A',
          700: '#004774',
          800: '#003066',
          900: '#003366',
        },
        success: '#00B464',
        warning: '#F59E0B',
        error: '#EF4444',
        background: '#F4F6F8',
      },
    },
  },
  plugins: [],
};

export default config;