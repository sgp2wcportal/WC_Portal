/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: '#06B6D4',
        secondary: '#0891B2',
        success: '#059669',
        danger: '#E11D48',
        warning: '#FB923C',

        // Pastel cyan — remapped from saffron so existing classes auto-update
        saffron: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
        },
        // Baby yellow accent — remapped from marigold
        marigold: {
          400: '#FDE047',
          500: '#FACC15',
          600: '#EAB308',
        },
        emeraldx: {
          50: '#ECFDF5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        indigox: {
          50: '#EEF2FF',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        ink: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          400: '#A8A29E',
          600: '#57534E',
          800: '#292524',
          900: '#1C1917',
        },
        cream: '#F0FDFF',
      },
      backgroundImage: {
        'festive-hero':
          'radial-gradient(at 20% 0%, rgba(6,182,212,.15) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(250,204,21,.10) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(34,211,238,.12) 0px, transparent 50%)',
        'festive-page':
          'radial-gradient(at 0% 0%, rgba(6,182,212,.08) 0px, transparent 40%), radial-gradient(at 100% 100%, rgba(250,204,21,.06) 0px, transparent 40%)',
        'saffron-grad': 'linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #FACC15 100%)',
        'emerald-grad': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'indigo-grad': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'sunrise-grad': 'linear-gradient(135deg, #CFFAFE 0%, #ECFEFF 50%, #FEF9C3 100%)',
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(6, 182, 212, 0.45)',
        glowEmerald: '0 10px 40px -10px rgba(5, 150, 105, 0.45)',
        glowIndigo: '0 10px 40px -10px rgba(79, 70, 229, 0.45)',
        soft: '0 1px 2px rgba(28, 25, 23, 0.04), 0 8px 24px -8px rgba(28, 25, 23, 0.10)',
        ringy: '0 0 0 4px rgba(6, 182, 212, 0.18)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'soft-pulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(6, 182, 212, 0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        floaty: 'floaty 4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'fade-in-up': 'fade-in-up .5s cubic-bezier(.2,.7,.2,1) both',
        'soft-pulse': 'soft-pulse 1.8s ease-out infinite',
        'spin-slow': 'spinSlow 18s linear infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
}
