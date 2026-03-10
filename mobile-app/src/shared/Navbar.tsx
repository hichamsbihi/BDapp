import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '@/theme/theme';
import { StarsBadgeWithModal } from './StarsBadgeWithModal';

interface NavbarProps {
  title: string;
  showStars?: boolean;
  style?: ViewStyle;
  /** Optional right-side element (replaces stars badge if provided) */
  rightElement?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  showStars = false,
  style,
  rightElement,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }, style]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightElement ?? (showStars && <StarsBadgeWithModal />)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
});
