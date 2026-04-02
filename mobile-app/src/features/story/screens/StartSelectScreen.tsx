import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { useStoryStarts } from '@/hooks/useStoryData';
import { StoryStart } from '@/types';
import { colors, spacing, radius, typography } from '@/theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 2 * (spacing.xl + spacing.xs);

/**
 * Chapter choice component
 * 
 * Minimal design: title + paragraph only.
 * Subtle press feedback (scale 0.985) for tactile response.
 * Soft dimming on non-selected cards (0.45 opacity).
 */
interface ChapterProps {
  chapter: StoryStart;
  index: number;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect: (chapter: StoryStart) => void;
}

const Chapter: React.FC<ChapterProps> = ({
  chapter,
  index,
  isSelected,
  hasSelection,
  onSelect,
}) => {
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Stagger: 120ms between cards, 500ms fade+slide
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

  // Softer dimming: 0.45 instead of 0.38
  const dimmed = hasSelection && !isSelected;

  const handlePressIn = () => {
    // Subtle tactile feedback: scale 0.985, 100ms
    pressScale.value = withTiming(0.985, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withTiming(1, { duration: 100 });
  };

  return (
    <Animated.View style={style}>
      <Pressable
        style={[
          styles.chapter,
          isSelected && styles.chapterSelected,
          dimmed && styles.chapterDimmed,
        ]}
        onPress={() => onSelect(chapter)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={[styles.title, isSelected && styles.titleSelected]}>
          {chapter.title}
        </Text>
        <Text style={[styles.paragraph, isSelected && styles.paragraphSelected]}>
          {chapter.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

/**
 * OpeningPageScreen (exported as StartSelectScreen for route compatibility)
 * 
 * The first page of the child's book.
 * Not a menu. Not an interface. A literary moment.
 * 
 * The text is sacred. Everything else disappears.
 */
export const StartSelectScreen: React.FC = () => {
  const [selectedChapter, setSelectedChapter] = useState<StoryStart | null>(null);
  const isNavigatingRef = useRef(false);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);

  const { data: chapters, loading: chaptersLoading, error: chaptersError, refetch } = useStoryStarts(currentStory?.universeId);

  const pageIdToPageNumber = (pageId: string): number | null => {
    // n8n uses stable page_ids for branching: p1a, p1b, p2a, p2b, p3, p4, p5
    // We map them to the DB `page_number` used by `story_paragraphs` and `narrative_choices`.
    // This avoids relying on array order which can be unstable with legacy rows / missing path_id.
    const normalized = pageId.trim().toLowerCase();
    const mapping: Record<string, number> = {
      p1a: 1,
      p1b: 2,
      p2a: 3,
      p2b: 4,
      p3: 5,
      p4: 6,
      p5: 7,
    };
    return mapping[normalized] ?? null;
  };

  const startToStartPageNumber = (chapter: StoryStart): number => {
    const fromFirstPageId = chapter.firstPageId ? pageIdToPageNumber(chapter.firstPageId) : null;
    if (fromFirstPageId != null) return fromFirstPageId;

    const pathId = (chapter.pathId || '').trim().toLowerCase();
    if (pathId === 'start-a') return 1;
    if (pathId === 'start-b') return 2;

    // Fallback: assume first start = p1a(1), second = p1b(2)
    // (kept for legacy DB rows without `path_id` / `first_page_id`).
    const idx = chapters.findIndex((c) => c.id === chapter.id);
    return idx >= 0 ? idx + 1 : 1;
  };

  // Animation values
  const introProgress = useSharedValue(0);
  const hintProgress = useSharedValue(0);
  const ctaProgress = useSharedValue(0);

  useEffect(() => {
    // Intro: meditative, 1200ms
    introProgress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    // Hint: appears after cards (1800ms delay)
    hintProgress.value = withDelay(
      1800,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  // Hide hint and show CTA when selection is made
  useEffect(() => {
    if (selectedChapter) {
      // Fade out hint
      hintProgress.value = withTiming(0, { duration: 300 });
      // Fade in CTA
      ctaProgress.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      ctaProgress.value = withTiming(0, { duration: 200 });
    }
  }, [selectedChapter]);

  const introStyle = useAnimatedStyle(() => ({
    opacity: introProgress.value,
    transform: [{ scale: interpolate(introProgress.value, [0, 1], [0.98, 1]) }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintProgress.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaProgress.value,
    transform: [{ translateY: interpolate(ctaProgress.value, [0, 1], [8, 0]) }],
  }));

  const handleSelect = (chapter: StoryStart) => {
    setSelectedChapter(chapter);
  };

  const handleContinue = useCallback(() => {
    if (!selectedChapter) return;
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const startPageNumber = startToStartPageNumber(selectedChapter);

    updateCurrentStory({
      title: selectedChapter.title,
      startId: selectedChapter.id,
      openingText: selectedChapter.text,
      currentDbPageNumber: startPageNumber,
    });

    router.push('/story/paragraph');
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  }, [selectedChapter, startToStartPageNumber, updateCurrentStory]);

  // Loading state — shown while Supabase fetch is in progress
  if (chaptersLoading) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Préparation de ton livre...</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state — fetch failed
  if (chaptersError) {
    console.log('StartSelectScreen: fetch error', chaptersError);
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Impossible de charger les débuts d'histoire.</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // Empty state — no story starts in DB for this universe
  if (chapters.length === 0) {
    console.log('StartSelectScreen: no story starts for universeId', currentStory?.universeId);
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Aucun début d'histoire disponible pour cet univers.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Retour</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Literary intro — one phrase, nothing else */}
        <Animated.View style={[styles.intro, introStyle]}>
          <Text style={styles.introText}>
            Il était une fois,{'\n'}une première phrase...
          </Text>
        </Animated.View>

        {/* Chapter choices — like pages waiting to be read */}
        {chapters.map((chapter, index) => (
          <Chapter
            key={chapter.id}
            chapter={chapter}
            index={index}
            isSelected={selectedChapter?.id === chapter.id}
            hasSelection={selectedChapter !== null}
            onSelect={handleSelect}
          />
        ))}

        {/* Poetic hint — disappears after selection */}
        <Animated.View style={[styles.hintContainer, hintStyle]}>
          <Text style={styles.hintText}>
            Choisis la phrase qui ouvrira ton livre...
          </Text>
        </Animated.View>
      </ScrollView>

      {/* CTA — appears only after choice */}
      <Animated.View
        style={[styles.footer, ctaStyle]}
        pointerEvents={selectedChapter ? 'auto' : 'none'}
      >
        <AnimatedPressable style={[styles.button]} onPress={handleContinue}>
          <Text style={styles.buttonText}>Commencer ce chapitre</Text>
        </AnimatedPressable>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.xxxl + spacing.xxl,
    paddingHorizontal: spacing.xl + spacing.xs,
    paddingBottom: spacing.xl + spacing.lg,
  },

  // Intro — poetic, centered, breathing
  intro: {
    marginBottom: spacing.xxxl + spacing.md,
    alignItems: 'center',
  },
  introText: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.medium,
    fontStyle: 'italic',
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.xxl * typography.lineHeight.normal + spacing.xs,
    letterSpacing: 0.3,
  },

  // Chapter card — like a page laid down
  chapter: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: spacing.xl + spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl + spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
  },
  chapterSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },
  chapterDimmed: {
    opacity: 0.45, // Softer than before (was 0.38)
  },

  // Title — chapter name
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  titleSelected: {
    color: colors.primaryDark,
  },

  // Paragraph — THE HERO, the sacred text
  paragraph: {
    fontSize: typography.size.xl,
    fontStyle: 'italic',
    color: colors.text.secondary,
    lineHeight: typography.size.xl + spacing.md,
  },
  paragraphSelected: {
    color: colors.text.primary,
  },

  // Hint — poetic, disappears on selection
  hintContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  hintText: {
    fontSize: typography.size.md,
    fontStyle: 'italic',
    color: colors.text.muted,
    textAlign: 'center',
  },

  // Loading / error / empty states
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

  // Footer — discrete, supportive
  footer: {
    paddingHorizontal: spacing.xl + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl - spacing.xs,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + spacing.xxs,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
