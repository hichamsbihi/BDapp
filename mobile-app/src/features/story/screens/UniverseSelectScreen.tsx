import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal as RNModal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { ScreenContainer, StarsBadgeWithModal, NotEnoughStarsModal } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { ErrorFallback } from '@/shared/ErrorFallback';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';
import { useAppStore } from '@/store';
import { UNIVERSE_UNLOCK_COST } from '@/constants/stars';
import { UniverseConfig } from '@/types';
import { useUniverses } from '@/hooks/useStoryData';
import { generateStoryId } from '@/utils/ids';
import { getCurrentUser } from '@/services/authService';
import { upsertStoryProgress, setLastUniverse } from '@/services/syncService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const ANIMATION_DURATION = 700;
const EASING = Easing.out(Easing.cubic);

/**
 * Animated universe card - "Magic Door" design
 */
interface UniverseCardProps {
  universe: UniverseConfig;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onLockedPress: (universe: UniverseConfig) => void;
}

const UniverseCard: React.FC<UniverseCardProps> = ({
  universe,
  index,
  isSelected,
  onSelect,
  onLockedPress,
}) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const sparkle = useSharedValue(1);

  // Entrance animation
  useEffect(() => {
    progress.value = withDelay(
      400 + index * 180,
      withTiming(1, { duration: 600, easing: EASING })
    );

    // Subtle glow animation for unlocked universe
    if (!universe.isLocked) {
      glowOpacity.value = withDelay(
        800 + index * 180,
        withRepeat(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
      );
    }
  }, [index, universe.isLocked]);

  const handlePress = () => {
    if (universe.isLocked) {
      // "Blocked magic" animation - shake + flash
      shakeX.value = withSequence(
        withTiming(-10, { duration: 40 }),
        withTiming(10, { duration: 40 }),
        withTiming(-8, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      sparkle.value = withSequence(
        withTiming(1.1, { duration: 100 }),
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onLockedPress(universe);
    } else {
      scale.value = withSequence(
        withSpring(0.96, { damping: 10, stiffness: 400 }),
        withSpring(1.03, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 400 })
      );
      onSelect(universe.id);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { scale: progress.value * scale.value },
      { translateX: shakeX.value },
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
          universe.isLocked && styles.cardLocked,
        ]}
        onPress={handlePress}
      >
        {/* Animated glow for unlocked */}
        {!universe.isLocked && (
          <Animated.View
            style={[
              styles.cardGlow,
              { backgroundColor: universe.color },
              glowStyle,
            ]}
          />
        )}

        {/* Universe visual */}
        <View
          style={[
            styles.cardVisual,
            { backgroundColor: universe.color },
            universe.isLocked && styles.cardVisualLocked,
          ]}
        >
          <Animated.Text style={[styles.cardEmoji, sparkleStyle]}>
            {universe.emoji}
          </Animated.Text>

          {/* FREE badge for unlocked */}
          {!universe.isLocked && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>OUVERT</Text>
            </View>
          )}

          {/* Locked overlay - "endormi" */}
          {universe.isLocked && (
            <View style={styles.lockedOverlay}>
              <View style={styles.lockBadge}>
                <Text style={styles.lockIcon}>✨</Text>
              </View>
              <Text style={styles.lockedHint}>Tu peux le réveiller ✨</Text>
            </View>
          )}

          {/* Selection glow */}
          {isSelected && (
            <View style={[styles.selectedGlow, { backgroundColor: universe.color }]} />
          )}
        </View>

        {/* Universe info */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, universe.isLocked && styles.cardTitleLocked]}>
              {universe.name}
            </Text>
            {!universe.isLocked && isSelected && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>✓</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDescription, universe.isLocked && styles.cardDescriptionLocked]}>
            {universe.isLocked
              ? "Ce monde dort encore..."
              : universe.description}
          </Text>
          {!universe.isLocked && !isSelected && (
            <Text style={styles.availableHint}>Disponible maintenant ✨</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/**
 * Locked universe modal - ton magique et rassurant pour l'enfant
 * Message émotionnel : "Ce monde dort encore", pas de wording technique
 */
interface LockedModalProps {
  visible: boolean;
  universe: UniverseConfig | null;
  onClose: () => void;
  onUnlocked: () => void;
  canAfford: boolean;
  canAffordFn: (amount: number) => boolean;
  onUnlock: (id: string) => boolean;
  onWatchMagic: () => Promise<unknown>;
}

const LockedModal: React.FC<LockedModalProps> = ({
  visible,
  universe,
  onClose,
  onUnlocked,
  canAfford,
  canAffordFn,
  onUnlock,
  onWatchMagic,
}) => {
  const [showGainStars, setShowGainStars] = React.useState(false);

  if (!universe) return null;

  const handleUseStars = () => {
    if (onUnlock(universe.id)) {
      onUnlocked();
      onClose();
    } else {
      setShowGainStars(true);
    }
  };

  const handleGainStars = () => {
    setShowGainStars(true);
  };

  // Après la "magie", si assez d'étoiles : débloquer + fermer tout.
  // UX fluide : l'enfant entre DIRECTEMENT sans frustration.
  const handleWatchMagicForUnlock = async () => {
    await onWatchMagic();
    if (canAffordFn(UNIVERSE_UNLOCK_COST) && onUnlock(universe.id)) {
      onUnlocked();
      setShowGainStars(false);
      onClose();
    }
  };

  return (
    <>
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalEmoji}>{universe.emoji}</Text>
            <Text style={styles.modalTitle}>{universe.name}</Text>
            <Text style={styles.modalSubtitle}>Ce monde dort encore...</Text>
            <Text style={styles.modalMessage}>
              {canAfford
                ? "Tu as assez d'étoiles pour le réveiller ! ✨"
                : "Tu peux le réveiller avec un peu de magie ✨\nIl lui manque encore quelques étoiles..."}
            </Text>

            <View style={styles.modalButtonsColumn}>
              {canAfford ? (
                <Pressable style={styles.modalButtonPrimary} onPress={handleUseStars}>
                  <Text style={styles.modalButtonPrimaryText}>Utiliser 3 étoiles ✨</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.modalButtonPrimary} onPress={handleGainStars}>
                  <Text style={styles.modalButtonPrimaryText}>Gagner des étoiles ✨</Text>
                </Pressable>
              )}
              <Pressable style={styles.modalButtonSecondary} onPress={onClose}>
                <Text style={styles.modalButtonSecondaryText}>⏳ Plus tard</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </RNModal>

      <NotEnoughStarsModal
        visible={showGainStars}
        onClose={() => setShowGainStars(false)}
        needed={UNIVERSE_UNLOCK_COST}
        onWatchMagic={handleWatchMagicForUnlock}
      />
    </>
  );
};

