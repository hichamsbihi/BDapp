import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadge } from '@/shared';
import { useAppStore } from '@/store';
import { useNarrativeChoices } from '@/hooks/useStoryData';
import { generatePageId } from '@/utils/ids';
import { StoryPage, NarrativeChoice } from '@/types';
import {
  getPivotPhraseForPage,
  getContinuePhrase,
  COMPLETION_PHRASES,
  getRandomPhrase,
} from '@/constants/magicWords';

const TOTAL_PAGES = 5;

/**
 * Image Reveal Component
 * 
 * The spectacular moment when the image appears.
 * Uses a "unveiling" effect - like pulling back a curtain.
 */
interface ImageRevealProps {
  imageUrl: string;
  onRevealComplete: () => void;
}

const ImageReveal: React.FC<ImageRevealProps> = ({ imageUrl, onRevealComplete }) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  const imageScale = useSharedValue(1.1);
  const imageOpacity = useSharedValue(0);
  const curtainProgress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Glow appears first - builds anticipation
    glowOpacity.value = withTiming(0.6, { duration: 400 });
    
    // Image fades in with subtle scale (like emerging from mist)
    imageOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
    
    // Image settles to normal scale
    imageScale.value = withDelay(
      200,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
    
    // Curtain reveals (shimmer effect)
    curtainProgress.value = withDelay(
      100,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
    );

    // Signal completion after reveal
    const timer = setTimeout(() => {
      runOnJS(onRevealComplete)();
    }, 1500);

    return () => clearTimeout(timer);
  }, [onRevealComplete]);

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
    transform: [{ scale: imageScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Shimmer overlay that sweeps across the image
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(curtainProgress.value, [0, 1], [-windowWidth, windowWidth * 2]) },
    ],
    opacity: interpolate(curtainProgress.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  return (
    <View style={styles.imageRevealContainer}>
      {/* Glow behind image */}
      <Animated.View style={[styles.imageGlow, glowStyle]} />
      
      {/* The hero image */}
      <Animated.Image
        source={{ uri: imageUrl }}
        style={[styles.heroImage, imageStyle]}
        resizeMode="cover"
      />
      
      {/* Shimmer reveal effect */}
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { paragraphText, imageUrl: paramImageUrl } = useLocalSearchParams<{
    paragraphText: string;
    imageUrl: string;
  }>();

  // Phase states for reveal sequence (simplified - removed caption phase)
  const [phase, setPhase] = useState<'image' | 'choices' | 'ready'>('image');
  const [selectedChoice, setSelectedChoice] = useState<NarrativeChoice | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const currentStory = useAppStore((state) => state.currentStory);
  const updateCurrentStory = useAppStore((state) => state.updateCurrentStory);
  const addStory = useAppStore((state) => state.addStory);
  const clearCurrentStory = useAppStore((state) => state.clearCurrentStory);
  const rewardStar = useAppStore((state) => state.rewardStar);
  const stars = useAppStore((state) => state.stars);

  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;
  const isLastPage = currentPageNumber >= TOTAL_PAGES;

  // Fetch narrative choices from Supabase (with local fallback)
  const { data: choices } = useNarrativeChoices(
    currentStory?.universeId,
    currentPageNumber,
    isLastPage
  );

  // Image comes from ParagraphScreen (fetched alongside the paragraph text)
  const imageUrl = paramImageUrl
    || `https://picsum.photos/seed/${currentStory?.universeId ?? 'default'}-${currentPageNumber}/400/300`;

  // Image takes ~55% of screen to leave room for choices + CTA
  const imageHeight = windowHeight * 0.55;

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

  const handleContinue = () => {
    if (!currentStory || isExiting) return;
    setIsExiting(true);

    const newPage: StoryPage = {
      id: generatePageId(),
      paragraphText: paragraphText || '',
      imageUrl,
      pageNumber: currentPageNumber,
      choiceId: selectedChoice?.id,
    };

    const updatedPages = [...(currentStory.pages || []), newPage];

    if (isLastPage) {
      // Story complete — save and celebrate
      const completedStory = {
        ...currentStory,
        pages: updatedPages,
        updatedAt: new Date(),
        isComplete: true,
      } as any;

      addStory(completedStory);
      rewardStar('story_complete'); // +2 étoiles pour avoir terminé
      clearCurrentStory();

      router.replace({
        pathname: '/story/completed',
        params: { storyId: completedStory.id },
      });
    } else {
      // Continue to next paragraph
      updateCurrentStory({
        pages: updatedPages,
        selectedChoiceId: selectedChoice?.id,
      });

      router.replace('/story/paragraph');
    }
  };

  const showCTA = isLastPage ? phase === 'ready' : selectedChoice !== null;

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
        <StarsBadge count={stars} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* THE HERO: The illustrated scene */}
        <View style={[styles.imageContainer, { height: imageHeight }]}>
          <ImageReveal imageUrl={imageUrl} onRevealComplete={handleImageRevealComplete} />
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
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={handleContinue}
                disabled={isExiting}
              >
                <Text style={styles.buttonText}>{ctaText}</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5',
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
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
    backgroundColor: '#FFF8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5EBE0',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },

  // Secondary content - everything orbits around the image
  secondaryContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Choices section
  choicesSection: {
    marginTop: 4,
  },
  pivotText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#8D7B68',
    textAlign: 'center',
    marginBottom: 16,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceCard: {
    backgroundColor: '#FFFCF5',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
  },
  choiceCardSelected: {
    borderColor: '#FF8A65',
    borderWidth: 2,
    backgroundColor: '#FFFAF6',
  },
  choiceCardDimmed: {
    opacity: 0.4,
  },
  choiceText: {
    fontSize: 15,
    color: '#5D4E37',
    lineHeight: 22,
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#4A3F32',
    fontWeight: '500',
  },

  // End section
  endSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  endTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#5D4E37',
    marginBottom: 10,
  },
  endText: {
    fontSize: 15,
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 22,
  },

  // CTA - inside scroll content
  ctaContainer: {
    marginTop: 24,
    paddingBottom: 16,
  },
  button: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
