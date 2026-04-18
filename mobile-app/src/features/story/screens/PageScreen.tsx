import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
  BackHandler,
  Modal as RNModal,
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
import { generatePageId } from '@/utils/ids';
import { Story, StoryPage, StoryChoice } from '@/types';
import { getCurrentUser } from '@/services/authService';
import { upsertStoryProgress, insertUserChoice, saveCreatedStory } from '@/services/syncService';
import {
  getPivotPhraseForPage,
  getContinuePhrase,
  COMPLETION_PHRASES,
  getRandomPhrase,
} from '@/constants/magicWords';

// ─── Image Reveal ─────────────────────────────────────────

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

  const revealScale = useSharedValue(1.1);
  const imageOpacity = useSharedValue(0);
  const curtainProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const [revealed, setRevealed] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [imageUrl]);

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
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
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
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const zoomTo = isTablet ? 1.8 : 2;
        scale.value = withSpring(zoomTo, { damping: 15 });
        savedScale.value = zoomTo;
      }
    });

  const composedGesture = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture)
  );

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

// ─── Choice Cards ─────────────────────────────────────────

interface ChoiceCardsProps {
  choices: StoryChoice[];
  selectedChoice: StoryChoice | null;
  onSelect: (choice: StoryChoice) => void;
  visible: boolean;
  partNumber: number;
}

