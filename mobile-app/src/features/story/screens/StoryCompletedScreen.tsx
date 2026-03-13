import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
} from 'react-native-reanimated';
import { ScreenContainer, StarsBadge, Button } from '@/shared';
import { colors, radius, typography, shadows, spacing } from '@/theme';
import { useAppStore } from '@/store';

/**
 * StoryCompletedScreen
 * 
 * The climax of the creation journey.
 * A moment of pride, accomplishment, and wonder.
 * 
 * The child has just created something.
 * This screen celebrates that act.
 */
export const StoryCompletedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  
  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const stars = useAppStore((state) => state.stars);

  const story = stories.find((s) => s.id === storyId);
  const heroName = heroProfile?.name || 'auteur';

  // Animation values
  const celebrationScale = useSharedValue(0.8);
  const celebrationOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  useEffect(() => {
    // Celebration entrance
    celebrationOpacity.value = withTiming(1, { duration: 600 });
    celebrationScale.value = withSpring(1, { damping: 12, stiffness: 100 });

    // Sparkles appear with stagger
    sparkle1.value = withDelay(300, withTiming(1, { duration: 400 }));
    sparkle2.value = withDelay(450, withTiming(1, { duration: 400 }));
    sparkle3.value = withDelay(600, withTiming(1, { duration: 400 }));

    // Title appears
    titleOpacity.value = withDelay(
      400,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Message appears
    messageOpacity.value = withDelay(
      700,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Actions appear last
    actionsOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const celebrationStyle = useAnimatedStyle(() => ({
    opacity: celebrationOpacity.value,
    transform: [{ scale: celebrationScale.value }],
  }));

  const sparkleStyle = (progress: { value: number }, _delay: number) =>
    useAnimatedStyle(() => ({
      opacity: progress.value,
      transform: [
        { scale: interpolate(progress.value, [0, 1], [0.5, 1]) },
        { rotate: `${interpolate(progress.value, [0, 1], [0, 15])}deg` },
      ],
    }));

  const sparkle1Style = sparkleStyle(sparkle1, 0);
  const sparkle2Style = sparkleStyle(sparkle2, 0);
  const sparkle3Style = sparkleStyle(sparkle3, 0);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: interpolate(titleOpacity.value, [0, 1], [20, 0]) }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  const handleReadStory = () => {
    if (story) {
      router.replace({
        pathname: '/story/reader',
        params: { storyId: story.id },
      });
    }
  };

  const handleGoToLibrary = () => {
    router.replace('/library');
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
        <StarsBadge count={stars} />
      </View>
      <View style={styles.content}>
        {/* Celebration visual */}
        <Animated.View style={[styles.celebrationContainer, celebrationStyle]}>
          {/* Central book symbol */}
          <View style={styles.bookSymbol}>
            <View style={styles.bookCover} />
            <View style={styles.bookPages} />
          </View>
          
          {/* Sparkles */}
          <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]} />
          <Animated.View style={[styles.sparkle, styles.sparkle2, sparkle2Style]} />
          <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]} />
        </Animated.View>

        {/* Congratulation text */}
        <Animated.View style={[styles.textContainer, titleStyle]}>
          <Text style={styles.headline}>
            C'est ecrit.
          </Text>
          <Text style={styles.storyTitle}>
            {story?.title || 'Ton histoire'}
          </Text>
        </Animated.View>

        {/* Emotional message */}
        <Animated.View style={[styles.messageContainer, messageStyle]}>
          <Text style={styles.message}>
            {heroName}, tu viens de creer{'\n'}
            quelque chose qui n'existait pas.
          </Text>
          <Text style={styles.submessage}>
            Garde-le precieusement.
          </Text>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsContainer, actionsStyle]}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleReadStory}
          >
            <Text style={styles.primaryButtonText}>Decouvrir mon histoire</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            onPress={handleGoToLibrary}
          >
            <Text style={styles.secondaryButtonText}>Ma bibliotheque</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tertiaryButton, pressed && styles.tertiaryButtonPressed]}
            onPress={handleGoHome}
          >
            <Text style={styles.tertiaryButtonText}>Retour</Text>
          </Pressable>
        </Animated.View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    alignItems: 'center',
  },

  // Celebration visual
  celebrationContainer: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  bookSymbol: {
    width: 80,
    height: 100,
    position: 'relative',
  },
  bookCover: {
    position: 'absolute',
    width: 80,
    height: 100,
    backgroundColor: colors.ink,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  bookPages: {
    position: 'absolute',
    right: 4,
    top: 4,
    bottom: 4,
    width: 6,
    backgroundColor: colors.accentLight,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.ink,
  },
  sparkle1: {
    top: 20,
    left: 30,
    opacity: 0.7,
  },
  sparkle2: {
    top: 40,
    right: 25,
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  sparkle3: {
    bottom: 30,
    left: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },

  // Text
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 20,
    fontStyle: 'italic',
    color: colors.inkLight,
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  submessage: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.inkMuted,
  },

  // Actions
  actionsContainer: {
    width: '100%',
    gap: 12,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.ink,
    paddingVertical: 18,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  secondaryButtonText: {
    ...typography.button,
    fontSize: 16,
    color: colors.ink,
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryButtonPressed: {
    opacity: 0.6,
  },
  tertiaryButtonText: {
    fontSize: 14,
    color: colors.inkMuted,
  },
});
