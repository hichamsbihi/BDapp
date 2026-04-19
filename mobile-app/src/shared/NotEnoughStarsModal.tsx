import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { StarsModal } from '@/shared/StarsModal';
import { colors, radius, spacing, shadows, typography } from '@/theme/theme';

interface NotEnoughStarsModalProps {
  visible: boolean;
  onClose: () => void;
  needed: number;
  current?: number;
}

export const NotEnoughStarsModal: React.FC<NotEnoughStarsModalProps> = ({
  visible,
  onClose,
  needed,
  current,
}) => {
  const [showStarsModal, setShowStarsModal] = useState(false);

  const handleGetStars = () => {
    onClose();
    setShowStarsModal(true);
  };

  const missing = current !== undefined ? needed - current : needed;
  const hasProgress = current !== undefined && needed <= 10;

  return (
    <>
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={['#FFD54F', '#FFEB9C', colors.background] as const}
              style={styles.header}
            >
              <Text style={styles.headerEmoji}>⭐</Text>
              <Text style={styles.headerTitle}>Presque là !</Text>
            </LinearGradient>

            <View style={styles.content}>
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
                Obtiens plus d'étoiles pour continuer !
              </Text>

              <View style={styles.buttons}>
                <AnimatedPressable
                  style={styles.buttonWrapper}
                  onPress={handleGetStars}
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
                >
                  <Text style={styles.buttonLaterText}>Plus tard</Text>
                </AnimatedPressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </RNModal>

      <StarsModal
        visible={showStarsModal}
        onClose={() => setShowStarsModal(false)}
      />
    </>
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
});
