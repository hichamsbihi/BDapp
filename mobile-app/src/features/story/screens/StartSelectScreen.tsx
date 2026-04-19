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
import { ScreenContainer, StarsBadgeWithModal, NotEnoughStarsModal } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { useGeneratedStories } from '@/hooks/useStoryData';
import { GeneratedStory } from '@/types';
import { fetchUniversesByGender, fetchStoriesForUniverse } from '@/services/storyService';
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

// ─── Main Screen ────────────────────────────────────────

export const StartSelectScreen: React.FC = () => {
  const { universeId } = useLocalSearchParams<{ universeId: string }>();
  type EnrichedStory = GeneratedStory & { locked: boolean };
  const [selectedStory, setSelectedStory] = useState<EnrichedStory | null>(null);
  const [loadingParts, setLoadingParts] = useState(false);
  const [showNotEnoughStars, setShowNotEnoughStars] = useState(false);
  const [pendingUnlockCost, setPendingUnlockCost] = useState(0);
  const [pendingUnlockStory, setPendingUnlockStory] = useState<EnrichedStory | null>(null);
  const [universe, setUniverse] = useState<{ backgroundImageUrl?: string } | null>(null);
  const isNavigatingRef = useRef(false);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const isPremium = useAppStore((state) => state.isPremium);
  const credits = useAppStore((state) => state.credits);
  const unlockedStories = useAppStore((state) => state.unlockedStories);
  const unlockStory = useAppStore((state) => state.unlockStory);
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
      const cost = story.creditsRequired;
      if (unlockStory(story.id, cost)) {
        setSelectedStory({ ...story, locked: false });
      } else {
        setPendingUnlockCost(cost);
        setPendingUnlockStory(story);
        setShowNotEnoughStars(true);
      }
    } else {
      setSelectedStory(story);
    }
  };

  const handleNotEnoughStarsClose = () => {
    setShowNotEnoughStars(false);
    if (pendingUnlockStory) {
      const cost = pendingUnlockStory.creditsRequired;
      if (unlockStory(pendingUnlockStory.id, cost)) {
        setSelectedStory({ ...pendingUnlockStory, locked: false });
      }
    }
    setPendingUnlockStory(null);
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

      <NotEnoughStarsModal
        visible={showNotEnoughStars}
        onClose={handleNotEnoughStarsClose}
        needed={pendingUnlockCost}
        current={credits}
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

});
