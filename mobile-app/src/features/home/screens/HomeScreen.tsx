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
import { ScreenContainer, StarsBadgeWithModal } from '@/shared';
import { useAppStore } from '@/store';
import {
  useHeroProfile,
  useStories,
  useCurrentStory,
  useHasCompletedOnboarding,
  useCredits,
} from '@/store/selectors';
import { DepthCarousel } from '../components/DepthCarousel';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import type { Story } from '@/types';

const EASING = Easing.out(Easing.cubic);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 100;
const CONTINUE_CARD_HEIGHT = 140;

/**
 * HomeScreen
 * Immersive home: greeting, avatar badge, "Continuer l'histoire", "Mes histoires" depth carousel, primary CTA.
 * Profile edit navigates to /profile.
 */
export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const heroProfile = useHeroProfile();
  const stories = useStories();
  const currentStory = useCurrentStory();
  const hasCompletedOnboarding = useHasCompletedOnboarding();
  const credits = useCredits();

  const heroName = heroProfile?.name || 'toi';
  const avatarImageUrl = heroProfile?.avatarImageUrl;
  const avatarCharacterName = heroProfile?.avatarCharacterName;

  const profileOpacity = useSharedValue(0);
  const profileY = useSharedValue(20);
  const continueOpacity = useSharedValue(0);
  const carouselOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  // Press-scale shared values
  const continueCardScale = useSharedValue(1);
  const primaryButtonScale = useSharedValue(1);
  const secondaryButtonScale = useSharedValue(1);
  const editProfileScale = useSharedValue(1);

  const hasStoryInProgress = Boolean(
    currentStory && currentStory.pages && currentStory.pages.length > 0
  );
  const sortedStories = [...stories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const completedStories = sortedStories.filter((s) => s.isComplete);

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

  // Press-scale animated styles
  const continueCardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueCardScale.value }],
  }));

  const primaryButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryButtonScale.value }],
  }));

  const secondaryButtonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryButtonScale.value }],
  }));

  const editProfileAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: editProfileScale.value }],
  }));

  const handleEditProfile = () => {
    router.push('/profile');
  };

  const handleCreateStory = () => {
    router.push('/selection/universe-select');
  };

  const handleLibrary = () => {
    router.push('/library');
  };

  const handleStoryPress = useCallback((story: Story) => {
    router.push({ pathname: '/story/reader', params: { storyId: story.id } });
  }, []);

  const handleContinueStory = () => {
    const currentPartId = useAppStore.getState().currentStory?.currentPartId;
    router.push({
      pathname: '/story/page',
      params: { partId: currentPartId ?? '' },
    });
  };

  const coverImageUrl = useCallback((story: Story) => {
    return story.pages?.[0]?.imageUrl || `https://picsum.photos/seed/${story.id}/400/300`;
  }, []);

  const lastStoryImage = currentStory?.pages?.[0]?.imageUrl;
  const lastStoryTitle = currentStory?.title || 'Histoire en cours';

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background] as const}
        style={StyleSheet.absoluteFill}
      />
      <ScreenContainer style={styles.container}>
        <View style={[styles.starsHeader, { top: insets.top + 8, right: insets.right + spacing.xl }]}>
          <StarsBadgeWithModal />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.profileSection, profileStyle]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarRing}>
                <View style={styles.avatarInner}>
                  {avatarImageUrl ? (
                    <Image
                      source={{ uri: avatarImageUrl }}
                      style={styles.avatarImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>?</Text>
                    </View>
                  )}
                </View>
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
              onPress={handleEditProfile}
              onPressIn={() => { editProfileScale.value = withSpring(0.97, { damping: 15 }); }}
              onPressOut={() => { editProfileScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Animated.View style={[styles.editProfileButton, editProfileAnimStyle]}>
                <Text style={styles.editProfileText}>Modifier le profil</Text>
              </Animated.View>
            </Pressable>
          </Animated.View>

          {hasStoryInProgress && (
            <Animated.View style={[styles.continueSection, continueStyle]}>
              <Text style={styles.sectionTitle}>Continuer l'histoire</Text>
              <Pressable
                onPress={handleContinueStory}
                onPressIn={() => { continueCardScale.value = withSpring(0.97, { damping: 15 }); }}
                onPressOut={() => { continueCardScale.value = withSpring(1, { damping: 12 }); }}
              >
                <Animated.View style={[styles.continueCard, continueCardAnimStyle]}>
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
                </Animated.View>
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
              onPress={handleCreateStory}
              onPressIn={() => { primaryButtonScale.value = withSpring(0.97, { damping: 15 }); }}
              onPressOut={() => { primaryButtonScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Animated.View style={[styles.primaryButton, primaryButtonAnimStyle]}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Text style={styles.primaryButtonText}>Créer une nouvelle aventure</Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>

            <Pressable
              onPress={handleLibrary}
              onPressIn={() => { secondaryButtonScale.value = withSpring(0.97, { damping: 15 }); }}
              onPressOut={() => { secondaryButtonScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Animated.View style={[styles.secondaryButton, secondaryButtonAnimStyle]}>
                <Text style={styles.secondaryButtonText}>Ma bibliothèque</Text>
              </Animated.View>
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
    paddingBottom: spacing.xxxl,
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
    // No padding — the size difference (8px total) provides a 2px visual gap on each side
    // after the 2px border, leaving AVATAR_SIZE exactly for the inner view.
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 2,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  avatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    // Scale up to fill the circle — character PNGs have transparent padding around them
    transform: [{ scale: 1.3 }],
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
    fontSize: typography.size.display,
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
    minHeight: 44,
    justifyContent: 'center',
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
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  continueCard: {
    height: CONTINUE_CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.sm,
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
    textShadowColor: colors.overlay,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  carouselSection: {
    marginBottom: spacing.xxl,
  },
  emptyCarousel: {
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyCarouselText: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.lg * typography.lineHeight.relaxed,
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
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  secondaryButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    fontWeight: typography.weight.medium,
  },
});
