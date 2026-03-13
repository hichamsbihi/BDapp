import { Platform } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F5F2',
  ink: '#1A1A1A',
  inkLight: '#555555',
  inkMuted: '#999999',
  accent: '#E85D3A',
  accentDark: '#C94B2A',
  accentLight: '#FFF3EE',
  border: '#1A1A1A',
  borderLight: '#E0DDD8',
  success: '#3AAF6B',
  error: '#E04848',
  overlay: 'rgba(0, 0, 0, 0.55)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
  full: 9999,
} as const;

export const typography = {
  hero: { fontSize: 34, fontWeight: '900' as const, letterSpacing: -0.8 },
  title: { fontSize: 26, fontWeight: '800' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '500' as const },
  label: { fontSize: 14, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  button: { fontSize: 18, fontWeight: '800' as const, letterSpacing: 0.2 },
  buttonSmall: { fontSize: 14, fontWeight: '700' as const },
} as const;

const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  shadowRadius: number,
  elevation: number,
) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: offsetY },
  shadowOpacity: opacity,
  shadowRadius: shadowRadius,
  ...(Platform.OS === 'android' ? { elevation } : {}),
});

export const shadows = {
  card: createShadow('#000', 3, 0.06, 8, 3),
  cardLifted: createShadow('#000', 6, 0.1, 12, 5),
  button: createShadow('#000', 4, 0.15, 6, 4),
  soft: createShadow('#000', 2, 0.04, 6, 2),
  comic: createShadow('#000', 5, 0.18, 0, 5),
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;
