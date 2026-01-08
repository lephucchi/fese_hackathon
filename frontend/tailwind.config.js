/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Robinhood-esque Color Palette
        primary: {
          DEFAULT: '#00C805', // Robinhood Green
          light: '#33D433',
          dark: '#00A004',
        },
        secondary: {
          DEFAULT: '#1F2937', // Dark Slate
        },
        accent: {
          DEFAULT: '#FFD700', // Gold
          orange: '#FF9F1C',
        },
        success: '#00C805',
        warning: '#FF9F1C',
        error: '#FF5A5F',
        risk: '#FF5A5F',
        mpoints: '#FFD700',
        
        // Text Colors
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
          muted: '#D1D5DB',
        },
        
        // Surface Colors
        surface: {
          DEFAULT: '#F0F2F5',
          hover: '#E8EAED',
          active: '#DDE0E3',
        },
        
        // Background
        background: {
          DEFAULT: '#FFFFFF',
          soft: '#F5F9F9',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '24px',
        'lg-custom': '20px',
        'md-custom': '16px',
        'pill': '9999px',
      },
      boxShadow: {
        'fintech': '0 4px 24px rgba(0, 0, 0, 0.06)',
        'fintech-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glow-green': '0 0 24px rgba(0, 200, 5, 0.2)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      letterSpacing: {
        'heading': '-0.02em',
      },
    },
  },
  plugins: [],
};
