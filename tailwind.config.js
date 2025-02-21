const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          50: '#e6f0f7',
          100: '#cce1ef',
          200: '#99c3df',
          300: '#66a5cf',
          400: '#3387bf',
          500: '#00457C', // Main primary color
          600: '#003863',
          700: '#002b4a',
          800: '#001d32',
          900: '#000e19',
        },
        // Slate Colors
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Emerald Colors
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          '400/10': 'rgba(52, 211, 153, 0.1)', // Custom opacity for gradients
          '500/10': 'rgba(16, 185, 129, 0.1)', // Add this for badge-success
        },
        // Amber Colors
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          '400/10': 'rgba(251, 191, 36, 0.1)', // Custom opacity for gradients
          '500/10': 'rgba(245, 158, 11, 0.1)', // Add this for badge-warning
        },
        // Sky Colors
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          '400/10': 'rgba(56, 189, 248, 0.1)', // Custom opacity for gradients
          '500/10': 'rgba(14, 165, 233, 0.1)', // Add this for badge-info
        },
        // Red Colors (for error states)
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          '300/20': 'rgba(252, 165, 165, 0.2)', // Custom opacity for error states
        },
      },
      boxShadow: {
        'card': '0 0 50px 0 rgb(0 69 124 / 0.15)',
        'sm': '0 1px 3px 0 rgb(0 69 124 / 0.1), 0 1px 2px -1px rgb(0 69 124 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 69 124 / 0.1), 0 2px 4px -2px rgb(0 69 124 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 69 124 / 0.1), 0 4px 6px -4px rgb(0 69 124 / 0.1)',
      },
    },
  },
  plugins: [],
});