import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { useAvatars } from '@/hooks/useAvatars';
import { AvatarCharacter } from '@/types';
import { AnimatedAvatarCard } from '../components/AnimatedAvatarCard';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';

const EASING = Easing.out(Easing.cubic);

export const AvatarSelectScreen: React.FC = () => {
  const params = useLocalSearchParams<{ from?: string }>();
  const fromHome = params.from === 'home';

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarCharacter | null>(null);

  const updateHeroProfile = useAppStore((s) => s.updateHeroProfile);
  const heroProfile = useAppStore((s) => s.heroProfile);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const isNewUser = !hasCompletedOnboarding;

  const gender = heroProfile?.gender || 'boy';
  const { avatars, loading, error } = useAvatars(gender);

  // Animations
  const headerProgress = useSharedValue(0);
  const buttonProgress = useSharedValue(0);
  const confirmProgress = useSharedValue(0);

  useEffect(() => {
    headerProgress.value = withTiming(1, { duration: 600, easing: EASING });
    buttonProgress.value = withDelay(800, withTiming(1, { duration: 700, easing: EASING }));
  }, []);

  useEffect(() => {
    confirmProgress.value = selectedAvatar
      ? withSpring(1, { damping: 12, stiffness: 200 })
      : withTiming(0, { duration: 200 });
  }, [selectedAvatar]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerProgress.value,
    transform: [{ translateY: interpolate(headerProgress.value, [0, 1], [20, 0]) }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonProgress.value,
    transform: [{ scale: interpolate(buttonProgress.value, [0, 1], [0.9, 1]) }],
  }));

  const confirmStyle = useAnimatedStyle(() => ({
    opacity: confirmProgress.value,
    transform: [
      { scale: interpolate(confirmProgress.value, [0, 1], [0.8, 1]) },
      { translateY: interpolate(confirmProgress.value, [0, 1], [10, 0]) },
    ],
  }));

  const handleSelect = (avatar: AvatarCharacter) => {
    setSelectedAvatar(avatar);
  };

  const handleComplete = () => {
    if (!selectedAvatar) return;
    updateHeroProfile({
      avatarId: selectedAvatar.id,
      avatarImageUrl: selectedAvatar.frames.normal,
      avatarCharacterName: selectedAvatar.characterName,
    });
    if (fromHome) {
      router.back();
    } else {
      router.replace('/story/universe-select');
    }
  };

  const confirmMessage = heroProfile?.name
    ? `Parfait ${heroProfile.name} ! Ton héros est prêt ✨`
    : 'Super choix ! Ton héros est prêt ✨';

  // Split avatars into rows of 2 for the grid layout
  const rows: AvatarCharacter[][] = [];
  for (let i = 0; i < avatars.length; i += 2) {
    rows.push(avatars.slice(i, i + 2));
  }

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.header, headerStyle]}>
          {isNewUser && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>Étape 2</Text>
              <View style={styles.stepDots}>
                <View style={styles.stepDot} />
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <View style={styles.stepDot} />
              </View>
            </View>
          )}
          <Text style={styles.headerIcon}>🦸‍♂️</Text>
          <Text style={styles.title}>Voici tes héros !</Text>
          <Text style={styles.subtitle}>
            {heroProfile?.name
              ? `${heroProfile.name}, choisis celui qui te ressemble`
              : 'Choisis celui qui te ressemble'}
          </Text>
          <Text style={styles.subtitleHint}>
            C'est lui qui vivra toutes tes aventures !
          </Text>
        </Animated.View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>Chargement des héros...</Text>
          </View>
        ) : error ? (
          <View style={styles.loaderContainer}>
            <Text style={styles.errorText}>Impossible de charger les héros</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((avatar, colIndex) => (
                  <AnimatedAvatarCard
                    key={avatar.id}
                    avatar={avatar}
                    index={rowIndex * 2 + colIndex}
                    isSelected={selectedAvatar?.id === avatar.id}
                    onSelect={handleSelect}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      <Animated.View style={[styles.footer, buttonStyle]}>
        <Animated.Text style={[styles.confirmMessage, confirmStyle]}>
          {confirmMessage}
        </Animated.Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !selectedAvatar && styles.buttonDisabled,
            pressed && !!selectedAvatar && styles.buttonPressed,
          ]}
          onPress={handleComplete}
          disabled={!selectedAvatar}
        >
          <Text style={[styles.buttonText, !selectedAvatar && styles.buttonTextDisabled]}>
            L'aventure commence !
          </Text>
        </Pressable>
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
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: typography.weight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  headerIcon: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
    textAlign: 'center',
  },
  subtitleHint: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loaderText: {
    fontSize: typography.size.lg,
    color: colors.text.muted,
  },
  errorText: {
    fontSize: typography.size.lg,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  confirmMessage: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
});
