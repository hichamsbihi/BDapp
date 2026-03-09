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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { useAvatars } from '@/hooks/useAvatars';
import { ProfileAvatarGrid } from '../components/ProfileAvatarGrid';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import type { AvatarCharacter } from '@/types';

const AVATAR_SIZE = 72;

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

  const gender = heroProfile?.gender ?? 'boy';
  const { avatars, loading } = useAvatars(gender);

  useEffect(() => {
    if (heroProfile?.name) setName(heroProfile.name);
  }, [heroProfile?.id]);

  useEffect(() => {
    if (!avatars.length) return;
    const current = avatars.find((a) => a.id === heroProfile?.avatarId);
    if (current) setSelectedAvatar(current);
  }, [avatars, heroProfile?.avatarId]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateHeroProfile({
      name: trimmed,
      ...(selectedAvatar && {
        avatarId: selectedAvatar.id,
        avatarImageUrl: selectedAvatar.frames.normal,
        avatarCharacterName: selectedAvatar.characterName,
      }),
    });
    router.back();
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backRow} onPress={() => router.back()}>
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <Text style={styles.title}>Mon profil</Text>

          <View style={styles.section}>
            <Text style={styles.label}>Photo de profil</Text>
            <View style={styles.currentAvatarRow}>
              <View style={styles.currentAvatarRing}>
                {displayAvatarUrl ? (
                  <Image
                    source={{ uri: displayAvatarUrl }}
                    style={styles.currentAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.currentAvatarPlaceholder}>
                    <Text style={styles.currentAvatarPlaceholderText}>?</Text>
                  </View>
                )}
              </View>
              <Text style={styles.currentAvatarHint}>
                Choisis un avatar ci-dessous
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Choisir un avatar</Text>
            {loading ? (
              <Text style={styles.hint}>Chargement...</Text>
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
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
            onPress={handleSave}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </LinearGradient>
          </Pressable>
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
  backRow: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  backText: {
    fontSize: typography.size.md,
    color: colors.text.link,
    fontWeight: typography.weight.medium,
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
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  currentAvatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
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
  hint: {
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
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});