/**
 * Universe selection screen - "Magic Doors" experience
 */
export const UniverseSelectScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [selectedUniverseId, setSelectedUniverseId] = useState<string | null>(null);
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const [selectedLockedUniverse, setSelectedLockedUniverse] = useState<UniverseConfig | null>(null);

  const setCurrentStory = useAppStore((state) => state.setCurrentStory);
  const heroProfile = useAppStore((state) => state.heroProfile);
  const isPremium = useAppStore((state) => state.isPremium);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useAppStore((state) => state.setHasCompletedOnboarding);
  const stars = useAppStore((state) => state.stars);
  const unlockedUniverses = useAppStore((state) => state.unlockedUniverses);
  const canAfford = useAppStore((state) => state.canAfford);
  const unlockUniverse = useAppStore((state) => state.unlockUniverse);
  const rewardStar = useAppStore((state) => state.rewardStar);
  const storyProgressList = useAppStore((state) => state.storyProgressList);
  const stories = useAppStore((state) => state.stories);

  const isNewUser = !hasCompletedOnboarding;

  const gender = heroProfile?.gender || 'boy';
  const { data: rawUniverses, error: universesError, refetch: refetchUniverses } = useUniverses(gender);

  const universes = useMemo(() => {
    if (isPremium) {
      return rawUniverses.map((u) => ({ ...u, isLocked: false }));
    }
    return rawUniverses.map((u) => {
      const isUnlocked = (unlockedUniverses ?? []).includes(u.id);
      return { ...u, isLocked: !isUnlocked };
    });
  }, [rawUniverses, isPremium, unlockedUniverses]);

  const resumeProgress = storyProgressList.find((p) => p.currentPageNumber >= 1);
  const hasCompletedInResumeUniverse =
    resumeProgress && (stories ?? []).some((s) => s.universeId === resumeProgress.universeId && s.isComplete !== false);
  const resumeUniverse = resumeProgress ? universes.find((u) => u.id === resumeProgress.universeId) : null;
  const showResume = resumeUniverse && resumeProgress && !hasCompletedInResumeUniverse;

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

  const handleLockedPress = (universe: UniverseConfig) => {
    setSelectedLockedUniverse(universe);
    setLockedModalVisible(true);
  };

  const handleContinue = async () => {
    if (!selectedUniverseId) return;

    if (!hasCompletedOnboarding) {
      setHasCompletedOnboarding(true);
    }

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
      await upsertStoryProgress(user.id, selectedUniverseId, 1);
      await setLastUniverse(user.id, selectedUniverseId);
    }

    router.push('/story/start-select');
  };

  const handleResumeProgress = () => {
    if (!resumeProgress) return;
    setCurrentStory({
      id: generateStoryId(),
      universeId: resumeProgress.universeId,
      heroId: heroProfile?.id || 'default-hero',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isComplete: false,
    });
    router.push('/story/start-select');
  };

  const selectedUniverse = universes.find((u) => u.id === selectedUniverseId);

  if (universesError) {
    return (
      <ScreenContainer style={styles.container}>
        <ErrorFallback onRetry={refetchUniverses} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + spacing.sm, right: insets.right + spacing.xl }]}>
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

        {showResume && resumeUniverse && resumeProgress && (
          <Pressable style={styles.resumeCard} onPress={handleResumeProgress}>
            <Text style={styles.resumeLabel}>Reprendre</Text>
            <Text style={styles.resumeText}>
              Tu étais à la même place dans « {resumeUniverse.name} » (page {resumeProgress.currentPageNumber})
            </Text>
            <Text style={styles.resumeCta}>Reprendre l'histoire</Text>
          </Pressable>
        )}

        {/* Universe cards */}
        <View style={styles.cardsContainer}>
          {universes.map((universe, index) => (
            <UniverseCard
              key={universe.id}
              universe={universe}
              index={index}
              isSelected={selectedUniverseId === universe.id}
              onSelect={setSelectedUniverseId}
              onLockedPress={handleLockedPress}
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

      <LockedModal
        visible={lockedModalVisible}
        universe={selectedLockedUniverse}
        onClose={() => setLockedModalVisible(false)}
        onUnlocked={() => setSelectedUniverseId(selectedLockedUniverse?.id ?? null)}
        canAfford={canAfford(UNIVERSE_UNLOCK_COST)}
        canAffordFn={canAfford}
        onUnlock={unlockUniverse}
        onWatchMagic={() => rewardStar('watch_ad').then(() => {})}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
    // top/right appliqués dynamiquement via useSafeAreaInsets
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
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
  resumeCard: {
    backgroundColor: colors.semantic.warningBg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  resumeLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  resumeText: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  resumeCta: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
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
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlayHeavy,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  modalMessage: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: spacing.xl,
    marginBottom: spacing.xl,
  },
  modalButtonsColumn: {
    width: '100%',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  modalButtonSecondary: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
  },
  modalButtonPrimary: {
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
});
