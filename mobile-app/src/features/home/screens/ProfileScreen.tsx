import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/shared';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
import { useAppStore } from '@/store';
import { useAvatars } from '@/hooks/useAvatars';
import { ProfileAvatarGrid } from '../components/ProfileAvatarGrid';
import { getCurrentUser, signOut } from '@/services/authService';
import { updateProfile } from '@/services/profileService';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import type { AvatarCharacter } from '@/types';

const AVATAR_SIZE = 88;

/**
 * Profile screen: edit name, choose avatar (simple grid, no animations).
 * Route: /profile
 */
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const heroProfile = useAppStore((state) => state.heroProfile);
  const updateHeroProfile = useAppStore((state) => state.updateHeroProfile);

  const [name, setName] = useState(heroProfile?.name ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarCharacter | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const gender = heroProfile?.gender ?? 'boy';
  const { avatars, loading } = useAvatars(gender);

  // Entrance animation
  const contentOpacity = useSharedValue(0);
  const contentY = useSharedValue(16);

  // Press-scale: saveButton
  const saveScale = useSharedValue(1);
  const savePressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  // Press-scale: signOutButton
  const signOutScale = useSharedValue(1);
  const signOutPressAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: signOutScale.value }],
  }));

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
    contentY.value = withSpring(0, { damping: 18, stiffness: 140 });
  }, []);

  const contentAnimStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  useEffect(() => {
    if (heroProfile?.name) setName(heroProfile.name);
  }, [heroProfile?.id]);

  useEffect(() => {
    if (!avatars.length) return;
    const current = avatars.find((a) => a.id === heroProfile?.avatarId);
    if (current) setSelectedAvatar(current);
  }, [avatars, heroProfile?.avatarId]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      updateHeroProfile({
        name: trimmed,
        ...(selectedAvatar && {
          avatarId: selectedAvatar.id,
          avatarImageUrl: selectedAvatar.frames.normal,
          avatarCharacterName: selectedAvatar.characterName,
        }),
      });
      const user = await getCurrentUser();
      if (user) {
        await updateProfile(user.id, {
          username: trimmed,
          selected_avatar_id: selectedAvatar?.id ?? null,
        });
      }
    } finally {
      setSaving(false);
      router.back();
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      useAppStore.getState().resetStoreForSignOut();
      router.replace('/onboarding');
    } finally {
      setSigningOut(false);
    }
  };

  const displayAvatarUrl = selectedAvatar?.frames.normal ?? heroProfile?.avatarImageUrl;

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={contentAnimStyle}>
            <View style={styles.topBar}>
              <AnimatedPressable
                style={styles.backButton}
                onPress={() => router.back()}
                hitSlop={12}
              >
                <Text style={styles.backButtonText}>Retour</Text>
              </AnimatedPressable>
            </View>

            <Text style={styles.title}>Mon profil</Text>

            <View style={styles.section}>
              <Text style={styles.label}>Photo de profil</Text>
              <View style={styles.currentAvatarRow}>
                <View style={styles.currentAvatarRing}>
                  <View style={styles.currentAvatarInner}>
                    {displayAvatarUrl ? (
                      <Image
                        source={{ uri: displayAvatarUrl }}
                        style={styles.currentAvatarImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.currentAvatarPlaceholder}>
                        <Text style={styles.currentAvatarPlaceholderText}>?</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.currentAvatarHint}>
                  Choisis un avatar ci-dessous
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Choisir un avatar</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <ProfileAvatarGrid
                  avatars={avatars}
                  selectedAvatarId={selectedAvatar?.id ?? heroProfile?.avatarId ?? null}
                  onSelect={setSelectedAvatar}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Mon prénom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ton prénom"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                maxLength={20}
              />
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
              onPressIn={() => { saveScale.value = withSpring(0.97, { damping: 15 }); }}
              onPressOut={() => { saveScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Animated.View style={savePressAnimStyle}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.saveButtonText}>Sauvegarder</Text>
                  )}
                </LinearGradient>
              </Animated.View>
            </Pressable>

            <Pressable
              style={styles.signOutButton}
              onPress={handleSignOut}
              disabled={signingOut}
              onPressIn={() => { signOutScale.value = withSpring(0.97, { damping: 15 }); }}
              onPressOut={() => { signOutScale.value = withSpring(1, { damping: 12 }); }}
            >
              <Animated.View style={signOutPressAnimStyle}>
                {signingOut ? (
                  <ActivityIndicator color={colors.text.secondary} />
                ) : (
                  <Text style={styles.signOutText}>Se déconnecter</Text>
                )}
              </Animated.View>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  topBar: {
    paddingBottom: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  backButtonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  currentAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  currentAvatarRing: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    // No padding — same pattern as avatarRing in HomeScreen.
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  currentAvatarInner: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  currentAvatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    // Scale up to fill the circle — character PNGs have transparent padding around them
    transform: [{ scale: 1.3 }],
  },
  currentAvatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentAvatarPlaceholderText: {
    fontSize: typography.size.xl,
    color: colors.text.muted,
    fontWeight: typography.weight.bold,
  },
  currentAvatarHint: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.text.muted,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.lg,
    color: colors.text.primary,
  },
  saveButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  saveButtonGradient: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  signOutButton: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.xxxl,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: typography.size.md,
    color: colors.semantic.error,
    fontWeight: typography.weight.medium,
  },
});
