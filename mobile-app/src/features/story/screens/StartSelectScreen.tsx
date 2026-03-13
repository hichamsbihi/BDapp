import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadge } from '@/shared';
import { colors, radius, typography } from '@/theme';
import { useAppStore } from '@/store';
import { useStoryStarts } from '@/hooks/useStoryData';
import { StoryStart } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 56;

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
  const insets = useSafeAreaInsets();
  const [selectedChapter, setSelectedChapter] = useState<StoryStart | null>(null);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const stars = useAppStore((state) => state.stars);

  const { data: chapters, loading: chaptersLoading } = useStoryStarts(currentStory?.universeId);

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

  const handleContinue = () => {
    if (!selectedChapter) return;

    // Store complete opening data in global state
    updateCurrentStory({
      title: selectedChapter.title,
      startId: selectedChapter.id,
      openingText: selectedChapter.text,
    });

    router.push('/story/paragraph');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
        <StarsBadge count={stars} />
      </View>
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
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Commencer ce chapitre</Text>
        </Pressable>
      </Animated.View>
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
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  // Intro — poetic, centered, breathing
  intro: {
    marginBottom: 60,
    alignItems: 'center',
  },
  introText: {
    fontSize: 24,
    fontWeight: '500',
    fontStyle: 'italic',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.3,
  },

  // Chapter card — like a page laid down
  chapter: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    marginBottom: 40,
    paddingVertical: 32,
    paddingHorizontal: 26,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  chapterSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  chapterDimmed: {
    opacity: 0.45, // Softer than before (was 0.38)
  },

  // Title — chapter name
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 16,
  },
  titleSelected: {
    color: colors.accentDark,
  },

  // Paragraph — THE HERO, the sacred text
  paragraph: {
    fontSize: 19,
    fontStyle: 'italic',
    color: colors.ink,
    lineHeight: 32,
  },
  paragraphSelected: {
    color: colors.ink,
  },

  // Hint — poetic, disappears on selection
  hintContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.inkMuted,
    textAlign: 'center',
  },

  // Footer — discrete, supportive
  footer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 44,
    backgroundColor: colors.background,
  },
  button: {
    backgroundColor: colors.ink,
    paddingVertical: 18,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
  },
  buttonText: {
    ...typography.button,
    color: colors.surface,
  },
});
