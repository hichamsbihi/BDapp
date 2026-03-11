import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
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
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { useAppStore } from '@/store';
import { useCountdownStatus } from '@/hooks/useCountdownStatus';
import { getCurrentUser } from '@/services/authService';
import {
  COUNTDOWN_REWARD,
  COUNTDOWN_HOURS,
  REWARD_WATCH_AD,
  STARS_PACK_SMALL,
  STARS_PACK_MEDIUM,
  STARS_PACK_LARGE,
} from '@/constants/stars';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - spacing.xl * 2, 360);
const HERO_SIZE = 120;
const RING_SIZE = 100;
const FLOAT_DURATION = 3000;

interface StarsModalProps {
  visible: boolean;
  onClose: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const s = Math.floor((ms / 1000) % 60);
  const m = Math.floor((ms / (1000 * 60)) % 60);
  const h = Math.floor(ms / (1000 * 60 * 60));
  // Always show seconds (requested UX)
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `0m ${s}s`;
}

/**
 * Floating star decoration - subtle drift animation
 */
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
          withTiming(-8, { duration: FLOAT_DURATION, easing: Easing.inOut(Easing.ease) }),
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

/**
 * Stars modal: treasure-chest feel, hero balance, visual countdown, minimal text, delight animations.
 */
export const StarsModal: React.FC<StarsModalProps> = ({ visible, onClose }) => {
  const stars = useAppStore((s) => s.stars);
  const rewardStar = useAppStore((s) => s.rewardStar);
  const { canClaim, nextClaimAt } = useCountdownStatus();

  const handlePackPress = async () => {
    const user = await getCurrentUser();
    if (!user) {
      onClose();
      router.push('/(auth)/login?from=stars');
    }
  };

  const [countdownLabel, setCountdownLabel] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const contentScale = useSharedValue(0.92);
  const contentOpacity = useSharedValue(0);
  const balanceScale = useSharedValue(1);
  const claimScale = useSharedValue(1);
  const watchScale = useSharedValue(1);
  const burstOpacity = useSharedValue(0);
  const progress = useSharedValue(0);

  const lottieBurstRef = React.useRef<LottieView>(null);

  useEffect(() => {
    if (!visible) return;
    contentScale.value = withSpring(1, { damping: 14, stiffness: 120 });
    contentOpacity.value = withTiming(1, { duration: 300 });
    balanceScale.value = 0.85;
    balanceScale.value = withDelay(200, withSpring(1, { damping: 10, stiffness: 100 }));
  }, [visible]);

  useEffect(() => {
    if (!visible || !nextClaimAt) {
      setCountdownLabel('');
      progress.value = 0;
      return;
    }
    const totalMs = COUNTDOWN_HOURS * 60 * 60 * 1000;
    const update = () => {
      const now = Date.now();
      const next = nextClaimAt.getTime();
      const remaining = Math.max(0, next - now);
      setCountdownLabel(formatCountdown(remaining));
      progress.value = withTiming(1 - remaining / totalMs, { duration: 500 });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [visible, nextClaimAt]);

  const handleClaimCountdown = async () => {
    if (!canClaim || isClaiming) return;
    setIsClaiming(true);
    setShowBurst(true);
    burstOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(1200, withTiming(0, { duration: 300 }))
    );
    lottieBurstRef.current?.reset();
    lottieBurstRef.current?.play();
    try {
      await rewardStar('countdown_bonus');
    } finally {
      setShowBurst(false);
      setIsClaiming(false);
    }
  };

  const handleWatchAd = async () => {
    if (isWatching) return;
    setIsWatching(true);
    try {
      await rewardStar('watch_ad');
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

  const claimButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: claimScale.value }],
  }));

  const watchButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: watchScale.value }],
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: burstOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.15, 0.5]),
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

            {/* Background sparkles */}
            {visible && (
              <>
                <LottieView
                  source={require('@/assets/animations/sparkle-loop.json')}
                  autoPlay
                  loop
                  style={[styles.bgSparkle, styles.bgSparkle1]}
                />
                <FloatingStar size={12} top={24} left={24} delay={0} />
                <FloatingStar size={8} top={40} left={MODAL_WIDTH - 40} delay={400} />
                <FloatingStar size={10} top={70} left={MODAL_WIDTH / 2 - 20} delay={200} />
              </>
            )}

            {/* Star burst overlay when claiming */}
            {showBurst && (
              <Animated.View style={[styles.burstOverlay, burstStyle]} pointerEvents="none">
                <LottieView
                  ref={lottieBurstRef}
                  source={require('@/assets/animations/stars-burst.json')}
                  autoPlay
                  loop={false}
                  style={styles.burstLottie}
                />
              </Animated.View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Hero: balance */}
              <View style={styles.hero}>
                <Animated.View style={[styles.heroBalance, balanceAnimatedStyle]}>
                  <View style={styles.heroGlow} />
                  <Text style={styles.heroNumber}>{stars}</Text>
                  <Text style={styles.heroLabel}>étoiles</Text>
                </Animated.View>
              </View>

              {/* Claim: visual timer or treasure button */}
              <View style={styles.claimSection}>
                {canClaim ? (
                  <Animated.View style={claimButtonStyle}>
                    <Pressable
                      onPressIn={() => {
                        claimScale.value = withSpring(0.94, { damping: 12 });
                      }}
                      onPressOut={() => {
                        claimScale.value = withSpring(1);
                      }}
                      onPress={handleClaimCountdown}
                      disabled={isClaiming}
                      style={({ pressed }) => [
                        styles.claimButton,
                        (pressed || isClaiming) && styles.buttonDimmed,
                      ]}
                    >
                      <LinearGradient
                        colors={['#FFD54F', '#FFB300', '#FF8F00'] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.claimGradient}
                      >
                        {isClaiming ? (
                          <ActivityIndicator color={colors.text.primary} size="small" />
                        ) : (
                          <>
                            <Text style={styles.claimIcon}>⭐</Text>
                            <Text style={styles.claimText}>+{COUNTDOWN_REWARD} étoile</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
                ) : (
                  <View style={styles.timerRing}>
                    <Animated.View style={[styles.timerRingFill, progressStyle]} />
                    <View style={styles.timerCenter}>
                      <Text style={styles.timerValue}>{countdownLabel || '...'}</Text>
                      <Text style={styles.timerHint}>prochaine</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Watch ad: icon + short label */}
              <Animated.View style={watchButtonStyle}>
                <Pressable
                  onPressIn={() => {
                    watchScale.value = withSpring(0.96);
                  }}
                  onPressOut={() => {
                    watchScale.value = withSpring(1);
                  }}
                  onPress={handleWatchAd}
                  disabled={isWatching}
                  style={({ pressed }) => [
                    styles.watchRow,
                    (pressed || isWatching) && styles.buttonDimmed,
                  ]}
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
                </Pressable>
              </Animated.View>

              {/* Packs: tap to buy; if no profile yet, redirect to onboarding to create it */}
              <View style={styles.packsSection}>
                <View style={styles.packRow}>
                  <Pressable
                    style={({ pressed }) => [styles.packCard, pressed && styles.buttonDimmed]}
                    onPress={handlePackPress}
                  >
                    <Text style={styles.packNumber}>{STARS_PACK_SMALL.stars}</Text>
                    <Text style={styles.packSoon}>Acheter</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.packCard, pressed && styles.buttonDimmed]}
                    onPress={handlePackPress}
                  >
                    <Text style={styles.packNumber}>{STARS_PACK_MEDIUM.stars}</Text>
                    <Text style={styles.packSoon}>Acheter</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.packCard, pressed && styles.buttonDimmed]}
                    onPress={handlePackPress}
                  >
                    <Text style={styles.packNumber}>{STARS_PACK_LARGE.stars}</Text>
                    <Text style={styles.packSoon}>Acheter</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeBtn, pressed && styles.buttonDimmed]}
              >
                <Text style={styles.closeText}>Fermer</Text>
              </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  contentWrap: {
    width: MODAL_WIDTH,
    maxHeight: '88%',
  },
  content: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,213,79,0.4)',
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
    width: 80,
    height: 80,
    top: 8,
    right: 8,
  },
  floatingStar: {
    position: 'absolute',
    backgroundColor: colors.accent,
    pointerEvents: 'none',
  },
  burstOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  burstLottie: {
    width: 200,
    height: 200,
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
    width: HERO_SIZE + 24,
    height: HERO_SIZE + 24,
    borderRadius: (HERO_SIZE + 24) / 2,
    backgroundColor: 'rgba(255,213,79,0.2)',
  },
  heroNumber: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.text.primary,
    textShadowColor: 'rgba(255,193,7,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginTop: spacing.xxs,
    textTransform: 'lowercase',
  },
  claimSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  claimButton: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.md,
    shadowColor: '#FFB300',
    shadowOpacity: 0.35,
  },
  claimGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  claimIcon: {
    fontSize: 28,
  },
  claimText: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  timerRing: {
    width: RING_SIZE + 16,
    height: RING_SIZE + 16,
    borderRadius: (RING_SIZE + 16) / 2,
    borderWidth: 4,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  timerRingFill: {
    position: 'absolute',
    width: RING_SIZE + 8,
    height: RING_SIZE + 8,
    borderRadius: (RING_SIZE + 8) / 2,
    backgroundColor: colors.accent,
  },
  timerCenter: {
    alignItems: 'center',
  },
  timerValue: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    fontSize: typography.size.xs,
    color: colors.text.muted,
    marginTop: 2,
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
    fontSize: 22,
  },
  watchLabel: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  packsSection: {
    marginBottom: spacing.lg,
  },
  packRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  packCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  packNumber: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  packSoon: {
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  closeText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    fontWeight: '500',
  },
  buttonDimmed: {
    opacity: 0.85,
  },
});
