/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--background))',
        background: 'hsl(var(--background))',
        text: 'hsl(var(--foreground))',
        foreground: 'hsl(var(--foreground))',
        'hero-sub': 'hsl(var(--hero-sub-text))',
        surface: '#111118',
        border: '#1e1e2e',
        purple: '#8b5cf6',
        blue: '#3b82f6',
        green: '#10b981',
        yellow: '#f59e0b',
        red: '#ef4444',
        orange: '#f97316',
        muted: '#64748b',
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'Outfit', 'sans-serif'],
        heading: ['"General Sans"', 'Syne', 'Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
