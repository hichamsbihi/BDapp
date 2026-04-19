import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useAppStore } from '@/store';
import { preloadRewarded } from '@/services/adService';
import { CREDIT_PACKS, PACK_UNLIMITED } from '@/constants/stars';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';
import { AnimatedPressable } from '@/shared/AnimatedPressable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_MAX_WIDTH = spacing.xxxl * 7 + spacing.xl;
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - spacing.xl * 2, MODAL_MAX_WIDTH);
const HERO_SIZE = spacing.xxxl + spacing.xxxl + spacing.xl;
const FLOAT_DURATION = 3000;

interface StarsModalProps {
  visible: boolean;
  onClose: () => void;
}

function FloatingStar({
  size,
  top,
  left,
  delay,
}: {
  size: number;
  top: number;
  left: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.7, { duration: FLOAT_DURATION / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: FLOAT_DURATION / 2, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-spacing.sm, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingStar,
        { width: size, height: size, borderRadius: size / 2, top, left },
        style,
      ]}
    />
  );
}

export const StarsModal: React.FC<StarsModalProps> = ({ visible, onClose }) => {
  const credits = useAppStore((s) => s.credits);
  const rewardCredits = useAppStore((s) => s.rewardCredits);

  const handleGoToPaywall = () => {
    Alert.alert(
      'Bientôt disponible 🚀',
      'Le paiement sera disponible très prochainement. Reste connecté !',
      [{ text: 'OK' }],
    );
  };

  const [isWatching, setIsWatching] = useState(false);

  const contentScale = useSharedValue(0.92);
  const contentOpacity = useSharedValue(0);
  const balanceScale = useSharedValue(1);
  const watchScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    preloadRewarded();
    contentScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    contentOpacity.value = withTiming(1, { duration: 300 });
    balanceScale.value = 0.85;
    balanceScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 100 }));
  }, [visible]);

  const handleWatchAd = async () => {
    if (isWatching) return;
    setIsWatching(true);
    try {
      await rewardCredits('watch_ad');
    } finally {
      setIsWatching(false);
    }
  };

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }],
  }));

  const balanceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
  }));

  const watchButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: watchScale.value }],
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.contentWrap} onPress={(e) => e.stopPropagation()}>
          <Animated.View style={[styles.content, contentAnimatedStyle]}>
            <LinearGradient
              colors={['#FFFBF5', '#FFF5E8', '#FFFCF5'] as const}
              style={styles.gradientBg}
            />

            {visible && (
              <>
                <LottieView
                  source={require('@/assets/animations/sparkle-loop.json')}
                  autoPlay
                  loop
                  style={[styles.bgSparkle, styles.bgSparkle1]}
                />
                <FloatingStar size={spacing.md} top={spacing.xl} left={spacing.xl} delay={0} />
                <FloatingStar
                  size={spacing.sm}
                  top={spacing.xxxl - spacing.sm}
                  left={MODAL_WIDTH - (spacing.xxxl - spacing.sm)}
                  delay={400}
                />
                <FloatingStar
                  size={spacing.md - spacing.xxs}
                  top={spacing.xxxl + spacing.xl - spacing.xxs}
                  left={MODAL_WIDTH / 2 - (spacing.lg + spacing.xs)}
                  delay={200}
                />
              </>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Hero: balance */}
              <View style={styles.hero}>
                <Animated.View style={[styles.heroBalance, balanceAnimatedStyle]}>
                  <View style={styles.heroGlow} />
                  <Text style={styles.heroNumber} allowFontScaling={false}>{credits}</Text>
                  <Text style={styles.heroLabel}>crédits</Text>
                </Animated.View>
              </View>

              {/* Watch ad */}
              <Animated.View style={watchButtonStyle}>
                <AnimatedPressable
                  accessibilityLabel="Regarder une magie"
                  onPressIn={() => {
                    watchScale.value = withSpring(0.96);
                  }}
                  onPressOut={() => {
                    watchScale.value = withSpring(1);
                  }}
                  onPress={handleWatchAd}
                  disabled={isWatching}
                  style={[styles.watchRow, isWatching && styles.buttonDimmed]}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.watchGradient}
                  >
                    {isWatching ? (
                      <ActivityIndicator color={colors.text.inverse} size="small" />
                    ) : (
                      <>
                        <Text style={styles.watchIcon}>✨</Text>
                        <Text style={styles.watchLabel}>Regarder une magie</Text>
                      </>
                    )}
                  </LinearGradient>
                </AnimatedPressable>
              </Animated.View>

              {/* Inline pack cards */}
              <View style={styles.packsSection}>
                <Text style={styles.packsSectionTitle}>Obtenir des crédits</Text>
                {CREDIT_PACKS.map((pack) => (
                  <AnimatedPressable
                    key={pack.productId}
                    style={styles.packRow}
                    onPress={handleGoToPaywall}
                  >
                    <Text style={styles.packEmoji}>{pack.emoji}</Text>
                    <View style={styles.packInfo}>
                      <Text style={styles.packLabel}>{pack.label}</Text>
                      <Text style={styles.packCredits}>{pack.credits} crédits</Text>
                    </View>
                    <Text style={styles.packPrice}>{pack.priceDollar.toFixed(2)} $</Text>
                  </AnimatedPressable>
                ))}

                <AnimatedPressable
                  style={styles.unlimitedRow}
                  onPress={handleGoToPaywall}
                >
                  <LinearGradient
                    colors={['#FFE082', '#FFD54F', '#FFB300'] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.unlimitedGradient}
                  >
                    <Text style={styles.packEmoji}>{PACK_UNLIMITED.emoji}</Text>
                    <View style={styles.packInfo}>
                      <Text style={styles.unlimitedLabel}>{PACK_UNLIMITED.label}</Text>
                      <Text style={styles.unlimitedSub}>Crédits illimités — à vie</Text>
                    </View>
                    <Text style={styles.unlimitedPrice}>{PACK_UNLIMITED.priceDollar.toFixed(2)} $</Text>
                  </LinearGradient>
                </AnimatedPressable>
              </View>

              <AnimatedPressable
                accessibilityLabel="Fermer"
                onPress={onClose}
                style={[styles.closeBtn]}
              >
                <Text style={styles.closeText}>Fermer</Text>
              </AnimatedPressable>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  contentWrap: {
    width: MODAL_WIDTH,
    maxHeight: '88%',
  },
  content: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: spacing.xxs,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  bgSparkle: {
    position: 'absolute',
    opacity: 0.25,
    pointerEvents: 'none',
  },
  bgSparkle1: {
    width: spacing.xxxl + spacing.xxl,
    height: spacing.xxxl + spacing.xxl,
    top: spacing.sm,
    right: spacing.sm,
  },
  floatingStar: {
    position: 'absolute',
    backgroundColor: colors.accent,
    pointerEvents: 'none',
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  heroBalance: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: HERO_SIZE + spacing.xl,
    height: HERO_SIZE + spacing.xl,
    borderRadius: (HERO_SIZE + spacing.xl) / 2,
    backgroundColor: colors.surfaceWarm,
  },
  heroNumber: {
    fontSize: spacing.xxxl + spacing.xs,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
    textShadowColor: colors.accent,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: spacing.xxs,
    textTransform: 'lowercase',
  },
  watchRow: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  watchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  watchIcon: {
    fontSize: typography.size.xl + spacing.xxs,
  },
  watchLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  packsSection: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  packsSectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  packEmoji: {
    fontSize: 22,
    marginRight: spacing.md,
  },
  packInfo: {
    flex: 1,
  },
  packLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  packCredits: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  packPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  unlimitedRow: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
    shadowColor: '#FFB300',
  },
  unlimitedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  unlimitedLabel: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  unlimitedSub: {
    fontSize: typography.size.xs,
    color: 'rgba(0,0,0,0.55)',
    marginTop: 1,
  },
  unlimitedPrice: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.extrabold,
    color: colors.text.primary,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
  buttonDimmed: {
    opacity: 0.85,
  },
});