const ChoiceCards: React.FC<ChoiceCardsProps> = ({
  choices,
  selectedChoice,
  onSelect,
  visible,
  partNumber,
}) => {
  const containerOpacity = useSharedValue(0);
  const containerY = useSharedValue(20);

  const pivotText = useMemo(
    () => getPivotPhraseForPage(partNumber),
    [partNumber]
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
              <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelSelected]}>
                {choice.label}
              </Text>
              <Text style={[styles.choiceDesc, isSelected && styles.choiceDescSelected]}>
                {choice.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

// ─── PageScreen ───────────────────────────────────────────

export const PageScreen: React.FC = () => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const { partId } = useLocalSearchParams<{ partId: string }>();

  const [phase, setPhase] = useState<'image' | 'text' | 'choices' | 'ready'>('image');
  const [selectedChoice, setSelectedChoice] = useState<StoryChoice | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [closeConfirmVisible, setCloseConfirmVisible] = useState(false);
  const isNavigatingRef = useRef(false);

  const handleImageInteraction = useCallback((active: boolean) => {
    setScrollEnabled(!active);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const clearCurrentStory = useAppStore((state) => state.clearCurrentStory);
  const storyProgressList = useAppStore((state) => state.storyProgressList);
  const setStoryProgressList = useAppStore((state) => state.setStoryProgressList);
  const addUnlockedStory = useAppStore((state) => state.addUnlockedStory);

  const currentPart = useMemo(() => {
    if (!currentStory?.allParts || !partId) return null;
    return currentStory.allParts.find((p) => p.id === partId) ?? null;
  }, [currentStory?.allParts, partId]);

  const choices = currentPart?.choices ?? [];
  const isLastPage = currentPart?.isEnding === true;

  const imageUrl = currentPart?.imageUrl
    || `https://picsum.photos/seed/${partId ?? 'default'}/512/512`;

  const imageHeight = windowHeight * (isTablet ? 0.6 : 0.55);

  const ctaText = useMemo(() => {
    if (isLastPage) return "Terminer l'histoire";
    return getContinuePhrase();
  }, [isLastPage]);

  const narrativeText = currentPart?.narrativeText ?? '';

  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(15);
  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(20);

  const handleImageRevealComplete = useCallback(() => {
    setTimeout(() => {
      setPhase('text');
    }, 600);
  }, []);

  useEffect(() => {
    if (phase === 'text') {
      textOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      textTranslateY.value = withSpring(0, { damping: 15 });

      const timer = setTimeout(() => {
        setPhase(isLastPage ? 'ready' : 'choices');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [phase, isLastPage]);

  useEffect(() => {
    const shouldShowCTA = isLastPage
      ? phase === 'ready'
      : selectedChoice !== null;

    if (shouldShowCTA) {
      ctaOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      ctaY.value = withDelay(200, withSpring(0, { damping: 15 }));
    }
  }, [selectedChoice, phase, isLastPage]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaY.value }],
  }));

  const handleChoiceSelect = (choice: StoryChoice) => {
    setSelectedChoice(choice);
  };

  const handleContinue = useCallback(async () => {
    if (!currentStory || !currentPart || isExiting) return;
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setIsExiting(true);

    try {
      const newPage: StoryPage = {
        id: generatePageId(),
        paragraphText: narrativeText,
        imageUrl,
        pageNumber: currentPart.partNumber,
        choiceId: selectedChoice?.id,
      };

      const updatedPages = [...(currentStory.pages || []), newPage];
      const universeId = currentStory.universeId;

      const user = await getCurrentUser();
      if (user && universeId) {
        await upsertStoryProgress(user.id, universeId, currentPart.partNumber);
        if (selectedChoice?.id) {
          await insertUserChoice(user.id, universeId, currentPart.partNumber, selectedChoice.id);
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
        if (currentStory?.generatedStoryId) addUnlockedStory(currentStory.generatedStoryId);
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
        const nextPartId = selectedChoice?.leadsToPartId;

        updateCurrentStory({
          pages: updatedPages,
          selectedChoiceId: selectedChoice?.id,
          currentPartId: nextPartId,
        });

        router.replace({
          pathname: '/story/page',
          params: { partId: nextPartId ?? '' },
        });
      }
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    }
  }, [
    currentStory,
    currentPart,
    isExiting,
    narrativeText,
    imageUrl,
    selectedChoice,
    isLastPage,
    addStory,
    addUnlockedStory,
    storyProgressList,
    setStoryProgressList,
    clearCurrentStory,
    updateCurrentStory,
  ]);

  const showCTA = isLastPage ? phase === 'ready' : selectedChoice !== null;

  if (!currentPart) {
    return (
      <ScreenContainer style={styles.container}>
        <ErrorFallback
          message="Impossible de charger cette page."
          onRetry={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  const handleClose = () => setCloseConfirmVisible(true);

  const confirmClose = () => {
    setCloseConfirmVisible(false);
    router.dismissTo('/(tabs)');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.closeButtonContainer}>
        <AnimatedPressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityLabel="Fermer"
          hitSlop={16}
        >
          <Text style={styles.closeButtonText}>Fermer</Text>
        </AnimatedPressable>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={scrollEnabled}
      >
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <ImageReveal
            imageUrl={imageUrl}
            onRevealComplete={handleImageRevealComplete}
            isTablet={isTablet}
            onInteractionChange={handleImageInteraction}
          />
        </View>

        <View style={styles.secondaryContent}>
          {phase !== 'image' && narrativeText.length > 0 && (
            <Animated.View style={[styles.narrativeSection, textStyle]}>
              <Text style={styles.narrativeTitle}>{currentPart.title}</Text>
              <Text style={styles.narrativeText}>{narrativeText}</Text>
            </Animated.View>
          )}

          {!isLastPage && (
            <ChoiceCards
              choices={choices}
              selectedChoice={selectedChoice}
              onSelect={handleChoiceSelect}
              visible={phase === 'choices' || phase === 'ready'}
              partNumber={currentPart.partNumber}
            />
          )}

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

          {showCTA && (
            <Animated.View style={[styles.ctaContainer, ctaStyle]}>
              <AnimatedPressable
                style={styles.button}
                onPress={handleContinue}
                disabled={isExiting}
              >
                <Text style={styles.buttonText}>{ctaText}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      <RNModal
        visible={closeConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCloseConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <Text style={styles.modalTitle}>Quitter l'histoire ?</Text>
            <Text style={styles.modalMessage}>
              Ta progression sur cette page sera perdue.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={styles.modalBtnContinue}
                onPress={() => setCloseConfirmVisible(false)}
              >
                <Text style={styles.modalBtnContinueText}>Continuer</Text>
              </Pressable>
              <Pressable style={styles.modalBtnQuit} onPress={confirmClose}>
                <Text style={styles.modalBtnQuitText}>Quitter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </RNModal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  closeButtonContainer: {
    paddingTop: spacing.sm,
    paddingLeft: spacing.lg,
    zIndex: 10,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  closeButtonText: {
    fontSize: typography.size.sm,
    color: '#fff',
    fontWeight: typography.weight.semibold,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
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
  secondaryContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg + spacing.xs,
  },
  narrativeSection: {
    marginBottom: spacing.xl,
  },
  narrativeTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  narrativeText: {
    fontSize: typography.size.md + 1,
    fontStyle: 'italic',
    color: colors.text.primary,
    lineHeight: (typography.size.md + 1) * 1.6,
    textAlign: 'center',
  },
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
  choiceLabel: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  choiceLabelSelected: {
    color: colors.primaryDark,
  },
  choiceDesc: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    lineHeight: typography.size.lg + spacing.sm,
    textAlign: 'center',
  },
  choiceDescSelected: {
    color: colors.text.primary,
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl + spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    ...shadows.lg,
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.5,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalBtnContinue: {
    flex: 1,
    backgroundColor: '#FF9800',
    paddingVertical: spacing.md + spacing.xxs,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalBtnContinueText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  modalBtnQuit: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.md + spacing.xxs,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalBtnQuitText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
});
