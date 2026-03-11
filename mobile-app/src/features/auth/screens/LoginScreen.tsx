import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '@/theme/theme';
import {
  signInWithEmail,
  signUpWithEmail,
  hydrateStoreFromProfile,
} from '@/services/authService';
import { useAppStore } from '@/store';
import type { AuthError } from '@supabase/supabase-js';

/** Map Supabase auth errors to user-friendly French messages. */
function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return '';
  const code = (error as AuthError & { code?: string }).code ?? '';
  const msg = (error.message ?? '').toLowerCase();
  if (code === 'user_already_registered' || msg.includes('already registered') || msg.includes('already exists')) {
    return 'Un compte existe déjà avec cet email. Connecte-toi ou utilise un autre email.';
  }
  if (code === 'invalid_credentials' || msg.includes('invalid login') || msg.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  if (code === 'weak_password' || msg.includes('password') && (msg.includes('6') || msg.includes('least'))) {
    return 'Le mot de passe doit faire au moins 6 caractères.';
  }
  if (code === 'email_not_confirmed') {
    return 'Confirme ton email en cliquant sur le lien envoyé, puis reconnecte-toi.';
  }
  if (msg.includes('network') || msg.includes('fetch') || code === 'network_error') {
    return 'Pas de connexion. Vérifie ton internet et réessayez.';
  }
  if (msg.includes('rate') || msg.includes('too many') || code === 'over_request_rate_limit') {
    return 'Trop de tentatives. Réessayez dans quelques minutes.';
  }
  if (msg.includes('email')) {
    return 'Adresse email invalide.';
  }
  return 'Une erreur est survenue. Réessayez.';
}

const AVATAR_SIZE = 96;

/**
 * Sign up view: avatar that "talks", welcome message with name, email + password + confirm.
 */
function SignUpView({
  heroName,
  avatarImageUrl,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  setError,
  successMessage,
  loading,
  onSubmit,
  onSwitchToSignIn,
}: {
  heroName: string;
  avatarImageUrl: string | null;
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  error: string | null;
  setError: (s: string | null) => void;
  successMessage: string | null;
  loading: boolean;
  onSubmit: () => void;
  onSwitchToSignIn: () => void;
}) {
  const hasOnboardingData = !!(avatarImageUrl || (heroName && heroName.trim()));
  const displayName = heroName.trim() || 'créateur';

  return (
    <ScrollView
      contentContainerStyle={styles.signUpScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.avatarSection}>
        {hasOnboardingData ? (
          <>
            <View style={styles.avatarRing}>
              {avatarImageUrl ? (
                <Image source={{ uri: avatarImageUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>?</Text>
                </View>
              )}
            </View>
            <View style={styles.bubbleContainer}>
              <View style={styles.speechBubble}>
                <Text style={styles.speechBubbleText}>
                  <Text style={styles.speechBubbleName}>{displayName}, </Text>
                  bienvenue dans ce monde de magie. En créant ton compte, tu deviens un vrai créateur :
                  tes histoires et ton avatar seront sauvegardés pour toujours.
                </Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.welcomeMessageOnly}>
            <View style={styles.speechBubble}>
              <Text style={styles.welcomeMessageTitle}>Deviens un vrai créateur</Text>
              <Text style={styles.speechBubbleText}>
                Crée ton compte pour sauvegarder tes histoires, débloquer des mondes et garder ton avatar. Bienvenue dans l’aventure.
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeIn.delay(250)} style={styles.formBlock}>
        <Text style={styles.formTitle}>Créer mon compte</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text.muted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe (6 caractères min.)"
          placeholderTextColor={colors.text.muted}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={colors.text.muted}
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
          secureTextEntry
          editable={!loading}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
        <Pressable
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.primaryBtnText}>Devenir créateur</Text>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.switchModeBtn} onPress={onSwitchToSignIn} disabled={loading}>
          <Text style={styles.switchModeText}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

/**
 * Sign in view: distinct layout, short message, email + password.
 */
function SignInView({
  email,
  setEmail,
  password,
  setPassword,
  error,
  setError,
  loading,
  onSubmit,
  onSwitchToSignUp,
}: {
  email: string;
  setEmail: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  error: string | null;
  setError: (s: string | null) => void;
  loading: boolean;
  onSubmit: () => void;
  onSwitchToSignUp: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.signInScroll}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.duration(400)} style={styles.signInHeader}>
        <Text style={styles.signInEmoji}>✨</Text>
        <Text style={styles.signInTitle}>Content de te revoir</Text>
        <Text style={styles.signInSubtitle}>
          Connecte-toi pour retrouver tes histoires et ton avatar.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200)} style={styles.formBlock}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.text.muted}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.text.muted}
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry
          editable={!loading}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Pressable
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          onPress={onSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.primaryBtnText}>Se connecter</Text>
            )}
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.switchModeBtn} onPress={onSwitchToSignUp} disabled={loading}>
          <Text style={styles.switchModeText}>Pas encore de compte ? Créer un compte</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

