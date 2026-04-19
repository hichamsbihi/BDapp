import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as StoreReview from 'expo-store-review';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { showInterstitialIfEligible } from '@/services/adService';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';

const EASING = Easing.out(Easing.cubic);
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_SIZE = 128;
const HERO_CARD_PADDING = spacing.xxl;
const DECO_CIRCLE_SIZE = 160;

/**
 * StoryCompletedScreen
 * Celebration moment: avatar, congratulations, and clear next steps.
 * Designed for a "wow" effect with gradient background, Lottie and decorative elements.
 */
export const StoryCompletedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();

  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const credits = useAppStore((state) => state.credits);

  const story = stories.find((s) => s.id === storyId);
  const heroName = heroProfile?.name || 'toi';
  const avatarImageUrl = heroProfile?.avatarImageUrl;
  const avatarCharacterName = heroProfile?.avatarCharacterName;

  const lottieBurstRef = React.useRef<LottieView>(null);
  const lottieSparkle1Ref = React.useRef<LottieView>(null);
  const lottieSparkle2Ref = React.useRef<LottieView>(null);

  const avatarScale = useSharedValue(0.5);
  const avatarOpacity = useSharedValue(0);
  const avatarFloat = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardOpacity = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);
  const deco1Opacity = useSharedValue(0);
  const deco2Opacity = useSharedValue(0);
  const deco3Opacity = useSharedValue(0);

  useEffect(() => {
    lottieBurstRef.current?.play();
    setTimeout(() => {
      lottieSparkle1Ref.current?.play();
      lottieSparkle2Ref.current?.play();
    }, 400);

    avatarOpacity.value = withTiming(1, { duration: 400 });
    avatarScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    avatarFloat.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    deco1Opacity.value = withDelay(200, withTiming(0.35, { duration: 800 }));
    deco2Opacity.value = withDelay(400, withTiming(0.25, { duration: 800 }));
    deco3Opacity.value = withDelay(600, withTiming(0.3, { duration: 800 }));

    cardOpacity.value = withDelay(300, withTiming(1, { duration: 500, easing: EASING }));
    cardScale.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 90 }));

    badgeOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    titleOpacity.value = withDelay(
      600,
      withTiming(1, { duration: 500, easing: EASING })
    );
    messageOpacity.value = withDelay(
      900,
      withTiming(1, { duration: 500, easing: EASING })
    );
    actionsOpacity.value = withDelay(
      1100,
      withTiming(1, { duration: 400, easing: EASING })
    );

    showInterstitialIfEligible();

    StoreReview.isAvailableAsync()
      .then((available) => {
        if (available) {
          setTimeout(() => StoreReview.requestReview()?.catch(() => {}), 2000);
        }
      })
      .catch(() => {});
  }, []);

  const avatarStyle = useAnimatedStyle(() => ({
    opacity: avatarOpacity.value,
    transform: [
      { scale: avatarScale.value },
      { translateY: interpolate(avatarFloat.value, [0, 1], [0, -6]) },
    ],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: interpolate(badgeOpacity.value, [0, 1], [0.8, 1]) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [12, 0]) }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  const deco1Style = useAnimatedStyle(() => ({ opacity: deco1Opacity.value }));
  const deco2Style = useAnimatedStyle(() => ({ opacity: deco2Opacity.value }));
  const deco3Style = useAnimatedStyle(() => ({ opacity: deco3Opacity.value }));

  const handleReadStory = () => {
    if (story) {
      router.replace({
        pathname: '/story/reader',
        params: { storyId: story.id },
      });
    }
  };

  const handleGoToLibrary = () => {
    router.replace('/library');
  };

  const handleGoHome = () => {
    // Navigate directly to tabs, bypassing the auth gate (which would clear unlocked universes).
    router.replace('/(tabs)');
  };

  const congratulationsMessage = avatarCharacterName
    ? `Bravo ${heroName} ! ${avatarCharacterName} et toi avez créé une histoire unique.`
    : `${heroName}, tu viens de créer quelque chose qui n'existait pas.`;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FFF9F0', '#FFF5E8', '#FFEEE0', '#FFFCF5'] as const}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.decoCircle, styles.deco1, deco1Style]} />
      <Animated.View style={[styles.decoCircle, styles.deco2, deco2Style]} />
      <Animated.View style={[styles.decoCircle, styles.deco3, deco3Style]} />

      <ScreenContainer style={styles.container}>
        <View style={styles.content}>
          <LottieView
            ref={lottieBurstRef}
            source={require('@/assets/animations/stars-burst.json')}
            autoPlay
            loop={false}
            style={styles.lottieBurst}
          />
          <LottieView
            ref={lottieSparkle1Ref}
            source={require('@/assets/animations/sparkle-loop.json')}
            autoPlay
            loop
            style={styles.lottieSparkle1}
          />
          <LottieView
            ref={lottieSparkle2Ref}
            source={require('@/assets/animations/sparkle-loop.json')}
            autoPlay
            loop
            style={styles.lottieSparkle2}
          />

          <Animated.View style={[styles.avatarSection, avatarStyle]}>
            <LinearGradient
              colors={['#FF8A65', '#FFD54F', '#FFB74D', '#FF8A65'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                {avatarImageUrl ? (
                  <Image
                    source={{ uri: avatarImageUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>?</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
            {avatarCharacterName ? (
              <Text style={styles.avatarLabel}>{avatarCharacterName}</Text>
            ) : null}
          </Animated.View>

          <Animated.View style={[styles.heroCard, cardStyle]}>
            <LinearGradient
              colors={[colors.surfaceElevated, '#FFFBF7'] as const}
              style={styles.heroCardGradient}
            >
              <Animated.View style={[styles.badgeWrap, badgeStyle]}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Histoire créée !</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.textSection, titleStyle]}>
                <Text style={styles.headline}>C'est écrit.</Text>
                <Text style={styles.storyTitle}>{story?.title || 'Ton histoire'}</Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.messageSection, messageStyle]}>
            <Text style={styles.message}>{congratulationsMessage}</Text>
            <Text style={styles.submessage}>Garde-la précieusement.</Text>
          </Animated.View>

          <Animated.View style={[styles.actionsSection, actionsStyle]}>
            <AnimatedPressable
              style={[styles.primaryButton]}
              onPress={handleReadStory}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Découvrir mon histoire</Text>
              </LinearGradient>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.secondaryButton]}
              onPress={handleGoToLibrary}
            >
              <Text style={styles.secondaryButtonText}>Ma bibliothèque</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.tertiaryButton]}
              onPress={handleGoHome}
            >
              <Text style={styles.tertiaryButtonText}>Retour</Text>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 40,
    alignItems: 'center',
  },

  decoCircle: {
    position: 'absolute',
    borderRadius: DECO_CIRCLE_SIZE / 2,
    backgroundColor: colors.accent,
  },
  deco1: {
    width: DECO_CIRCLE_SIZE,
    height: DECO_CIRCLE_SIZE,
    top: '15%',
    left: -DECO_CIRCLE_SIZE / 2,
  },
  deco2: {
    width: DECO_CIRCLE_SIZE * 1.2,
    height: DECO_CIRCLE_SIZE * 1.2,
    top: '35%',
    right: -DECO_CIRCLE_SIZE * 0.6,
    backgroundColor: colors.primary,
  },
  deco3: {
    width: DECO_CIRCLE_SIZE * 0.8,
    height: DECO_CIRCLE_SIZE * 0.8,
    bottom: '22%',
    left: -DECO_CIRCLE_SIZE * 0.3,
    backgroundColor: colors.secondary,
  },

  lottieBurst: {
    position: 'absolute',
    top: 24,
    left: SCREEN_WIDTH / 2 - 80,
    width: 160,
    height: 160,
    pointerEvents: 'none',
  },
  lottieSparkle1: {
    position: 'absolute',
    top: 90,
    right: spacing.lg,
    width: 56,
    height: 56,
    pointerEvents: 'none',
  },
  lottieSparkle2: {
    position: 'absolute',
    top: 200,
    left: spacing.sm,
    width: 48,
    height: 48,
    pointerEvents: 'none',
  },

  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    zIndex: 2,
  },
  avatarRing: {
    width: AVATAR_SIZE + 14,
    height: AVATAR_SIZE + 14,
    borderRadius: (AVATAR_SIZE + 14) / 2,
    padding: 7,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  avatarPlaceholderText: {
    fontSize: typography.size.xxl,
    color: colors.text.muted,
    fontWeight: typography.weight.bold,
  },
  avatarLabel: {
    marginTop: spacing.sm,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },

  heroCard: {
    width: '100%',
    marginBottom: spacing.xxl,
    borderRadius: radius.lg + 4,
    overflow: 'hidden',
    ...shadows.md,
  },
  heroCardGradient: {
    paddingVertical: HERO_CARD_PADDING,
    paddingHorizontal: HERO_CARD_PADDING,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg + 4,
  },
  badgeWrap: {
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  textSection: {
    alignItems: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  storyTitle: {
    fontSize: typography.size.xl,
    fontStyle: 'italic',
    color: colors.text.muted,
    textAlign: 'center',
  },

  messageSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  message: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  submessage: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: colors.text.muted,
  },

  actionsSection: {
    width: '100%',
    gap: spacing.md,
    paddingBottom: 40,
  },
  primaryButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 16,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.sm,
  },
  secondaryButtonText: {
    fontSize: typography.size.md + 1,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
  },
  tertiaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
  },
});
