import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ScreenContainer, Button, ComicIllustration } from '@/shared';
import { useAppStore } from '@/store';
import { colors, spacing, typography, radius, shadows } from '@/theme';

const HERO_IMAGE = 'https://picsum.photos/seed/magic-story-hero/800/1200';

export const HomeScreen: React.FC = () => {
  const { height: windowHeight } = useWindowDimensions();
  const [isReady, setIsReady] = useState(false);

  const heroProfile = useAppStore((state) => state.heroProfile);
  const stories = useAppStore((state) => state.stories);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const rewardStar = useAppStore((state) => state.rewardStar);

  const hasStories = stories.length > 0;

  useEffect(() => {
    if (!hasCompletedOnboarding) return;
    const timer = setTimeout(() => {
      rewardStar('daily_bonus');
    }, 800);
    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding]);

  const heroName = heroProfile?.name || 'toi';

  const heroImage = useMemo(() => {
    if (hasStories) {
      const lastStory = stories[stories.length - 1];
      if (lastStory?.pages?.[0]?.imageUrl) {
        return lastStory.pages[0].imageUrl;
      }
    }
    return HERO_IMAGE;
  }, [hasStories, stories]);

  const contentOpacity = useSharedValue(0);

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
    contentOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
  }, [isReady, hasCompletedOnboarding]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!isReady || !hasCompletedOnboarding) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.loadingContainer} />
      </ScreenContainer>
    );
  }

  const imageHeight = windowHeight * 0.52;

  return (
    <ScreenContainer style={styles.container}>
      <Animated.View style={[styles.content, contentStyle]}>
        {/* Comic-style image frame with thick border */}
        <View style={[styles.imageFrame, { height: imageHeight }]}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Comic frame corner marks */}
          <View style={[styles.cornerMark, styles.cornerTL]} />
          <View style={[styles.cornerMark, styles.cornerTR]} />
          <View style={[styles.cornerMark, styles.cornerBL]} />
          <View style={[styles.cornerMark, styles.cornerBR]} />
        </View>

        {/* Bottom section */}
        <View style={styles.bottomSection}>
          <View style={styles.headlineRow}>
            <ComicIllustration variant="creating" size="small" style={styles.miniIllustration} />
            <View style={styles.headlineTextWrap}>
              <Text style={styles.headline}>
                {hasStories
                  ? `${heroName}, pret pour\nune nouvelle aventure ?`
                  : 'Imagine une histoire.\nRegarde-la prendre vie.'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Creer une histoire"
              onPress={() => router.push('/story/universe-select')}
              variant="primary"
              size="large"
            />

            {hasStories && (
              <Button
                title="Mes histoires"
                onPress={() => router.push('/library')}
                variant="outline"
                size="medium"
              />
            )}
          </View>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  imageFrame: {
    width: '100%',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: colors.ink,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceAlt,
  },
  cornerMark: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderColor: colors.ink,
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderLeftWidth: 2.5,
    borderTopWidth: 2.5,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: spacing.lg + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + spacing.sm,
    justifyContent: 'space-between',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  miniIllustration: {
    width: 64,
    height: 64,
  },
  headlineTextWrap: {
    flex: 1,
  },
  headline: {
    ...typography.title,
    color: colors.ink,
    lineHeight: 34,
  },
  actions: {
    gap: spacing.sm + 4,
  },
});
