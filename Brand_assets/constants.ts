/**
 * Feedboard Brand Constants
 * Import and use throughout the application
 */

export const colors = {
  // Primary - Cyan
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
    800: '#1E293B',  // Main text color
    900: '#0F172A',
    950: '#020617',
  },
  
  // Semantic
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
  },
  
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', 'Monaco', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  focus: '0 0 0 3px rgba(8, 145, 178, 0.25)',
} as const;

// Semantic tokens for easier use
export const theme = {
  // Backgrounds
  bg: {
    page: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceRaised: colors.slate[50],
    surfaceSunken: colors.slate[100],
    accent: colors.primary[50],
    accentMuted: colors.primary[100],
  },
  
  // Text
  text: {
    primary: colors.slate[800],
    secondary: colors.slate[600],
    tertiary: colors.slate[500],
    muted: colors.slate[400],
    disabled: colors.slate[400],
    inverse: '#FFFFFF',
    accent: colors.primary[600],
    accentHover: colors.primary[700],
  },
  
  // Borders
  border: {
    default: colors.slate[200],
    muted: colors.slate[100],
    strong: colors.slate[300],
    focus: colors.primary[500],
    accent: colors.primary[300],
  },
  
  // Pills
  pill: {
    inactive: {
      bg: 'transparent',
      border: colors.slate[200],
      text: colors.slate[600],
    },
    active: {
      bg: colors.primary[600],
      border: colors.primary[600],
      text: '#FFFFFF',
    },
  },
} as const;

// Dark mode overrides
export const darkTheme = {
  bg: {
    page: colors.slate[950],
    surface: colors.slate[900],
    surfaceRaised: colors.slate[800],
  },
  text: {
    primary: colors.slate[100],
    secondary: colors.slate[300],
    tertiary: colors.slate[400],
    accent: colors.primary[400],
  },
  border: {
    default: colors.slate[700],
    muted: colors.slate[800],
  },
} as const;

// Default export
const brandConstants = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  theme,
  darkTheme,
};

export default brandConstants;
