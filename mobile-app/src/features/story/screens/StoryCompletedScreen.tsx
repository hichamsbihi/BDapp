import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
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
import { ScreenContainer } from '@/shared';
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
  const { storyId } = useLocalSearchParams<{ storyId: string }>();
  
  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  
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

  const sparkleStyle = (progress: Animated.SharedValue<number>, delay: number) =>
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
    backgroundColor: '#FFFCF5',
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
    backgroundColor: '#FF8A65',
    borderRadius: 6,
    // Subtle shadow
    shadowColor: '#5D4E37',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bookPages: {
    position: 'absolute',
    right: 4,
    top: 4,
    bottom: 4,
    width: 6,
    backgroundColor: '#FAF6F0',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  sparkle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF8A65',
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
    color: '#4A3F32',
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#8D7B68',
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 17,
    color: '#6B5E50',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  submessage: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9A8B7A',
  },

  // Actions
  actionsContainer: {
    width: '100%',
    gap: 12,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#FF8A65',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFCF5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E0D5',
  },
  secondaryButtonPressed: {
    backgroundColor: '#FAF6F0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5D4E37',
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
    color: '#9A8B7A',
  },
});
