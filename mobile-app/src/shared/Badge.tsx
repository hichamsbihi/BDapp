import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surface, text: colors.text.secondary },
  success: { bg: colors.semantic.successBg, text: colors.semantic.success },
  warning: { bg: colors.semantic.warningBg, text: colors.semantic.warning },
  error: { bg: colors.semantic.errorBg, text: colors.semantic.error },
  info: { bg: colors.semantic.infoBg, text: colors.semantic.info },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
}) => {
  const palette = variantColors[variant];

  return (
    <View
      accessibilityRole="text"
      style={[styles.badge, { backgroundColor: palette.bg }, style]}
    >
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});
