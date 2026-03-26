import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { ErrorFallback } from '@/shared/ErrorFallback';
import { colors, spacing, radius, typography, shadows } from '@/theme/theme';
import { useAppStore } from '@/store';
import { useNarrativeChoices } from '@/hooks/useStoryData';
import { generatePageId } from '@/utils/ids';
import { Story, StoryPage, NarrativeChoice } from '@/types';
import { getCurrentUser } from '@/services/authService';
import { upsertStoryProgress, insertUserChoice, saveCreatedStory } from '@/services/syncService';
import {
  getPivotPhraseForPage,
  getContinuePhrase,
  COMPLETION_PHRASES,
  getRandomPhrase,
} from '@/constants/magicWords';

/** No fixed total: story length is dynamic (driven by universe/story data). Last page = no choices. */

/**
 * Image Reveal Component
 *
 * Shimmer reveal, then pinch-to-zoom + pan via react-native-gesture-handler.
 * Runs on the UI thread via Reanimated worklets = perfectly smooth.
 * Image starts fully visible (contain). Resets on each new image.
 */
interface ImageRevealProps {
  imageUrl: string;
  onRevealComplete: () => void;
  isTablet: boolean;
  onInteractionChange: (active: boolean) => void;
}

const ImageReveal: React.FC<ImageRevealProps> = ({
  imageUrl,
  onRevealComplete,
  isTablet,
  onInteractionChange,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxZoom = isTablet ? 2.5 : 3;

  // Reveal animations
  const revealScale = useSharedValue(1.1);
  const imageOpacity = useSharedValue(0);
  const curtainProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  // Zoom + pan shared values (UI thread)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Reset zoom/pan when imageUrl changes (new page)
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [imageUrl]);

  // Reveal animation
  useEffect(() => {
    glowOpacity.value = withTiming(0.6, { duration: 400 });
    imageOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) }));
    revealScale.value = withDelay(200, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    curtainProgress.value = withDelay(100, withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) }));
    const timer = setTimeout(() => {
      setRevealed(true);
      runOnJS(onRevealComplete)();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onRevealComplete]);

  // --- Gestures (all worklets, UI thread) ---

  const pinchGesture = Gesture.Pinch()
    .enabled(revealed)
    .onStart(() => {
      savedScale.value = scale.value;
      runOnJS(onInteractionChange)(true);
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(maxZoom, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        // Snap back to 1
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
        // Clamp translate at new scale
        const maxX = (windowWidth * (scale.value - 1)) / 2;
        const maxY = ((containerHeight || windowWidth) * (scale.value - 1)) / 2;
        const clampedX = Math.max(-maxX, Math.min(maxX, translateX.value));
        const clampedY = Math.max(-maxY, Math.min(maxY, translateY.value));
        translateX.value = withSpring(clampedX, { damping: 15 });
        translateY.value = withSpring(clampedY, { damping: 15 });
        savedTranslateX.value = clampedX;
        savedTranslateY.value = clampedY;
      }
      runOnJS(onInteractionChange)(false);
    });

  const panGesture = Gesture.Pan()
    .enabled(revealed)
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(onInteractionChange)(true);
    })
    .onUpdate((e) => {
      if (scale.value > 1.05) {
        const maxX = (windowWidth * (scale.value - 1)) / 2;
        const maxY = ((containerHeight || windowWidth) * (scale.value - 1)) / 2;
        translateX.value = Math.max(-maxX, Math.min(maxX, savedTranslateX.value + e.translationX));
        translateY.value = Math.max(-maxY, Math.min(maxY, savedTranslateY.value + e.translationY));
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(onInteractionChange)(false);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .enabled(revealed)
    .onEnd(() => {
      if (scale.value > 1.1) {
        // Reset
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        // Zoom to 2x
        const zoomTo = isTablet ? 1.8 : 2;
        scale.value = withSpring(zoomTo, { damping: 15 });
        savedScale.value = zoomTo;
      }
    });

  // Compose: simultaneous pinch+pan, race with double-tap
  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

  // Animated styles
  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [
      { scale: revealScale.value * scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(curtainProgress.value, [0, 1], [-windowWidth, windowWidth * 2]) }],
    opacity: interpolate(curtainProgress.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  // Hint
  const hintOpacity = useSharedValue(0);
  useEffect(() => {
    if (revealed) {
      hintOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
      const t = setTimeout(() => { hintOpacity.value = withTiming(0, { duration: 500 }); }, 3500);
      return () => clearTimeout(t);
    }
  }, [revealed]);
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => setContainerHeight(e.nativeEvent.layout.height),
    []
  );

  return (
    <View style={styles.imageRevealContainer} onLayout={handleLayout}>
      <Animated.View style={[styles.imageGlow, glowStyle]} />

      <GestureDetector gesture={composedGesture}>
        <Animated.Image
          source={{ uri: imageUrl }}
          style={[styles.heroImage, imageStyle]}
          resizeMode="contain"
        />
      </GestureDetector>

      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />

      {revealed && (
        <Animated.View style={[styles.zoomHint, hintStyle]}>
          <Text style={styles.zoomHintText}>🔍 Pince pour zoomer</Text>
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Choice Cards Component
 * 
 * Narrative choices appear after the image moment.
 * Designed to not distract from the image.
 */
interface ChoiceCardsProps {
  choices: NarrativeChoice[];
  selectedChoice: NarrativeChoice | null;
  onSelect: (choice: NarrativeChoice) => void;
  visible: boolean;
  pageNumber: number;
}

const ChoiceCards: React.FC<ChoiceCardsProps> = ({
  choices,
  selectedChoice,
  onSelect,
  visible,
  pageNumber,
}) => {
  const containerOpacity = useSharedValue(0);
  const containerY = useSharedValue(20);

  // Dynamic pivot phrase
  const pivotText = useMemo(
    () => getPivotPhraseForPage(pageNumber),
    [pageNumber]
  );

  useEffect(() => {
    if (visible) {
      containerOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
      containerY.value = withDelay(300, withSpring(0, { damping: 15 }));
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.choicesSection, containerStyle]}>
      <Text style={styles.pivotText}>{pivotText}</Text>

      <View style={styles.choicesContainer}>
        {choices.map((choice) => {
          const isSelected = selectedChoice?.id === choice.id;
          const isDimmed = selectedChoice !== null && !isSelected;

          return (
            <Pressable
              key={choice.id}
              style={[
                styles.choiceCard,
                isSelected && styles.choiceCardSelected,
                isDimmed && styles.choiceCardDimmed,
              ]}
              onPress={() => onSelect(choice)}
            >
              <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                {choice.text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

/**
 * PageScreen
 * 
 * The illustrated story page. IMAGE IS THE HERO.
 * 
 * UX Philosophy:
 * - Image appears first with spectacular reveal
 * - Pivot phrase and choices appear after image moment
 * - Everything else orbits around the image
 * - CTA is inside scroll content (doesn't hide choices)
 * 
 * Reveal sequence:
 * 1. Image reveals with shimmer effect (0-1.5s)
 * 2. Brief pause for child to absorb the image (1.5-2.5s)
 * 3. Choices appear with pivot phrase
 * 4. CTA appears when a choice is selected
 */
export const PageScreen: React.FC = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const { paragraphText, imageUrl: paramImageUrl } = useLocalSearchParams<{
    paragraphText: string;
    imageUrl: string;
  }>();

  // Phase states for reveal sequence (simplified - removed caption phase)
  const [phase, setPhase] = useState<'image' | 'choices' | 'ready'>('image');
  const [selectedChoice, setSelectedChoice] = useState<NarrativeChoice | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const isNavigatingRef = useRef(false);

  const handleImageInteraction = useCallback((active: boolean) => {
    setScrollEnabled(!active);
  }, []);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const clearCurrentStory = useAppStore((state) => state.clearCurrentStory);

  const storyProgressList = useAppStore((state) => state.storyProgressList);
  const setStoryProgressList = useAppStore((state) => state.setStoryProgressList);
  const addUnlockedUniverse = useAppStore((state) => state.addUnlockedUniverse);
  const stars = useAppStore((state) => state.stars);

  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;

  // Fetch choices for current step; when choices are empty (and loaded), this is the last page
  const {
    data: choices,
    loading: choicesLoading,
    error: choicesError,
    refetch: refetchChoices,
  } = useNarrativeChoices(currentStory?.universeId, currentPageNumber, false);
  const isLastPage = !choicesLoading && Array.isArray(choices) && choices.length === 0;

  // Image comes from ParagraphScreen (fetched alongside the paragraph text)
  const imageUrl = paramImageUrl
    || `https://picsum.photos/seed/${currentStory?.universeId ?? 'default'}-${currentPageNumber}/400/300`;

  // Image takes more space on tablets where there's room
  const imageHeight = windowHeight * (isTablet ? 0.6 : 0.55);

  // Dynamic CTA text
  const ctaText = useMemo(() => {
    if (isLastPage) return "Terminer l'histoire";
    return getContinuePhrase();
  }, [isLastPage]);

  // Animation values for CTA
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);

  // Handle reveal sequence phases (simplified)
  const handleImageRevealComplete = useCallback(() => {
    // After image reveals, show choices directly
    setTimeout(() => {
      setPhase(isLastPage ? 'ready' : 'choices');
    }, 800); // Brief pause to absorb the image
  }, [isLastPage]);

  // Show CTA when appropriate
  useEffect(() => {
    const shouldShowCTA = isLastPage
      ? phase === 'ready'
      : selectedChoice !== null;

    if (shouldShowCTA) {
      ctaOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      ctaY.value = withDelay(200, withSpring(0, { damping: 15 }));
    }
  }, [selectedChoice, phase, isLastPage]);

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const handleChoiceSelect = (choice: NarrativeChoice) => {
    setSelectedChoice(choice);
  };

  const handleContinue = useCallback(async () => {
    if (!currentStory || isExiting) return;
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsExiting(true);

    try {
      const newPage: StoryPage = {
        id: generatePageId(),
        paragraphText: paragraphText || '',
        imageUrl,
        pageNumber: currentPageNumber,
        choiceId: selectedChoice?.id,
      };

      const updatedPages = [...(currentStory.pages || []), newPage];
      const universeId = currentStory.universeId;

      const user = await getCurrentUser();
      if (user && universeId) {
        const nextPageNum = isLastPage ? currentPageNumber : currentPageNumber + 1;
        await upsertStoryProgress(user.id, universeId, isLastPage ? currentPageNumber : nextPageNum);
        if (selectedChoice?.id) {
          await insertUserChoice(user.id, universeId, currentPageNumber, selectedChoice.id);
        }
      }

      if (isLastPage) {
        const completedStory = {
          ...currentStory,
          pages: updatedPages,
          updatedAt: new Date(),
          isComplete: true,
        } as Story;

        addStory(completedStory);
        if (universeId) addUnlockedUniverse(universeId);
        if (user) {
          saveCreatedStory(user.id, completedStory).catch((e) => __DEV__ && console.warn('Story save failed', e));
        }
        setStoryProgressList((storyProgressList ?? []).filter((p) => p.universeId !== universeId));
        clearCurrentStory();

        router.replace({
          pathname: '/story/completed',
          params: { storyId: completedStory.id },
        });
      } else {
        updateCurrentStory({
          pages: updatedPages,
          selectedChoiceId: selectedChoice?.id,
        });

        router.replace('/story/paragraph');
      }
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  }, [
    currentStory,
    isExiting,
    paragraphText,
    imageUrl,
    currentPageNumber,
    selectedChoice,
    isLastPage,
    addStory,
    addUnlockedUniverse,
    storyProgressList,
    setStoryProgressList,
    clearCurrentStory,
    updateCurrentStory,
  ]);

  const showCTA = isLastPage ? phase === 'ready' : selectedChoice !== null;

  if (choicesError) {
    return (
      <ScreenContainer style={styles.container}>
        <ErrorFallback
          message="Impossible de charger les choix. Vérifie ta connexion."
          onRetry={refetchChoices}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={scrollEnabled}
      >
        {/* THE HERO: The illustrated scene */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <ImageReveal
            imageUrl={imageUrl}
            onRevealComplete={handleImageRevealComplete}
            isTablet={isTablet}
            onInteractionChange={handleImageInteraction}
          />
        </View>

        {/* Secondary content area - below the image */}
        <View style={styles.secondaryContent}>
          {/* Narrative choices - not on last page */}
          {!isLastPage && (
            <ChoiceCards
              choices={choices}
              selectedChoice={selectedChoice}
              onSelect={handleChoiceSelect}
              visible={phase === 'choices' || phase === 'ready'}
              pageNumber={currentPageNumber}
            />
          )}

          {/* Last page ending message */}
          {isLastPage && phase === 'ready' && (
            <View style={styles.endSection}>
              <Text style={styles.endTitle}>
                {getRandomPhrase(COMPLETION_PHRASES.title, 'completion_title')}
              </Text>
              <Text style={styles.endText}>
                {getRandomPhrase(COMPLETION_PHRASES.message, 'completion_message')}
              </Text>
            </View>
          )}

          {/* CTA - inside scroll content so it doesn't hide choices */}
          {showCTA && (
            <Animated.View style={[styles.ctaContainer, ctaStyle]}>
              <AnimatedPressable
                style={[styles.button]}
                onPress={handleContinue}
                disabled={isExiting}
              >
                <Text style={styles.buttonText}>{ctaText}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },

  // Image container - the hero takes center stage
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  imageRevealContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfaceWarm,
  },
  heroImage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
  },
  zoomHint: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.overlayHeavy,
    paddingHorizontal: spacing.lg - spacing.xxs,
    paddingVertical: spacing.sm - spacing.xxs,
    borderRadius: radius.xl,
  },
  zoomHintText: {
    color: colors.text.inverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: spacing.xxxl * 3 + spacing.lg,
    backgroundColor: colors.shimmerSheen,
  },

  // Secondary content - everything orbits around the image
  secondaryContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg + spacing.xs,
  },

  // Choices section
  choicesSection: {
    marginTop: spacing.xs,
  },
  pivotText: {
    fontSize: typography.size.lg,
    fontStyle: 'italic',
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  choicesContainer: {
    gap: spacing.md,
  },
  choiceCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg + spacing.xxs,
    paddingHorizontal: spacing.lg + spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceMuted,
  },
  choiceCardDimmed: {
    opacity: 0.4,
  },
  choiceText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    lineHeight: typography.size.lg + spacing.sm,
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },

  // End section
  endSection: {
    marginTop: spacing.lg + spacing.xs,
    alignItems: 'center',
  },
  endTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md - spacing.xxs,
  },
  endText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: typography.size.lg + spacing.sm,
  },

  // CTA - inside scroll content
  ctaContainer: {
    marginTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + spacing.xxs,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  buttonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
