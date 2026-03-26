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
  TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedPressable } from '@/shared/AnimatedPressable';
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

// ─── AuthInput ────────────────────────────────────────────────────────────────

type AuthInputProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  editable?: boolean;
  showToggle?: boolean;
};

function AuthInput({
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = 'none',
  editable = true,
  showToggle = false,
}: AuthInputProps) {
  const [secure, setSecure] = useState(secureTextEntry);
  const borderAnim = useSharedValue(0); // 0 = blur, 1 = focus
  const scaleAnim = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1 ? colors.primary : colors.border,
    transform: [{ scale: scaleAnim.value }],
  }));

  const onFocus = () => {
    borderAnim.value = withTiming(1, { duration: 200 });
    scaleAnim.value = withSpring(1.01, { damping: 14 });
  };

  const onBlur = () => {
    borderAnim.value = withTiming(0, { duration: 200 });
    scaleAnim.value = withSpring(1, { damping: 14 });
  };

  return (
    <Animated.View style={[styles.authInputContainer, containerStyle]}>
      <Text style={styles.authInputIcon}>{icon}</Text>
      <TextInput
        style={styles.authInputField}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {showToggle && (
        <Pressable hitSlop={8} onPress={() => setSecure((s) => !s)} style={styles.authInputToggle}>
          <Text style={styles.authInputToggleIcon}>{secure ? '👁' : '🙈'}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── ErrorChip ────────────────────────────────────────────────────────────────

function ErrorChip({ error }: { error: string | null }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSpring(0, { damping: 16 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(8, { duration: 200 });
      const timeout = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.errorChip, animStyle]}>
      <Text style={styles.errorChipIcon}>⚠</Text>
      <Text style={styles.errorChipText}>{error}</Text>
    </Animated.View>
  );
}

// ─── SuccessMessageCard ───────────────────────────────────────────────────────

/** Animated success card shown after account creation. */
function SuccessMessageCard({ message }: { message: string }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSequence(
      withSpring(1.05, { damping: 12 }),
      withSpring(1, { damping: 15 })
    );
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      {/* TODO: replace rgba with theme token semantic.successLight once added */}
      <Animated.View style={[styles.successCard, animatedStyle]}>
        {/* TODO: replace width/height 40 with theme token once spacing supports it */}
        <View style={styles.successIconWrap}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successCardTitle}>Compte créé</Text>
        <Text style={styles.successCardMessage}>{message}</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── AvatarSection ────────────────────────────────────────────────────────────

function AvatarSection({
  avatarImageUrl,
  displayName,
}: {
  avatarImageUrl: string | null;
  displayName: string;
}) {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    let active = true;
    function pulse() {
      if (!active) return;
      pulseScale.value = withSequence(
        withTiming(1.04, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      );
      setTimeout(pulse, 2500);
    }
    pulse();
    return () => { active = false; };
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.avatarSection}>
      <Animated.View style={[styles.avatarRing, pulseStyle]}>
        {avatarImageUrl ? (
          <Image source={{ uri: avatarImageUrl }} style={styles.avatarImage} resizeMode="cover" />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>?</Text>
          </View>
        )}
      </Animated.View>
      <View style={styles.bubbleContainer}>
        {/* Triangle pointing up toward avatar */}
        <View style={styles.speechBubbleArrow} />
        <View style={styles.speechBubble}>
          <Text style={styles.speechBubbleText}>
            <Text style={styles.speechBubbleName}>{displayName}, </Text>
            bienvenue dans ce monde de magie. En créant ton compte, tu deviens un vrai créateur :
            tes histoires et ton avatar seront sauvegardés pour toujours.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── WelcomeBanner ────────────────────────────────────────────────────────────

function WelcomeBanner() {
  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.avatarSection}>
      <View style={styles.welcomeMessageOnly}>
        <View style={styles.speechBubble}>
          <Text style={styles.welcomeMessageTitle}>Deviens un vrai créateur</Text>
          <Text style={styles.speechBubbleText}>
            Crée ton compte pour sauvegarder tes histoires, débloquer des mondes et garder ton avatar. Bienvenue dans l'aventure.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── SignInHeader ─────────────────────────────────────────────────────────────

function SignInHeader() {
  return (
    <View style={styles.signInHeader}>
      <Animated.View entering={FadeInDown.duration(350).delay(0)}>
        <View style={styles.signInBadge}>
          <Text style={styles.signInBadgeText}>✨ Bon retour</Text>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(350).delay(80)}>
        <Text style={styles.signInTitle}>Content de te revoir</Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(350).delay(160)}>
        <Text style={styles.signInSubtitle}>
          Connecte-toi pour retrouver tes histoires et ton avatar.
        </Text>
      </Animated.View>
    </View>
  );
}

// ─── SignUpView ───────────────────────────────────────────────────────────────

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
      {hasOnboardingData ? (
        <AvatarSection avatarImageUrl={avatarImageUrl} displayName={displayName} />
      ) : (
        <WelcomeBanner />
      )}

      <Animated.View entering={FadeIn.delay(250)} style={styles.formBlock}>
        <Text style={styles.formTitle}>Créer mon compte</Text>
        <AuthInput
          icon="📧"
          placeholder="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <AuthInput
          icon="🔒"
          placeholder="Mot de passe (6 caractères min.)"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry
          showToggle
          editable={!loading}
        />
        <AuthInput
          icon="🔒"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
          secureTextEntry
          showToggle
          editable={!loading}
        />
        <ErrorChip error={error} />
        {successMessage ? <SuccessMessageCard message={successMessage} /> : null}
        <AnimatedPressable
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
        </AnimatedPressable>
        <Pressable style={styles.switchModeBtn} onPress={onSwitchToSignIn} disabled={loading}>
          <Text style={styles.switchModeText}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// ─── SignInView ───────────────────────────────────────────────────────────────

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
      <SignInHeader />

      <Animated.View entering={FadeIn.delay(260)} style={styles.formBlock}>
        <AuthInput
          icon="📧"
          placeholder="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <AuthInput
          icon="🔒"
          placeholder="Mot de passe"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(null); }}
          secureTextEntry
          showToggle
          editable={!loading}
        />
        <ErrorChip error={error} />
        <AnimatedPressable
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
        </AnimatedPressable>
        <Pressable style={styles.switchModeBtn} onPress={onSwitchToSignUp} disabled={loading}>
          <Text style={styles.switchModeText}>Pas encore de compte ? Créer un compte</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────

