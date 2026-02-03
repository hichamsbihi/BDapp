import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';

/**
 * HomeScreen
 * 
 * A screen of desire, not information.
 * The child should feel the pull of adventure,
 * the mystery of stories yet to be told.
 */
export const HomeScreen: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  // Animation values
  const fadeIn = useSharedValue(0);
  const titleScale = useSharedValue(0.96);
  const illustrationFloat = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!hasCompletedOnboarding) {
      router.replace('/onboarding');
      return;
    }

    // Entrance sequence
    fadeIn.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    titleScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    
    // Gentle floating animation for illustration
    illustrationFloat.value = withDelay(
      600,
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      )
    );

    ctaOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [isReady, hasCompletedOnboarding]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ scale: titleScale.value }],
  }));

  const illustrationStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [
      { translateY: interpolate(illustrationFloat.value, [0, 1], [0, -8]) },
    ],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleCreateStory = () => {
    router.push('/story/universe-select');
  };

  const handleViewLibrary = () => {
    router.push('/library');
  };

  if (!isReady || !hasCompletedOnboarding) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
        </View>
      </ScreenContainer>
    );
  }

  const hasStories = stories.length > 0;
  const heroName = heroProfile?.name || 'aventurier';

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        {/* Poetic header */}
        <Animated.View style={[styles.headerSection, contentStyle]}>
          <Text style={styles.salutation}>{heroName},</Text>
          
          {hasStories ? (
            <Text style={styles.headline}>
              Une nouvelle page{'\n'}attend d'etre ecrite.
            </Text>
          ) : (
            <Text style={styles.headline}>
              Ton histoire{'\n'}commence ici.
            </Text>
          )}
        </Animated.View>

        {/* Evocative illustration — a door, a book, mystery */}
        <Animated.View style={[styles.illustrationContainer, illustrationStyle]}>
          <View style={styles.illustration}>
            {/* Open book with light emanating */}
            <View style={styles.bookBase} />
            <View style={styles.bookPageLeft} />
            <View style={styles.bookPageRight} />
            <View style={styles.bookGlow} />
            {/* Floating elements suggesting magic */}
            <View style={[styles.floatingElement, styles.floatingElement1]} />
            <View style={[styles.floatingElement, styles.floatingElement2]} />
            <View style={[styles.floatingElement, styles.floatingElement3]} />
          </View>
        </Animated.View>

        {/* Poetic invitation */}
        <Animated.View style={[styles.invitationContainer, contentStyle]}>
          {hasStories ? (
            <Text style={styles.invitation}>
              Chaque histoire est un monde.{'\n'}
              Lequel vas-tu creer ?
            </Text>
          ) : (
            <Text style={styles.invitation}>
              Il etait une fois...{'\n'}
              toi.
            </Text>
          )}
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actionsContainer, ctaStyle]}>
          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleCreateStory}
          >
            <Text style={styles.primaryButtonText}>
              Ouvrir un nouveau chapitre
            </Text>
          </Pressable>

          {hasStories && (
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
              onPress={handleViewLibrary}
            >
              <Text style={styles.secondaryButtonText}>
                Mes creations
              </Text>
            </Pressable>
          )}
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
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4C8B8',
  },

  // Header
  headerSection: {
    marginBottom: 20,
  },
  salutation: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#9A8B7A',
    marginBottom: 12,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A3F32',
    lineHeight: 42,
  },

  // Illustration — an open book with magic
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: 200,
    height: 160,
    position: 'relative',
    alignItems: 'center',
  },
  bookBase: {
    position: 'absolute',
    bottom: 0,
    width: 140,
    height: 20,
    backgroundColor: '#C4B5A5',
    borderRadius: 4,
  },
  bookPageLeft: {
    position: 'absolute',
    bottom: 18,
    left: 30,
    width: 65,
    height: 90,
    backgroundColor: '#FAF6F0',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 2,
    transform: [{ rotate: '-8deg' }],
    // Page shadow
    shadowColor: '#5D4E37',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bookPageRight: {
    position: 'absolute',
    bottom: 18,
    right: 30,
    width: 65,
    height: 90,
    backgroundColor: '#FAF6F0',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '8deg' }],
    shadowColor: '#5D4E37',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bookGlow: {
    position: 'absolute',
    bottom: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8A65',
    opacity: 0.12,
  },
  floatingElement: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8A65',
    opacity: 0.6,
  },
  floatingElement1: {
    top: 20,
    left: 60,
  },
  floatingElement2: {
    top: 35,
    right: 55,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  floatingElement3: {
    top: 10,
    right: 70,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.4,
  },

  // Invitation
  invitationContainer: {
    marginBottom: 32,
  },
  invitation: {
    fontSize: 17,
    fontStyle: 'italic',
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Actions
  actionsContainer: {
    paddingBottom: 50,
    gap: 12,
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
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#9A8B7A',
  },
});
