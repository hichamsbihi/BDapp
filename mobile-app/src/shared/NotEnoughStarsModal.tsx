import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getCurrentUser } from '@/services/authService';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { colors, radius, spacing, shadows, typography } from '@/theme/theme';

interface NotEnoughStarsModalProps {
  visible: boolean;
  onClose: () => void;
  needed: number;
  /** Current star balance — shows progress dots when provided */
  current?: number;
  onWatchMagic: () => Promise<unknown>;
}

/**
 * Modal "pas assez d'étoiles" — redesigned with gradient header and stars progress.
 * Two CTAs: gain a star (magic/ad) or buy more (paywall).
 * Tone: warm, encouraging, never blocking.
 */
export const NotEnoughStarsModal: React.FC<NotEnoughStarsModalProps> = ({
  visible,
  onClose,
  needed,
  current,
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

  const handleBuyStars = async () => {
    onClose();
    const user = await getCurrentUser();
    if (user) {
      router.push('/paywall');
    } else {
      router.push('/(auth)/login?from=paywall');
    }
  };

  const missing = current !== undefined ? needed - current : needed;
  const hasProgress = current !== undefined && needed <= 10;

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Gradient header */}
          <LinearGradient
            colors={['#FFD54F', '#FFEB9C', colors.background] as const}
            style={styles.header}
          >
            <Text style={styles.headerEmoji}>⭐</Text>
            <Text style={styles.headerTitle}>Presque là !</Text>
          </LinearGradient>

          <View style={styles.content}>
            {/* Stars progress dots */}
            {hasProgress && (
              <>
                <View style={styles.starsRow}>
                  {Array.from({ length: needed }).map((_, i) => (
                    <View
                      key={i}
                      style={[styles.starDot, i < (current ?? 0) && styles.starDotFilled]}
                    >
                      <Text style={styles.starDotText}>
                        {i < (current ?? 0) ? '⭐' : '☆'}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.progressLabel}>{current}/{needed} étoiles</Text>
              </>
            )}

            <Text style={styles.message}>
              {missing === 1
                ? 'Il te manque encore 1 petite étoile !'
                : `Il te manque encore ${missing} étoiles !`}
            </Text>
            <Text style={styles.subMessage}>
              Regarde une petite magie ou obtiens plus d'étoiles pour continuer !
            </Text>

            <View style={styles.buttons}>
              <AnimatedPressable
                style={[styles.buttonWrapper, isWatching && styles.buttonDisabled]}
                onPress={handleWatchMagic}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonInner}
                >
                  {isWatching ? (
                    <ActivityIndicator color={colors.text.inverse} size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonIcon}>✨</Text>
                      <Text style={styles.buttonTextWhite}>Gagner une étoile magique</Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.buttonWrapper, isWatching && styles.buttonDisabled]}
                onPress={handleBuyStars}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={['#FFD54F', '#F5C430'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonInner}
                >
                  <Text style={styles.buttonIcon}>⭐</Text>
                  <Text style={styles.buttonTextDark}>Obtenir plus d'étoiles</Text>
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.buttonLater}
                onPress={onClose}
                disabled={isWatching}
              >
                <Text style={styles.buttonLaterText}>Plus tard</Text>
              </AnimatedPressable>
            </View>
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
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    ...shadows.lg,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 52,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  content: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  starDot: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starDotFilled: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  starDotText: {
    fontSize: typography.size.xl,
  },
  progressLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subMessage: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.6,
    marginBottom: spacing.xl,
  },
  buttons: {
    width: '100%',
    gap: spacing.md,
  },
  buttonWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  buttonIcon: {
    fontSize: typography.size.xl,
  },
  buttonTextWhite: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  buttonTextDark: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  buttonLater: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  buttonLaterText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
