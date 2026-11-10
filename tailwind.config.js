/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        bg: 'var(--bg)',
        subtle: 'var(--bg-subtle)',
        card: 'var(--card)',
        line: 'var(--border)',
        ink: 'var(--text)',
        ink2: 'var(--text-2)',
        accent: { DEFAULT: '#1F5BFF', hover: '#1647D6', soft: 'var(--accent-soft)' },
        st: { amber: '#D97706', green: '#059669', red: '#DC2626' },
      },
      borderRadius: { card: '12px' },
      boxShadow: { card: 'var(--shadow)', pop: '0 12px 40px -12px rgba(0,0,0,.25)' },
      screens: { xl2: '1280px' },
    },
  },
  plugins: [],
}
