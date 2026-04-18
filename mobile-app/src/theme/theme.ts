/**
 * Design System - Single source of truth for all design tokens.
 *
 * Palette: warm parchment tones matching the "illustrated storybook" identity.
 * Every shared component and feature screen should import from here
 * instead of hardcoding hex values.
 */

export const colors = {
  primary: '#FF8A65',
  primaryDark: '#E57049',
  secondary: '#7EC8E3',
  secondaryDark: '#5BB0D0',
  accent: '#FFD54F',

  background: '#FFFCF5',
  surface: '#F5EBE0',
  surfaceElevated: '#FFFFFF',
  border: '#E8E0D5',
  borderLight: '#F0EAE0',

  text: {
    primary: '#4A3F32',
    secondary: '#5D4E37',
    muted: '#9A8B7A',
    inverse: '#FFFFFF',
    link: '#FF8A65',
  },

  semantic: {
    success: '#66BB6A',
    successBg: '#E8F5E9',
    warning: '#FFA726',
    warningBg: '#FFF3E0',
    error: '#EF5350',
    errorBg: '#FFEBEE',
    info: '#42A5F5',
    infoBg: '#E3F2FD',
  },

  universe: {
    fantasy: '#C8A2C8',
    space: '#7EC8E3',
    ocean: '#4FC3F7',
  },

  overlay: 'rgba(0, 0, 0, 0.45)',
  overlayHeavy: 'rgba(0, 0, 0, 0.6)',
  surfaceWarm: '#FFF8F0',
  surfaceMuted: '#FFFAF6',
  borderMedium: '#EBE3D8',

  /** Full-screen backdrop for image generation (magic / night) */
  generatingBackground: '#1A1625',
  /** Soft glow behind the magic canvas */
  generatingGlow: '#A78BFA',
  /** Light band for page image reveal shimmer (keeps animated opacity as sole driver) */
  shimmerSheen: 'rgba(255, 255, 255, 0.4)',
  /** Secondary line on generating screen (white, readable on night backdrop) */
  generatingTextMuted: 'rgba(255, 255, 255, 0.75)',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const typography = {
  family: {
    heading: 'System',
    body: 'System',
    accent: 'Georgia',
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    display: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  },
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  animation,
} as const;

export type Theme = typeof theme;
