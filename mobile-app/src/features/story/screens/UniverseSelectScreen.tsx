import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadgeWithModal } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { ErrorFallback } from '@/shared/ErrorFallback';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';
import { useAppStore } from '@/store';
import { UniverseConfig } from '@/types';
import { useUniverses } from '@/hooks/useStoryData';
import { generateStoryId } from '@/utils/ids';
import { getCurrentUser } from '@/services/authService';
import { setLastUniverse } from '@/services/syncService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const ANIMATION_DURATION = 700;
const EASING = Easing.out(Easing.cubic);

/**
 * Animated universe card - "Magic Door" design
 */
interface UniverseCardProps {
  universeId: string;
  universe: UniverseConfig;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const UniverseCard: React.FC<UniverseCardProps> = ({
  universeId,
  universe,
  index,
  isSelected,
  onSelect,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const sparkle = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      400 + index * 180,
      withTiming(1, { duration: 600, easing: EASING })
    );

    glowOpacity.value = withDelay(
      800 + index * 180,
      withRepeat(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [index]);

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.96, { damping: 10, stiffness: 400 }),
      withSpring(1.03, { damping: 10, stiffness: 300 }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );
    onSelect(universeId);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: progress.value * scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sparkle.value }],
  }));

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.cardGlow,
            { backgroundColor: universe.color },
            glowStyle,
          ]}
        />

        <View
          style={[
            styles.cardVisual,
            !universe.imageUrl && { backgroundColor: universe.color },
          ]}
        >
          {universe.imageUrl ? (
            <Image
              source={{ uri: universe.imageUrl }}
              style={styles.cardCoverImage}
              resizeMode="cover"
            />
          ) : (
            <Animated.Text style={[styles.cardEmoji, sparkleStyle]}>
              {universe.emoji}
            </Animated.Text>
          )}

          {isSelected && (
            <View style={[styles.selectedGlow, { backgroundColor: universe.color }]} />
          )}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              {universe.name}
            </Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDescription}>
            {universe.description}
          </Text>
          {!isSelected && (
            <Text style={styles.availableHint}>Disponible maintenant ✨</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Universe selection screen - "Magic Doors" experience
 */
export const UniverseSelectScreen: React.FC = () => {
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);

  const setCurrentStory = useAppStore((state) => state.setCurrentStory);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const stories = useAppStore((state) => state.stories);

  const isNewUser = !hasCompletedOnboarding;

  const gender = heroProfile?.gender || 'boy';
  const { data: universes, error: universesError, refetch: refetchUniverses } = useUniverses(gender);

  // Animation values
  const introProgress = useSharedValue(0);
  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  useEffect(() => {
    // Intro appears first (narrative moment)
    introProgress.value = withTiming(1, { duration: 800, easing: EASING });

    // Header follows
    headerProgress.value = withDelay(200, withTiming(1, { duration: ANIMATION_DURATION, easing: EASING }));

    // Button last
    buttonProgress.value = withDelay(1200, withTiming(1, { duration: 700, easing: EASING }));

    // Subtle pulse on button when visible
    setTimeout(() => {
      buttonPulse.value = withRepeat(
        withTiming(1.02, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    }, 2000);
  }, []);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [
      { scale: interpolate(introProgress.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [15, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      { scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) * buttonPulse.value },
    ],
  }));

  const handleContinue = async () => {
    if (!selectedUniverseId) return;

    setCurrentStory({
      id: generateStoryId(),
      universeId: selectedUniverseId,
      heroId: heroProfile?.id || 'default-hero',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false,
    });

    const user = await getCurrentUser();
    if (user) {
      await setLastUniverse(user.id, selectedUniverseId);
    }

    router.push({
      pathname: '/selection/start-select',
      params: { universeId: selectedUniverseId },
    });

    if (!hasCompletedOnboarding) {
      setHasCompletedOnboarding(true);
    }
  };

  const selectedUniverse = universes.find((u) => u.id === selectedUniverseId);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (universesError) {
    return (
      <ScreenContainer style={styles.container}>
        <ErrorFallback onRetry={refetchUniverses} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.topBar}>
        <AnimatedPressable
          style={styles.backButton}
          onPress={handleBack}
          accessibilityLabel="Retour"
          hitSlop={12}
        >
          <Text style={styles.backButtonText}>←</Text>
        </AnimatedPressable>
        <StarsBadgeWithModal />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step indicator - only for new users */}
        {isNewUser && (
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>Étape 3</Text>
            <View style={styles.stepDots}>
              <View style={styles.stepDot} />
              <View style={styles.stepDot} />
              <View style={[styles.stepDot, styles.stepDotActive]} />
            </View>
          </View>
        )}

        {/* Narrative intro */}
        <Animated.View style={[styles.introContainer, introStyle]}>
          <Text style={styles.introEmoji}>✨🚪✨</Text>
          <Text style={styles.introText}>Une grande aventure t'attend...</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.greeting}>
            {heroProfile?.name ? `${heroProfile.name}, ` : ''}c'est le moment !
          </Text>
          <Text style={styles.title}>Choisis ta porte magique</Text>
          <Text style={styles.subtitle}>Chaque monde cache des secrets...</Text>
        </Animated.View>

        {/* Universe cards */}
        <View style={styles.cardsContainer}>
          {universes.map((universe, index) => (
            <UniverseCard
              key={universe.id}
              universeId={universe.id}
              universe={universe}
              index={index}
              isSelected={selectedUniverseId === universe.id}
              onSelect={setSelectedUniverseId}
            />
          ))}
        </View>

        {/* Motivation hint */}
        <Text style={styles.hintText}>D'autres mondes t'attendent bientôt... ✨</Text>
      </ScrollView>

      {/* Footer with CTA */}
      <Animated.View style={[styles.footer, buttonStyle]}>
        <AnimatedPressable
          style={[styles.button, !selectedUniverseId && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedUniverseId}
        >
          <Text style={[styles.buttonText, !selectedUniverseId && styles.buttonTextDisabled]}>
            {selectedUniverse ? `Entrer dans ce monde ✨` : 'Choisis une porte magique'}
          </Text>
        </AnimatedPressable>
      </Animated.View>

    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  backButtonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  stepText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.borderMedium,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: spacing.xl,
  },

  // Narrative intro
  introContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  introEmoji: {
    fontSize: typography.size.display,
    marginBottom: spacing.sm,
  },
  introText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Header
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  greeting: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
  },
  // Cards
  cardsContainer: {
    gap: spacing.xl,
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.lg,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  cardLocked: {
    borderColor: colors.borderMedium,
    shadowOpacity: 0.06,
  },
  cardGlow: {
    position: 'absolute',
    top: -spacing.xs,
    left: -spacing.xs,
    right: -spacing.xs,
    bottom: -spacing.xs,
    borderRadius: radius.xxl,
    zIndex: -1,
  },
  cardVisual: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardCoverImage: {
    width: '100%',
    height: '100%',
  },
  cardVisualLocked: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 70,
  },
  freeBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.semantic.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  freeBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    width: spacing.xxxl + spacing.sm,
    height: spacing.xxxl + spacing.sm,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lockIcon: {
    fontSize: typography.size.xxxl,
  },
  lockedHint: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  selectedGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  cardContent: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
  },
  cardTitleLocked: {
    color: colors.text.muted,
  },
  cardDescription: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    lineHeight: typography.size.lg * typography.lineHeight.normal,
  },
  cardDescriptionLocked: {
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  availableHint: {
    fontSize: typography.size.md,
    color: colors.semantic.success,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.sm,
  },
  selectedBadge: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },

  // Hint
  hintText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: spacing.md,
  },
  buttonDisabled: {
    backgroundColor: colors.borderMedium,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },

  // Shared modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },

  // --- Confirm unlock modal (canAfford=true) ---
  confirmCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    ...shadows.lg,
  },
  confirmHeader: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmEmoji: {
    fontSize: 76,
  },
  confirmContent: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.size.lg * 1.55,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  costBadgeText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  confirmButtonPrimary: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
  },
  confirmButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPrimaryText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  confirmButtonSecondary: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  confirmButtonSecondaryText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },

  // --- Not enough stars modal (canAfford=false) ---
  noStarsCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 340,
    ...shadows.lg,
  },
  noStarsHeader: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  noStarsHeaderEmoji: {
    fontSize: 52,
    marginBottom: spacing.sm,
  },
  noStarsHeaderTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  noStarsContent: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  starsProgressRow: {
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
  starsProgressLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  noStarsMessage: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.lg * 1.5,
    marginBottom: spacing.xl,
  },
  noStarsButtons: {
    width: '100%',
    gap: spacing.md,
  },
  noStarsButtonWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  noStarsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  noStarsButtonIcon: {
    fontSize: typography.size.xl,
  },
  noStarsButtonTextWhite: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  noStarsButtonTextDark: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  noStarsButtonLater: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  noStarsButtonLaterText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
  buttonOpDisabled: {
    opacity: 0.7,
  },
});
