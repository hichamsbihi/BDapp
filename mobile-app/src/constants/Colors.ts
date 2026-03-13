/**
 * @deprecated Use `import { colors } from '@/theme'` instead.
 * This file is kept for backward compatibility only.
 */
import { colors } from '@/theme';

const tintColorLight = colors.accent;
const tintColorDark = colors.surface;

export default {
  light: {
    text: colors.ink,
    background: colors.background,
    tint: tintColorLight,
    tabIconDefault: colors.inkMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: colors.surface,
    background: colors.ink,
    tint: tintColorDark,
    tabIconDefault: colors.inkMuted,
    tabIconSelected: tintColorDark,
  },
};
