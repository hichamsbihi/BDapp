import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  ImageBackground,
  Modal as RNModal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadgeWithModal } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { useGeneratedStories } from '@/hooks/useStoryData';
import { GeneratedStory } from '@/types';
import { fetchUniversesByGender, fetchStoriesForUniverse } from '@/services/storyService';
import { getCurrentUser } from '@/services/authService';
import { colors, spacing, radius, typography } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 2 * (spacing.xl + spacing.xs);

// ─── StoryCard ──────────────────────────────────────────

interface StoryCardProps {
  story: GeneratedStory & { locked: boolean };
  index: number;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect: (story: GeneratedStory & { locked: boolean }) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  index,
  isSelected,
  hasSelection,
  onSelect,
}) => {
  const isLocked = story.locked;
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      1000 + index * 120,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [20, 0]) },
      { scale: pressScale.value },
    ],
  }));

  const dimmed = hasSelection && !isSelected;

  const handlePressIn = () => {
    pressScale.value = withTiming(0.985, { duration: 100 });
  };
  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={style}>
      <Pressable
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          dimmed && styles.cardDimmed,
        ]}
        onPress={() => onSelect(story)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <ImageBackground
          source={{ uri: story.imageUrl }}
          style={styles.cardBackground}
          imageStyle={styles.cardBackgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={isLocked ? ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)'] : ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardTitleRow}>
              <Text style={[styles.title, isSelected && styles.titleSelected, isLocked && styles.titleLocked]}>
                {story.title}
              </Text>
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Text style={styles.lockBadgeText}>✨ {story.creditsRequired}</Text>
                </View>
              )}
              {!isLocked && (
                <View style={styles.openBadge}>
                  <Text style={styles.openBadgeText}>OUVERT</Text>
                </View>
              )}
            </View>
            <Text style={[styles.synopsis, isSelected && styles.synopsisSelected]}>
              {isLocked ? 'Cette histoire attend d\'être déverrouillée...' : story.synopsis}
            </Text>
            <Text style={styles.meta}>
              {story.totalParts} chapitres · {story.theme}
            </Text>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

// ─── Unlock Modal ───────────────────────────────────────

const UNLOCK_MESSAGES = [
  "Cette histoire n'attendait que toi !",
  "Une aventure extraordinaire est sur le point de commencer...",
  "Les secrets de cette histoire vont se révéler rien que pour toi !",
  "Tu es sur le point de vivre quelque chose d'inoubliable !",
  "Cette histoire a été créée spécialement pour des héros comme toi !",
  "La magie se prépare... es-tu prêt pour l'aventure ?",
  "Quelque chose de merveilleux t'attend dans cette histoire !",
] as const;

interface StoryUnlockModalProps {
  visible: boolean;
  story: (GeneratedStory & { locked: boolean }) | null;
  onClose: () => void;
  onUnlocked: () => void;
}

