import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography, radius } from '@/theme';
import { ComicIllustration } from './ComicIllustration';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  illustrationVariant?: React.ComponentProps<typeof ComicIllustration>['variant'];
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  illustrationVariant = 'empty',
  style,
}) => (
  <View style={[styles.container, style]}>
    <ComicIllustration variant={illustrationVariant} size="large" />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction && (
      <Button
        title={actionLabel}
        onPress={onAction}
        variant="primary"
        size="large"
        style={styles.button}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    marginTop: spacing.xl,
    marginBottom: spacing.sm + spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});
