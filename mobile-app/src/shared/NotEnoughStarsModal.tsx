import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '@/theme/theme';

interface NotEnoughStarsModalProps {
  visible: boolean;
  onClose: () => void;
  needed: number;
  /** Rituel magique (jamais "pub" ou "ad") - ex: rewardStar('watch_ad') */
  onWatchMagic: () => Promise<unknown>;
}

/**
 * Modal "pas assez d'etoiles"
 * Reassuring, magical tone - never blocking.
 * Never use "pub", "ad", "advertising" wording.
 */
export const NotEnoughStarsModal: React.FC<NotEnoughStarsModalProps> = ({
  visible,
  onClose,
  needed,
  onWatchMagic,
}) => {
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchMagic = async () => {
    setIsWatching(true);
    try {
      await onWatchMagic();
      onClose();
    } finally {
      setIsWatching(false);
    }
  };

  const message =
    needed === 1
      ? "Il te manque une petite étoile ✨"
      : `Il te manque ${needed} étoiles ✨`;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Presque là !</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.submessage}>
            Tu peux en gagner en regardant une courte magie, ou en finissant une
            histoire !
          </Text>

          <View style={styles.buttons}>
            <AnimatedPressable
              accessibilityLabel="Regarder une courte magie"
              style={[
                styles.buttonPrimary,
                isWatching && styles.buttonDisabled,
              ]}
              onPress={handleWatchMagic}
              disabled={isWatching}
            >
              {isWatching ? (
                <ActivityIndicator color={colors.text.inverse} size="small" />
              ) : (
                <View style={styles.buttonPrimaryContent}>
                  <Text style={styles.buttonPrimaryIcon}>✨</Text>
                  <Text style={styles.buttonPrimaryText}>
                    Regarder une courte magie
                  </Text>
                </View>
              )}
            </AnimatedPressable>

            <AnimatedPressable
              accessibilityLabel="Plus tard"
              style={[styles.buttonSecondary]}
              onPress={onClose}
              disabled={isWatching}
            >
              <Text style={styles.buttonSecondaryText}>⏳ Plus tard</Text>
            </AnimatedPressable>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: spacing.xxxl * 6 + spacing.xxl,
  },
  emoji: {
    fontSize: spacing.xxxl,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.size.lg + spacing.xxs,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  submessage: {
    fontSize: typography.size.md + spacing.xxs,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.size.lg + typography.size.sm,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
  },
  buttonPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xxs,
  },
  buttonSecondary: {
    alignItems: 'center',
    paddingVertical: spacing.md + spacing.xxs,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPrimaryIcon: {
    fontSize: typography.size.xl,
  },
  buttonPrimaryText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  buttonSecondaryText: {
    fontSize: typography.size.md + spacing.xxs,
    color: colors.text.muted,
  },
});