const StoryUnlockModal: React.FC<StoryUnlockModalProps> = ({
  visible,
  story,
  onClose,
  onUnlocked,
}) => {
  const credits = useAppStore((s) => s.credits);
  const canAfford = useAppStore((s) => s.canAfford);
  const unlockStory = useAppStore((s) => s.unlockStory);
  const rewardCredits = useAppStore((s) => s.rewardCredits);
  const [isWatching, setIsWatching] = useState(false);

  const randomMessage = useMemo(() => {
    if (!visible) return '';
    return UNLOCK_MESSAGES[Math.floor(Math.random() * UNLOCK_MESSAGES.length)];
  }, [visible]);

  if (!story) return null;

  const cost = story.creditsRequired;
  const affordable = canAfford(cost);

  const handleUseCredits = () => {
    if (unlockStory(story.id, cost)) {
      onUnlocked();
      onClose();
    }
  };

  const handleWatchMagic = async () => {
    setIsWatching(true);
    try {
      await rewardCredits('watch_ad');
      if (canAfford(cost) && unlockStory(story.id, cost)) {
        onUnlocked();
        onClose();
      }
    } finally {
      setIsWatching(false);
    }
  };

  const handleBuyCredits = async () => {
    onClose();
    const user = await getCurrentUser();
    if (user) {
      router.push('/paywall');
    } else {
      router.push('/(auth)/login?from=paywall');
    }
  };

  if (affordable) {
    return (
      <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.confirmCard} onPress={(e) => e.stopPropagation()}>
            <LinearGradient
              colors={[colors.primary, colors.background]}
              style={styles.confirmHeader}
            >
              <Text style={styles.confirmEmoji}>📖</Text>
            </LinearGradient>

            <View style={styles.confirmContent}>
              <Text style={styles.confirmTitle}>{story.title}</Text>
              <Text style={styles.confirmMessage}>{randomMessage}</Text>

              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>⭐ {cost} étoiles</Text>
              </View>

              <AnimatedPressable style={styles.confirmButtonPrimary} onPress={handleUseCredits}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonPrimaryText}>Débloquer cette histoire</Text>
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

  const missing = cost - credits;
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.noStarsCard} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={['#FFD54F', '#FFEB9C', colors.background]}
            style={styles.noStarsHeader}
          >
            <Text style={styles.noStarsHeaderEmoji}>⭐</Text>
            <Text style={styles.noStarsHeaderTitle}>Presque là !</Text>
          </LinearGradient>

          <View style={styles.noStarsContent}>
            <View style={styles.starsProgressRow}>
              {Array.from({ length: cost }).map((_, i) => (
                <View key={i} style={[styles.starDot, i < credits && styles.starDotFilled]}>
                  <Text style={styles.starDotText}>{i < credits ? '⭐' : '☆'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.starsProgressLabel}>{credits}/{cost} étoiles</Text>

            <Text style={styles.noStarsMessage}>
              {missing === 1
                ? `Il te manque encore 1 étoile pour débloquer « ${story.title} » !`
                : `Il te manque encore ${missing} étoiles pour débloquer « ${story.title} » !`}
            </Text>

            <View style={styles.noStarsButtons}>
              <AnimatedPressable
                style={[styles.noStarsButtonWrapper, isWatching && styles.buttonOpDisabled]}
                onPress={handleWatchMagic}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
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
                onPress={handleBuyCredits}
                disabled={isWatching}
              >
                <LinearGradient
                  colors={['#FFD54F', '#F5C430']}
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

// ─── Main Screen ────────────────────────────────────────

export const StartSelectScreen: React.FC = () => {
  const { universeId } = useLocalSearchParams<{ universeId: string }>();
  type EnrichedStory = GeneratedStory & { locked: boolean };
  const [selectedStory, setSelectedStory] = useState<EnrichedStory | null>(null);
  const [loadingParts, setLoadingParts] = useState(false);
  const [unlockModalVisible, setUnlockModalVisible] = useState(false);
  const [storyToUnlock, setStoryToUnlock] = useState<EnrichedStory | null>(null);
  const [universe, setUniverse] = useState<{ backgroundImageUrl?: string } | null>(null);
  const isNavigatingRef = useRef(false);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const isPremium = useAppStore((state) => state.isPremium);
  const unlockedStories = useAppStore((state) => state.unlockedStories);
  const heroProfile = useAppStore((state) => state.heroProfile);

  const resolvedUniverseId = universeId || currentStory?.universeId;
  const gender = heroProfile?.gender || 'boy';

  useEffect(() => {
    if (!resolvedUniverseId) return;
    fetchUniversesByGender(gender).then((universes) => {
      const found = universes.find((u) => u.id === resolvedUniverseId);
      if (found) setUniverse(found);
    });
  }, [resolvedUniverseId, gender]);

  const {
    data: rawStories,
    loading: storiesLoading,
    error: storiesError,
    refetch,
  } = useGeneratedStories(resolvedUniverseId);

  const stories: EnrichedStory[] = useMemo(() => {
    return rawStories.map((s) => ({
      ...s,
      locked: isPremium ? false : s.creditsRequired > 0 && !(unlockedStories ?? []).includes(s.id),
    }));
  }, [rawStories, isPremium, unlockedStories]);

  const introProgress = useSharedValue(0);
  const hintProgress = useSharedValue(0);

  useEffect(() => {
    introProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
    hintProgress.value = withDelay(
      1800,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  useEffect(() => {
    if (selectedStory) {
      hintProgress.value = withTiming(0, { duration: 300 });
    }
  }, [selectedStory]);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [{ scale: interpolate(introProgress.value, [0, 1], [0.98, 1]) }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintProgress.value }));

  const handleSelect = (story: EnrichedStory) => {
    if (story.locked) {
      setStoryToUnlock(story);
      setUnlockModalVisible(true);
    } else {
      setSelectedStory(story);
    }
  };

  const handleUnlocked = () => {
    if (storyToUnlock) {
      setSelectedStory({ ...storyToUnlock, locked: false });
    }
  };

  const handleContinue = useCallback(async () => {
    if (!selectedStory) return;
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setLoadingParts(true);

    try {
      const { fetchPartsForStory } = await import('@/services/storyService');
      const parts = await fetchPartsForStory(selectedStory.id);
      const openingPart = parts.find((p) => p.isOpening) ?? parts[0];

      if (!openingPart) {
        setLoadingParts(false);
        isNavigatingRef.current = false;
        return;
      }

      updateCurrentStory({
        title: selectedStory.title,
        generatedStoryId: selectedStory.id,
        synopsis: selectedStory.synopsis,
        currentPartId: openingPart.id,
        allParts: parts,
      });

      router.replace({
        pathname: '/story/page',
        params: { partId: openingPart.id },
      });
    } catch (err) {
      if (__DEV__) console.log('Failed to load story parts:', err);
    } finally {
      setLoadingParts(false);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  }, [selectedStory, updateCurrentStory]);

  if (storiesLoading) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Préparation des histoires...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (storiesError) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Impossible de charger les histoires.</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  if (stories.length === 0) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Aucune histoire disponible pour cet univers.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.wrapper}>
      {universe?.backgroundImageUrl && (
        <ImageBackground
          source={{ uri: universe.backgroundImageUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.9)']}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      )}
      <ScreenContainer style={styles.container}>
        <View style={styles.topBar}>
          <StarsBadgeWithModal />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.intro, introStyle]}>
            <Text style={styles.introText}>
              Choisis ton{'\n'}aventure...
            </Text>
          </Animated.View>

          {stories.map((story, index) => (
            <StoryCard
              key={story.id}
              story={story}
              index={index}
              isSelected={selectedStory?.id === story.id}
              hasSelection={selectedStory !== null}
              onSelect={handleSelect}
            />
          ))}

          <Animated.View style={[styles.hintContainer, hintStyle]}>
            <Text style={styles.hintText}>
              Choisis l'histoire qui t'appelle...
            </Text>
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <AnimatedPressable
            style={[styles.button, !selectedStory && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!selectedStory || loadingParts}
          >
            {loadingParts ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, !selectedStory && styles.buttonTextDisabled]}>
                {selectedStory ? 'Commencer cette histoire' : 'Choisis une aventure pour commencer'}
              </Text>
            )}
          </AnimatedPressable>
        </View>
      </ScreenContainer>

      <StoryUnlockModal
        visible={unlockModalVisible}
        story={storyToUnlock}
        onClose={() => setUnlockModalVisible(false)}
        onUnlocked={handleUnlocked}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl + spacing.xs,
    paddingBottom: spacing.xl + spacing.lg,
  },
  intro: {
    marginBottom: spacing.xxxl + spacing.md,
    alignItems: 'center',
  },
  introText: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.medium,
    fontStyle: 'italic',
    color: colors.text.inverse,
    textAlign: 'center',
    lineHeight: typography.size.xxl * typography.lineHeight.normal + spacing.xs,
    letterSpacing: 0.3,
  },

  // ── Card ──
  card: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: spacing.xl + spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardBackground: {
    width: '100%',
  },
  cardBackgroundImage: {
    borderRadius: radius.xl - 1,
  },
  cardGradient: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl + spacing.xs,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    flex: 1,
  },
  titleSelected: {
    color: colors.text.inverse,
  },
  titleLocked: {
    color: 'rgba(255,255,255,0.7)',
  },
  lockBadge: {
    backgroundColor: 'rgba(255,215,0,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  lockBadgeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: '#FFD700',
  },
  openBadge: {
    backgroundColor: 'rgba(76,175,80,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
  },
  openBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#81C784',
    letterSpacing: 1,
  },
  synopsis: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: typography.size.xl + spacing.md,
    marginBottom: spacing.md,
  },
  synopsisSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  meta: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: typography.weight.medium,
  },
  hintContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },

  // ── Loading / Error ──
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.lg * 1.5,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: spacing.xl + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl - spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + spacing.xxs,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  buttonTextDisabled: {
    color: 'rgba(255,255,255,0.45)',
  },

  // ── Unlock Modal — Can Afford ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  confirmHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl + spacing.md,
  },
  confirmEmoji: {
    fontSize: 48,
  },
  confirmContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  confirmMessage: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.5,
    marginBottom: spacing.xl,
  },
  costBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  costBadgeText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: '#D4A017',
  },
  confirmButtonPrimary: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  confirmButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  confirmButtonPrimaryText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  confirmButtonSecondary: {
    paddingVertical: spacing.md,
  },
  confirmButtonSecondaryText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
  },

  // ── Unlock Modal — Not Enough Stars ──
  noStarsCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
  noStarsHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noStarsHeaderEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  noStarsHeaderTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  noStarsContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  starsProgressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  starDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starDotFilled: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  starDotText: {
    fontSize: 16,
  },
  starsProgressLabel: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  noStarsMessage: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.5,
    marginBottom: spacing.xl,
  },
  noStarsButtons: {
    width: '100%',
    gap: spacing.md,
  },
  noStarsButtonWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  noStarsButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  noStarsButtonIcon: {
    fontSize: 18,
  },
  noStarsButtonTextWhite: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  noStarsButtonTextDark: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: '#5D4037',
  },
  noStarsButtonLater: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  noStarsButtonLaterText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
  },
  buttonOpDisabled: {
    opacity: 0.5,
  },
});
