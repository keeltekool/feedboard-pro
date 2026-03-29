// Feedboard Tailwind CSS Configuration
// Add this to your tailwind.config.js or tailwind.config.ts

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary - Cyan (Brand Accent)
        primary: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',  // Main brand color
          700: '#0E7490',
          800: '#155E75',
          900: '#164E63',
          950: '#083344',
        },
        
        // Neutral - Slate
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        },
      },
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      
      boxShadow: {
        'focus': '0 0 0 3px rgba(8, 145, 178, 0.25)',
      },
    },
  },
}

// ============================================
// COMPONENT CLASS PATTERNS
// Use these patterns throughout the app
// ============================================

/*
BUTTONS:

Primary Button:
  className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"

Secondary Button:
  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-4 py-2 rounded-lg transition-colors"

Outline Button:
  className="border border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors"

Ghost Button:
  className="hover:bg-slate-100 text-slate-600 font-medium px-4 py-2 rounded-lg transition-colors"


TOPIC PILLS/TAGS:

Default Pill (inactive):
  className="px-4 py-2 rounded-full border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"

Active Pill:
  className="px-4 py-2 rounded-full bg-primary-600 text-white font-medium"

Add Topic Pill:
  className="px-4 py-2 rounded-full border border-dashed border-slate-300 text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"


CARDS:

News Card:
  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"

Card with Source Icon:
  className="flex items-start gap-4"
  - Icon container: className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"

Interactive Card:
  className="bg-white border border-slate-200 hover:border-primary-300 hover:shadow-md rounded-xl p-4 transition-all cursor-pointer"


TABS:

Tab Container:
  className="flex gap-1 border-b border-slate-200"

Tab (inactive):
  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium border-b-2 border-transparent"

Tab (active):
  className="px-4 py-2 text-primary-600 font-medium border-b-2 border-primary-600"


NAVIGATION:

Nav Link (inactive):
  className="text-slate-600 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"

Nav Link (active):
  className="text-primary-600 bg-primary-50 font-medium px-3 py-2 rounded-lg"


INPUTS:

Text Input:
  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"

Search Input:
  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"


SOURCE BADGES:

Source Label:
  className="text-sm text-primary-600 hover:text-primary-700 font-medium"

Time Label:
  className="text-sm text-slate-400"


HEADER:

Header Container:
  className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white"

Logo Area:
  className="flex items-center gap-2"

Refresh Button:
  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
*/
