import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { ScreenContainer, StarsBadgeWithModal } from '@/shared';
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
      // Delegate to parent — may auto-unlock or show modal
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

/** Random messages shown in the confirmation modal when the user can afford to unlock */
const UNLOCK_CONFIRM_MESSAGES = [
  "Ce monde n'attendait que toi pour s'éveiller !",
  "Une aventure extraordinaire est sur le point de commencer...",
  "Les secrets de ce monde vont se révéler rien que pour toi !",
  "Tu es sur le point de vivre quelque chose d'inoubliable !",
  "Ce monde a été créé spécialement pour des héros comme toi !",
  "La magie se prépare... es-tu prêt pour l'aventure ?",
  "Quelque chose de merveilleux t'attend derrière cette porte !",
  "Ce monde rêve d'un héros comme toi depuis si longtemps !",
] as const;

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

/**
 * Unified unlock modal — two visual states:
 *   canAfford=true  → beautiful confirmation with random enticing message
 *   canAfford=false → stars progress + inline options to earn/buy more
 */
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
  const stars = useAppStore((state) => state.stars);
  const [isWatching, setIsWatching] = useState(false);

  // Pick a new random message every time the modal opens
  const randomMessage = useMemo(() => {
    if (!visible) return '';
    const idx = Math.floor(Math.random() * UNLOCK_CONFIRM_MESSAGES.length);
    return UNLOCK_CONFIRM_MESSAGES[idx];
  }, [visible]);

  if (!universe) return null;

  const handleUseStars = () => {
    if (onUnlock(universe.id)) {
      onUnlocked();
      onClose();
    }
  };

  const handleWatchMagic = async () => {
    setIsWatching(true);
    try {
      await onWatchMagic();
      if (canAffordFn(UNIVERSE_UNLOCK_COST) && onUnlock(universe.id)) {
        onUnlocked();
        onClose();
      }
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

  // --- Branch 1: user has enough stars — confirmation modal ---
  if (canAfford) {
    return (
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            {/* Universe-colored gradient header */}
            <LinearGradient
              colors={[universe.color, colors.background] as const}
              style={styles.confirmHeader}
            >
              <Text style={styles.confirmEmoji}>{universe.emoji}</Text>
            </LinearGradient>

            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>{universe.name}</Text>
              <Text style={styles.confirmMessage}>{randomMessage}</Text>

              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>⭐ {UNIVERSE_UNLOCK_COST} étoiles</Text>
              </View>

              <AnimatedPressable style={styles.confirmButtonPrimary} onPress={handleUseStars}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonPrimaryText}>Réveiller ce monde</Text>
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable style={styles.confirmButtonSecondary} onPress={onClose}>
                <Text style={styles.confirmButtonSecondaryText}>Plus tard</Text>
              </AnimatedPressable>
            </View>
          </Pressable>
        </Pressable>
      </RNModal>
    );
  }

  // --- Branch 2: not enough stars — progress + options modal ---
  const missing = UNIVERSE_UNLOCK_COST - stars;
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.noStarsCard} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#FFD54F', '#FFEB9C', colors.background] as const}
            style={styles.noStarsHeader}
          >
            <Text style={styles.noStarsHeaderEmoji}>⭐</Text>
            <Text style={styles.noStarsHeaderTitle}>Presque là !</Text>
          </LinearGradient>

          <View style={styles.noStarsContent}>
            {/* Stars progress dots */}
            <View style={styles.starsProgressRow}>
              {Array.from({ length: UNIVERSE_UNLOCK_COST }).map((_, i) => (
                <View key={i} style={[styles.starDot, i < stars && styles.starDotFilled]}>
                  <Text style={styles.starDotText}>{i < stars ? '⭐' : '☆'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.starsProgressLabel}>{stars}/{UNIVERSE_UNLOCK_COST} étoiles</Text>

            <Text style={styles.noStarsMessage}>
              {missing === 1
                ? `Il te manque encore 1 étoile pour réveiller « ${universe.name} » !`
                : `Il te manque encore ${missing} étoiles pour réveiller « ${universe.name} » !`}
            </Text>

            <View style={styles.noStarsButtons}>
              <AnimatedPressable
                style={[styles.noStarsButtonWrapper, isWatching && styles.buttonOpDisabled]}
                onPress={handleWatchMagic}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.noStarsButtonGradient}
                >
                  {isWatching ? (
                    <ActivityIndicator color={colors.text.inverse} size="small" />
                  ) : (
                    <>
                      <Text style={styles.noStarsButtonIcon}>✨</Text>
                      <Text style={styles.noStarsButtonTextWhite}>Gagner une étoile magique</Text>
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.noStarsButtonWrapper, isWatching && styles.buttonOpDisabled]}
                onPress={handleBuyStars}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={['#FFD54F', '#F5C430'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.noStarsButtonGradient}
                >
                  <Text style={styles.noStarsButtonIcon}>⭐</Text>
                  <Text style={styles.noStarsButtonTextDark}>Obtenir plus d'étoiles</Text>
                </LinearGradient>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.noStarsButtonLater}
                onPress={onClose}
                disabled={isWatching}
              >
                <Text style={styles.noStarsButtonLaterText}>Plus tard</Text>
              </AnimatedPressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
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

  const avatarCharacterName = heroProfile?.avatarCharacterName;
  const gender = heroProfile?.gender || 'boy';
  const { data: rawUniverses, error: universesError, refetch: refetchUniverses } = useUniverses(avatarCharacterName, gender);

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
    // Always show the modal — canAfford determines which branch is rendered
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

  const avatarImageUrl = heroProfile?.avatarImageUrl;

  return (
    <ScreenContainer style={styles.container}>
      {/* Avatar shortcut to profile — only for returning users */}
      {!isNewUser && (
        <AnimatedPressable
          style={[styles.avatarButton, { top: insets.top + spacing.sm, left: insets.left + spacing.xl }]}
          onPress={() => router.push('/(tabs)')}
          accessibilityLabel="Mon profil"
        >
          {avatarImageUrl ? (
            <Image
              source={{ uri: avatarImageUrl }}
              style={styles.avatarMini}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarMiniPlaceholder}>
              <Text style={styles.avatarMiniPlaceholderText}>
                {heroProfile?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </AnimatedPressable>
      )}

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

const AVATAR_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  avatarButton: {
    position: 'absolute',
    zIndex: 10,
  },
  avatarMini: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarMiniPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniPlaceholderText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
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