/**
 * Login / sign up screen. Two distinct UIs: sign up (avatar + welcome) and sign in (minimal).
 */
export function LoginScreen() {
  const params = useLocalSearchParams<{ from?: string; mode?: string }>();
  const fromOnboarding = params.from === 'onboarding';
  const wantSignIn = params.mode === 'signin';
  const insets = useSafeAreaInsets();
  const heroProfile = useAppStore((state) => state.heroProfile);

  const [mode, setMode] = useState<'signin' | 'signup'>(() =>
    wantSignIn ? 'signin' : fromOnboarding ? 'signup' : 'signin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [mode]);

  const runSignUp = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Indiquez votre email.');
      return;
    }
    if (!password) {
      setError('Indiquez un mot de passe.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const result = await signUpWithEmail(trimmed, password);
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }
      if (result.session) {
        await hydrateStoreFromProfile();
        router.replace('/(tabs)');
        return;
      }
      if (result.user && !result.session) {
        setSuccessMessage('Compte créé. Tu peux te connecter avec ton email et ton mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  const runSignIn = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Indiquez votre email.');
      return;
    }
    if (!password) {
      setError('Indiquez votre mot de passe.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const result = await signInWithEmail(trimmed, password);
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }
      if (result.session) {
        await hydrateStoreFromProfile();
        router.replace('/(tabs)');
      } else {
        setError('Impossible de te connecter. Vérifie ton email et ton mot de passe.');
      }
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const switchMode = useCallback(() => {
    setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
    setError(null);
    setSuccessMessage(null);
  }, []);

  const paddingStyle = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.xl,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, paddingStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <LinearGradient
        colors={
          mode === 'signup'
            ? [colors.surface, colors.background]
            : [colors.background, colors.surface]
        }
        style={StyleSheet.absoluteFill}
      />
      {mode === 'signup' ? (
        <SignUpView
          heroName={heroProfile?.name ?? ''}
          avatarImageUrl={heroProfile?.avatarImageUrl ?? null}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          error={error}
          setError={setError}
          successMessage={successMessage}
          loading={loading}
          onSubmit={runSignUp}
          onSwitchToSignIn={switchMode}
        />
      ) : (
        <SignInView
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          error={error}
          setError={setError}
          loading={loading}
          onSubmit={runSignIn}
          onSwitchToSignUp={switchMode}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  signUpScroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  signInScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarRing: {
    width: AVATAR_SIZE + 16,
    height: AVATAR_SIZE + 16,
    borderRadius: (AVATAR_SIZE + 16) / 2,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 3,
    borderColor: colors.primary,
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
    fontSize: typography.size.display,
    color: colors.text.muted,
    fontWeight: typography.weight.bold,
  },
  bubbleContainer: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    maxWidth: 320,
  },
  welcomeMessageOnly: {
    paddingHorizontal: spacing.md,
    maxWidth: 320,
    width: '100%',
  },
  welcomeMessageTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  speechBubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  speechBubbleText: {
    fontSize: typography.size.md,
    lineHeight: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  speechBubbleName: {
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },
  formBlock: {
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  formTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  signInHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  signInEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  signInTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.size.md,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: typography.size.sm,
    color: colors.semantic.success,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  primaryBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryBtnText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  switchModeBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  switchModeText: {
    fontSize: typography.size.md,
    color: colors.text.link,
    fontWeight: typography.weight.medium,
  },
});
