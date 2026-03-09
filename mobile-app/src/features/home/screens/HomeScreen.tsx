import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer, StarsBadge } from '@/shared';
import { useAppStore } from '@/store';
import { DepthCarousel } from '../components/DepthCarousel';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import type { Story } from '@/types';

const EASING = Easing.out(Easing.cubic);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 80;
const CONTINUE_CARD_HEIGHT = 100;

/**
 * HomeScreen
 * Immersive home: greeting, avatar badge, "Continuer l'histoire", "Mes histoires" depth carousel, primary CTA.
 * Profile edit navigates to /profile.
 */
export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const currentStory = useAppStore((state) => state.currentStory);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const rewardStar = useAppStore((state) => state.rewardStar);
  const stars = useAppStore((state) => state.stars);

  const heroName = heroProfile?.name || 'toi';
  const avatarImageUrl = heroProfile?.avatarImageUrl;
  const avatarCharacterName = heroProfile?.avatarCharacterName;

  const profileOpacity = useSharedValue(0);
  const profileY = useSharedValue(20);
  const continueOpacity = useSharedValue(0);
  const carouselOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  const hasStoryInProgress = Boolean(
    currentStory && currentStory.pages && currentStory.pages.length > 0
  );
  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const completedStories = sortedStories.filter((s) => s.isComplete);

  useEffect(() => {
    if (!hasCompletedOnboarding) {
      const t = setTimeout(() => router.replace('/onboarding'), 100);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => rewardStar('daily_bonus'), 800);
    return () => clearTimeout(t);
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    profileOpacity.value = withDelay(80, withTiming(1, { duration: 500, easing: EASING }));
    profileY.value = withSpring(0, { damping: 16, stiffness: 120 });
    continueOpacity.value = withDelay(220, withTiming(1, { duration: 450, easing: EASING }));
    carouselOpacity.value = withDelay(350, withTiming(1, { duration: 500, easing: EASING }));
    ctaOpacity.value = withDelay(500, withTiming(1, { duration: 400, easing: EASING }));
  }, []);

  const profileStyle = useAnimatedStyle(() => ({
    opacity: profileOpacity.value,
    transform: [{ translateY: profileY.value }],
  }));

  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
  }));

  const carouselStyle = useAnimatedStyle(() => ({
    opacity: carouselOpacity.value,
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  const handleEditProfile = () => {
    router.push('/profile');
  };

  const handleCreateStory = () => {
    router.push('/story/universe-select');
  };

  const handleLibrary = () => {
    router.push('/library');
  };

  const handleStoryPress = useCallback((story: Story) => {
    router.push({ pathname: '/story/reader', params: { storyId: story.id } });
  }, []);

  const handleContinueStory = () => {
    router.push('/story/paragraph');
  };

  const coverImageUrl = useCallback((story: Story) => {
    return story.pages?.[0]?.imageUrl || `https://picsum.photos/seed/${story.id}/400/300`;
  }, []);

  if (!hasCompletedOnboarding) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer} />
      </ScreenContainer>
    );
  }

  const lastStoryImage = currentStory?.pages?.[0]?.imageUrl;
  const lastStoryTitle = currentStory?.title || 'Histoire en cours';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['#FFFBF7', '#FFF9F0', '#FFFCF5'] as const}
        style={StyleSheet.absoluteFill}
      />
      <ScreenContainer style={styles.container}>
        <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + 20 }]}>
          <StarsBadge count={stars} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.profileSection, profileStyle]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarRing}>
                {avatarImageUrl ? (
                  <Image
                    source={{ uri: avatarImageUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>?</Text>
                  </View>
                )}
              </View>
              <View style={styles.greetingBlock}>
                <Text style={styles.greeting}>Bonjour {heroName}</Text>
                <Text style={styles.subGreeting}>Prêt pour une nouvelle aventure ?</Text>
                {avatarCharacterName ? (
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>Avatar : {avatarCharacterName}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.editProfileButton, pressed && styles.editProfilePressed]}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileText}>Modifier le profil</Text>
            </Pressable>
          </Animated.View>

          {hasStoryInProgress && (
            <Animated.View style={[styles.continueSection, continueStyle]}>
              <Text style={styles.sectionTitle}>Continuer l'histoire</Text>
              <Pressable
                style={({ pressed }) => [styles.continueCard, pressed && styles.continueCardPressed]}
                onPress={handleContinueStory}
              >
                {lastStoryImage ? (
                  <Image
                    source={{ uri: lastStoryImage }}
                    style={styles.continueCardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.continueCardPlaceholder} />
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)'] as const}
                  style={styles.continueCardGradient}
                />
                <Text style={styles.continueCardTitle} numberOfLines={2}>
                  {lastStoryTitle}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          <Animated.View style={[styles.carouselSection, carouselStyle]}>
            <Text style={styles.sectionTitle}>Mes histoires</Text>
            {completedStories.length > 0 ? (
              <DepthCarousel
                stories={completedStories}
                onStoryPress={handleStoryPress}
                coverImageUrl={coverImageUrl}
              />
            ) : (
              <View style={styles.emptyCarousel}>
                <Text style={styles.emptyCarouselText}>
                  Tu n'as pas encore d'histoire. Crée ta première aventure !
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.ctaSection, ctaStyle]}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
              onPress={handleCreateStory}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>Créer une nouvelle aventure</Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryPressed]}
              onPress={handleLibrary}
            >
              <Text style={styles.secondaryButtonText}>Ma bibliothèque</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
  },
  starsHeader: {
    position: 'absolute',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
  },

  profileSection: {
    marginBottom: spacing.xxl,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarRing: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: typography.size.xl,
    color: colors.text.muted,
    fontWeight: typography.weight.bold,
  },
  greetingBlock: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  greeting: {
    fontSize: typography.size.xxl + 2,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  subGreeting: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  avatarBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarBadgeText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
  editProfileButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  editProfilePressed: {
    opacity: 0.7,
  },
  editProfileText: {
    fontSize: typography.size.sm,
    color: colors.text.link,
    fontWeight: typography.weight.medium,
  },

  continueSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  continueCard: {
    height: CONTINUE_CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  continueCardPressed: {
    opacity: 0.95,
  },
  continueCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  continueCardPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  continueCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  continueCardTitle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  carouselSection: {
    marginBottom: spacing.xxl,
  },
  emptyCarousel: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyCarouselText: {
    fontSize: typography.size.md,
    color: colors.text.muted,
    textAlign: 'center',
  },

  ctaSection: {
    gap: spacing.md,
  },
  primaryButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  primaryGradient: {
    paddingVertical: 20,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: typography.size.lg + 1,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryPressed: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    fontSize: typography.size.md + 1,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
});
