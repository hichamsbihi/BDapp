import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';

/**
 * Welcome screen - first screen of onboarding
 * Creates a magical first impression for children (6-10 years)
 * 
 * Animation sequence:
 * 1. Illustration (scale + fade) - immediate, then breathing loop
 * 2. Title (fade + slide) - 400ms delay
 * 3. Subtitle (fade + slide) - 650ms delay
 * 4. Button (scale + fade) - 950ms delay
 */
export const WelcomeScreen: React.FC = () => {
  // Shared values for animation progress (0 = hidden, 1 = visible)
  const illustrationProgress = useSharedValue(0);
  const illustrationBreathing = useSharedValue(1); // For subtle breathing effect
  const titleProgress = useSharedValue(0);
  const subtitleProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);

  // Animation configuration
  const ANIMATION_DURATION = 700;
  const EASING = Easing.out(Easing.cubic);

  useEffect(() => {
    // Staggered animation sequence for storytelling effect
    illustrationProgress.value = withTiming(1, {
      duration: ANIMATION_DURATION,
      easing: EASING,
    });

    titleProgress.value = withDelay(
      400,
      withTiming(1, { duration: ANIMATION_DURATION, easing: EASING })
    );

    subtitleProgress.value = withDelay(
      650,
      withTiming(1, { duration: ANIMATION_DURATION, easing: EASING })
    );

    buttonProgress.value = withDelay(
      950,
      withTiming(1, { duration: 800, easing: EASING })
    );
  }, []);

  // Subtle breathing animation on illustration (starts after entrance)
  useEffect(() => {
    const timeout = setTimeout(() => {
      illustrationBreathing.value = withRepeat(
        withTiming(1.05, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        -1, // infinite loop
        true // reverse
      );
    }, ANIMATION_DURATION); // Start after entrance animation

    return () => clearTimeout(timeout);
  }, []);

  // Animated styles

  // Illustration: scale from 0.5 to 1 + fade in + breathing effect
  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: illustrationProgress.value,
    transform: [
      { scale: interpolate(illustrationProgress.value, [0, 1], [0.5, 1]) * illustrationBreathing.value },
    ],
  }));

  // Title: fade in + slide up from 20px
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [
      { translateY: interpolate(titleProgress.value, [0, 1], [20, 0]) },
    ],
  }));

  // Subtitle: fade in + slide up from 15px
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleProgress.value,
    transform: [
      { translateY: interpolate(subtitleProgress.value, [0, 1], [15, 0]) },
    ],
  }));

  // Button: scale from 0.9 to 1 + fade in
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [
      { scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const handleStart = () => {
    router.push('/onboarding/hero-info');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* Magical illustration placeholder */}
        <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
          <View style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>✨📖✨</Text>
          </View>
        </Animated.View>

        {/* Main title - split for visual hierarchy */}
        <Animated.View style={titleStyle}>
          <Text style={styles.titleSmall}>Bienvenue dans</Text>
          <Text style={styles.titleBig}>Monde d'Histoires</Text>
        </Animated.View>

        {/* Subtitle - warm and inviting message */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>
            Ici, tu inventes des histoires
          </Text>
          <Text style={styles.subtitleHighlight}>
            ou TU es le heros !
          </Text>
        </Animated.View>
      </View>

      {/* Call-to-action button */}
      <Animated.View style={[styles.footer, buttonStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>C'est parti 🚀</Text>
        </Pressable>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    backgroundColor: '#FFFCF5', // Warm, soft background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Illustration
  illustrationContainer: {
    marginBottom: 48,
  },
  illustrationCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FFF3E0', // Soft orange/peach
    justifyContent: 'center',
    alignItems: 'center',
    // Subtle shadow for depth
    shadowColor: '#FFB74D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  illustrationEmoji: {
    fontSize: 48,
  },

  // Typography
  titleSmall: {
    fontSize: 22,
    fontWeight: '500',
    color: '#5D4E37', // Warm brown
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleBig: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF8A65', // Warm coral/orange
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#8D7B68', // Muted warm brown
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitleHighlight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D4E37', // Darker for emphasis
    textAlign: 'center',
    lineHeight: 28,
  },

  // Footer & Button
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  button: {
    backgroundColor: '#FF8A65', // Match title color
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    // Subtle shadow
    shadowColor: '#FF8A65',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
