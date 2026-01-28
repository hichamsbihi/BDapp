import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { getParagraphForPage } from '@/data';

// Import the hand drawing animation
const handDrawingAnimation = require('@/assets/animations/hand-drawing.json');

/**
 * Creation overlay with Lottie animation
 * A magical quill writing with sparkles — enchanting, artisanal
 */
const CreationOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const lottieRef = useRef<LottieView>(null);
  const overlayOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.95);

  useEffect(() => {
    // Overlay fades in smoothly
    overlayOpacity.value = withTiming(1, { duration: 500 });

    // Text appears with subtle scale
    textOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    textScale.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Navigate after animation completes (4 seconds for the full magical experience)
    const timer = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.creationContainer}>
        {/* Lottie animation - magical quill writing */}
        <LottieView
          ref={lottieRef}
          source={handDrawingAnimation}
          autoPlay
          loop
          speed={0.8}
          style={styles.lottieAnimation}
        />

        {/* Poetic message */}
        <Animated.Text style={[styles.creationText, textStyle]}>
          L'histoire prend vie...
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

/**
 * ParagraphScreen
 * 
 * The reading moment. The text is sacred.
 * When the child taps the CTA, a magical creation animation plays.
 */
export const ParagraphScreen: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isButtonReady, setIsButtonReady] = useState(false);

  const currentStory = useAppStore((state) => state.currentStory);
  const currentPageNumber = (currentStory?.pages?.length || 0) + 1;
  const totalPages = 5;

  // Use stored openingText for page 1, otherwise fetch from data
  const paragraphText =
    currentPageNumber === 1 && currentStory?.openingText
      ? currentStory.openingText
      : currentStory?.universeId
        ? getParagraphForPage(currentStory.universeId, currentPageNumber)
        : '';

  // Animation values
  const textProgress = useSharedValue(0);
  const dotsProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const contentBlur = useSharedValue(1);

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

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentBlur.value,
  }));

  const handleContinue = () => {
    // Dim the content
    contentBlur.value = withTiming(0.3, { duration: 300 });
    // Show creation animation
    setIsCreating(true);
  };

  const handleCreationComplete = useCallback(() => {
    // Navigate directly to page screen
    router.push({
      pathname: '/story/page',
      params: { paragraphText },
    });
  }, [paragraphText]);

  // Generate progress dots
  const renderProgressDots = () => {
    const dots = [];
    for (let i = 1; i <= totalPages; i++) {
      dots.push(
        <View
          key={i}
          style={[styles.dot, i <= currentPageNumber && styles.dotFilled]}
        />
      );
    }
    return dots;
  };

  return (
    <ScreenContainer style={styles.container}>
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

        {/* CTA — appears after reading time */}
        <Animated.View
          style={[styles.footer, buttonStyle]}
          pointerEvents={isButtonReady && !isCreating ? 'auto' : 'none'}
        >
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Voir cette scène prendre vie</Text>
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
  lottieAnimation: {
    width: 240,
    height: 240,
  },
  creationText: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#5D4E37',
    letterSpacing: 0.3,
    marginTop: 16,
  },
});
