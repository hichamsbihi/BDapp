/**
 * ErrorFallback — user-friendly error screen with retry action.
 * Designed for inline use when a data fetch fails.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, spacing, radius, typography } from '@/theme/theme';

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  message = 'Une erreur est survenue. Veuillez réessayer.',
  onRetry,
}) => (
  <View style={styles.container}>
    <Text style={styles.emoji}>{'  '}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <AnimatedPressable onPress={onRetry} style={styles.button}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </AnimatedPressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: typography.size.display,
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.lg * typography.lineHeight.normal,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  },
});
