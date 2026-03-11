import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { useParagraph } from '@/hooks/useStoryData';
import {
  getSceneRevealPhrase,
  getRandomPhrase,
  CREATION_PHRASES,
} from '@/constants/magicWords';

/** Max dots shown in progress indicator (story length is dynamic per universe). */
const MAX_PROGRESS_DOTS = 10;

/**
 * Magical Sparkle component for the creation overlay
 */
const MagicSparkle: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 8 }),
        withDelay(500, withTiming(0, { duration: 400 }))
      )
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withDelay(500, withTiming(0, { duration: 400 }))
      )
    );
  }, [delay]);

  const sparkleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: y,
    width: 12,
    height: 12,
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: '45deg' }],
    backgroundColor: '#FFD700',
    borderRadius: 2,
  }));

  return <Animated.View style={sparkleStyle} />;
};

/**
 * Creation overlay - transition animation before image appears
 * Replaces the basic Lottie with a custom magical experience
 */
const CreationOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [statusText, setStatusText] = useState(
    getRandomPhrase(CREATION_PHRASES.waiting, 'paragraph_creation')
  );
  
  const overlayOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const iconScale = useSharedValue(0.8);
  const iconRotation = useSharedValue(0);

  // Generate sparkle positions
  const sparkles = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      delay: i * 300 + Math.random() * 200,
      x: Math.random() * 200 - 100 + 100, // Centered around 100
      y: Math.random() * 200 - 100 + 100,
    }));
  }, []);

  useEffect(() => {
    // Overlay entrance
    overlayOpacity.value = withTiming(1, { duration: 400 });
    
    // Content appears
    contentOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
    
    // Icon pulse animation
    iconScale.value = withDelay(
      400,
      withSequence(
        withSpring(1.1, { damping: 10 }),
        withSpring(1, { damping: 12 })
      )
    );

    // Subtle continuous rotation
    iconRotation.value = withDelay(
      500,
      withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    );

    // Update status text
    const textInterval = setInterval(() => {
      setStatusText(getRandomPhrase(CREATION_PHRASES.progress, 'paragraph_progress'));
    }, 1500);

    // Navigate after the magical moment
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(textInterval);
    };
  }, [onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.creationContainer, contentStyle]}>
        {/* Sparkles */}
        <View style={styles.sparklesContainer}>
          {sparkles.map((sparkle, index) => (
            <MagicSparkle key={index} {...sparkle} />
          ))}
        </View>
        
        {/* Magic icon - animated brush/wand */}
        <Animated.View style={[styles.magicIconContainer, iconStyle]}>
          <Text style={styles.magicIcon}>✨</Text>
        </Animated.View>

        {/* Dynamic poetic message */}
        <Text style={styles.creationText}>{statusText}</Text>
      </Animated.View>
    </Animated.View>
  );
};

/**
 * ParagraphScreen
 * 
 * The reading moment. The text is sacred.
 * When the child taps the CTA, a magical creation animation plays.
 * 
 * Key UX improvements:
 * - Dynamic wording that varies each time
 * - Smooth "scene completion" transition (not abrupt)
 * - Emotional continuity preserved
 */