export function LoginScreen() {
  const params = useLocalSearchParams<{ from?: string; mode?: string }>();
  const fromOnboarding = params.from === 'onboarding';
  const wantSignIn = params.mode === 'signin';
  const targetAfterAuth = params.from === 'paywall' ? '/paywall' : '/(tabs)';
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
      setError("L'adresse email est requise.");
      return;
    }
    if (!password) {
      setError('Le mot de passe est requis.');
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
      if (__DEV__) {
        console.log('signUp flow:', { hasError: !!result.error, hasSession: !!result.session, hasUser: !!result.user });
      }
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }
      if (result.session) {
        await hydrateStoreFromProfile();
        router.replace(targetAfterAuth as any);
        return;
      }
      if (result.user && !result.session) {
        setSuccessMessage('Compte créé. Tu peux te connecter avec ton email et ton mot de passe.');
        setTimeout(async () => {
          const retry = await signInWithEmail(trimmed, password);
          if (retry.session) {
            await hydrateStoreFromProfile();
            router.replace(targetAfterAuth as any);
          }
        }, 2800);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  const runSignIn = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("L'adresse email est requise.");
      return;
    }
    if (!password) {
      setError('Le mot de passe est requis.');
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
        router.replace(targetAfterAuth as any);
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
            ? [colors.surface, colors.background, colors.surfaceElevated]
            : [colors.background, colors.surface, colors.background]
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Scrolls
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

  // ── Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarRing: {
    width: AVATAR_SIZE + spacing.lg,
    height: AVATAR_SIZE + spacing.lg,
    borderRadius: (AVATAR_SIZE + spacing.lg) / 2,
    padding: spacing.sm,
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
    alignItems: 'center',
  },
  speechBubbleArrow: {
    // Triangle pointing upward toward the avatar using border-trick
    width: 0,
    height: 0,
    borderLeftWidth: spacing.md,
    borderRightWidth: spacing.md,
    borderBottomWidth: spacing.md,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.border,
    marginBottom: -1, // overlap 1px to hide gap
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
    lineHeight: spacing.xl,
    color: colors.text.primary,
    textAlign: 'center',
  },
  speechBubbleName: {
    fontWeight: typography.weight.bold,
    color: colors.primary,
  },

  // ── Form block
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

  // ── AuthInput
  authInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    // shadow for focused depth
    ...shadows.sm,
  },
  authInputIcon: {
    fontSize: typography.size.lg,
    marginRight: spacing.sm,
  },
  authInputField: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  authInputToggle: {
    paddingLeft: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authInputToggleIcon: {
    fontSize: typography.size.lg,
  },

  // ── ErrorChip
  errorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,83,80,0.10)',
    borderWidth: 1,
    borderColor: colors.semantic.error,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  errorChipIcon: {
    fontSize: typography.size.md,
    marginRight: spacing.xs,
    color: colors.semantic.error,
  },
  errorChipText: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    flexShrink: 1,
  },

  // ── SuccessCard
  // TODO: replace rgba values with theme tokens semantic.successLight / semantic.successBorder once added
  successCard: {
    backgroundColor: 'rgba(102, 187, 106, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(102, 187, 106, 0.4)',
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  // TODO: replace 40/20 with spacing token once a suitable one exists
  successIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.semantic.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  successIconText: {
    fontSize: typography.size.xl,
    color: colors.text.inverse,
    fontWeight: typography.weight.bold,
  },
  successCardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  successCardMessage: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: spacing.xl,
  },

  // ── SignIn header
  signInHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  signInBadge: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  signInBadgeText: {
    fontSize: typography.size.md,
    fontFamily: typography.family.accent,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  signInTitle: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  signInSubtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.size.md * 1.5,
  },

  // ── Primary button
  primaryBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  primaryBtnGradient: {
    paddingVertical: spacing.lg,
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

  // ── Switch mode link
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
