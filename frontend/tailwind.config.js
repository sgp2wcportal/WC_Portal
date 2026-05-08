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
        // Legacy aliases kept so existing classes don't break
        primary: '#F59E0B',
        secondary: '#4F46E5',
        success: '#059669',
        danger: '#E11D48',
        warning: '#FB923C',

        // Festive palette
        saffron: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        marigold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
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
        cream: '#FFFAF1',
      },
      backgroundImage: {
        'festive-hero':
          'radial-gradient(at 20% 0%, rgba(245,158,11,.18) 0px, transparent 55%), radial-gradient(at 100% 0%, rgba(79,70,229,.14) 0px, transparent 50%), radial-gradient(at 80% 100%, rgba(5,150,105,.14) 0px, transparent 50%)',
        'festive-page':
          'radial-gradient(at 0% 0%, rgba(245,158,11,.08) 0px, transparent 40%), radial-gradient(at 100% 100%, rgba(79,70,229,.06) 0px, transparent 40%)',
        'saffron-grad': 'linear-gradient(135deg, #F59E0B 0%, #FB923C 50%, #E11D48 100%)',
        'emerald-grad': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'indigo-grad': 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        'sunrise-grad': 'linear-gradient(135deg, #FFEDD5 0%, #FFF7ED 50%, #ECFDF5 100%)',
      },
      boxShadow: {
        glow: '0 10px 40px -10px rgba(245, 158, 11, 0.45)',
        glowEmerald: '0 10px 40px -10px rgba(5, 150, 105, 0.45)',
        glowIndigo: '0 10px 40px -10px rgba(79, 70, 229, 0.45)',
        soft: '0 1px 2px rgba(28, 25, 23, 0.04), 0 8px 24px -8px rgba(28, 25, 23, 0.10)',
        ringy: '0 0 0 4px rgba(245, 158, 11, 0.18)',
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
          '0%,100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.45)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
        floaty: 'floaty 4s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'fade-in-up': 'fade-in-up .5s cubic-bezier(.2,.7,.2,1) both',
        'soft-pulse': 'soft-pulse 1.8s ease-out infinite',
        'spin-slow': 'spinSlow 18s linear infinite',
      },
    },
  },
  plugins: [],
}