export const ParagraphScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [isCreating, setIsCreating] = useState(false);
  const [isButtonReady, setIsButtonReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const currentStory = useAppStore((state) => state.currentStory);
  const stars = useAppStore((state) => state.stars);
  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;
  // Dots count = current step (dynamic per story); cap for very long stories
  const dotsCount = Math.min(currentPageNumber, MAX_PROGRESS_DOTS);

  // Dynamic CTA text - varies to keep experience fresh
  const ctaText = useMemo(() => getSceneRevealPhrase(), [currentPageNumber]);

  // Fetch paragraph + image from Supabase (with local fallback)
  const { data: paragraphData, loading: paragraphLoading } = useParagraph(
    currentStory?.universeId,
    currentPageNumber
  );

  // Page 1 uses the selected openingText, subsequent pages use fetched data
  const paragraphText =
    currentPageNumber === 1 && currentStory?.openingText
      ? currentStory.openingText
      : paragraphData.text;

  // imageUrl fetched alongside the paragraph (single DB call)
  const paragraphImageUrl = paragraphData.imageUrl;

  // Animation values
  const textProgress = useSharedValue(0);
  const dotsProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const contentBlur = useSharedValue(1);
  
  // Exit transition - smooth "page turning" effect
  const exitTranslateY = useSharedValue(0);
  const exitScale = useSharedValue(1);

  useEffect(() => {
    // Reset state and animations when page changes
    setIsButtonReady(false);
    setIsCreating(false);
    textProgress.value = 0;
    dotsProgress.value = 0;
    buttonProgress.value = 0;
    contentBlur.value = 1;

    // Text: slow, meditative appearance
    textProgress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Progress dots: appear after text
    dotsProgress.value = withDelay(
      1200,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) })
    );

    // Button: appears last, gives time to read
    buttonProgress.value = withDelay(
      2500,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Enable button interaction after animation delay
    const timer = setTimeout(() => {
      setIsButtonReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentPageNumber]);

  const textStyle = useAnimatedStyle(() => ({
    opacity: textProgress.value,
    transform: [{ scale: interpolate(textProgress.value, [0, 1], [0.98, 1]) }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: dotsProgress.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ translateY: interpolate(buttonProgress.value, [0, 1], [12, 0]) }],
  }));

  // Content dims during creation and slides up during exit
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentBlur.value,
    transform: [
      { translateY: exitTranslateY.value },
      { scale: exitScale.value },
    ],
  }));

  const handleContinue = () => {
    if (isExiting) return;

    // Les étoiles ne sont utilisées que pour débloquer des univers (pas pour les images)
    setIsExiting(true);

    // Smooth "scene completion" effect:
    // 1. Content gently fades and lifts (like turning a page)
    // 2. Then the creation overlay appears
    contentBlur.value = withTiming(0.4, { duration: 400, easing: Easing.out(Easing.cubic) });
    exitTranslateY.value = withTiming(-20, { duration: 400, easing: Easing.out(Easing.cubic) });
    exitScale.value = withTiming(0.98, { duration: 400, easing: Easing.out(Easing.cubic) });
    
    // Show creation animation after the exit begins (creates continuity)
    setTimeout(() => {
      setIsCreating(true);
    }, 200);
  };

  const handleCreationComplete = useCallback(() => {
    router.push({
      pathname: '/story/page',
      params: { paragraphText, imageUrl: paragraphImageUrl },
    });
  }, [paragraphText, paragraphImageUrl]);

  // Progress dots: exactly dotsCount dots (current step), all filled
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 1; i <= dotsCount; i++) {
      dots.push(
        <View key={i} style={[styles.dot, styles.dotFilled]} />
      );
    }
    return dots;
  };

  return (
    <ScreenContainer style={styles.container}>
      {/* No stars badge in story creation flow */}
      {/* Main content — dims during creation */}
      <Animated.View style={[styles.contentWrapper, contentStyle]}>
        <View style={styles.content}>
          {/* The sacred text — alone, breathing */}
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.paragraph}>{paragraphText}</Text>
          </Animated.View>

          {/* Progress indicator — minimal, non-intrusive */}
          <Animated.View style={[styles.progressContainer, dotsStyle]}>
            {renderProgressDots()}
          </Animated.View>
        </View>

        {/* CTA — appears after reading time, uses dynamic wording */}
        <Animated.View
          style={[styles.footer, buttonStyle]}
          pointerEvents={isButtonReady && !isCreating && !isExiting ? 'auto' : 'none'}
        >
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>{ctaText}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Creation overlay with Lottie animation */}
      {isCreating && <CreationOverlay onComplete={handleCreationComplete} />}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFCF5',
  },
  contentWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Text container — centered, breathing
  textContainer: {
    paddingVertical: 40,
  },
  paragraph: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#4A3F32',
    lineHeight: 34,
    textAlign: 'center',
  },

  // Progress dots — minimal
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5DDD3',
  },
  dotFilled: {
    backgroundColor: '#C4B5A5',
  },

  // Footer
  footer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 44,
    backgroundColor: '#FFFCF5',
  },
  button: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Creation overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 252, 245, 0.97)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creationContainer: {
    alignItems: 'center',
  },
  sparklesContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    // Sparkles are positioned relative to this container
  },
  magicIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  magicIcon: {
    fontSize: 60,
  },
  creationText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#5D4E37',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 26,
  },
});
