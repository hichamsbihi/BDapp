import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Supabase Auth session management:
 * - Session is stored in AsyncStorage (see supabase.ts) and persists across app restarts.
 * - access_token is JWT with short expiry; refresh_token is used to get new access_token.
 * - autoRefreshToken: true in client options so Supabase refreshes the token automatically.
 * - restoreSession() calls getSession() which reads from storage and validates/refreshes if needed.
 */

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up with email. Session is returned when "Confirm email" is OFF in Supabase
 * (Authentication > Providers > Email > Confirm email = OFF). If no session, we retry sign-in.
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (__DEV__) console.log('signUp: sending to Supabase Auth', { email });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: undefined },
  });
  if (__DEV__) {
    console.log('signUp: response', {
      hasUser: !!data?.user,
      userId: data?.user?.id ?? null,
      hasSession: !!data?.session,
      error: error?.message ?? null,
      errorCode: error?.code ?? null,
    });
  }
  if (error) {
    return { user: null, session: null, error };
  }
  if (data?.session) {
    return { user: data.user ?? null, session: data.session, error: null };
  }
  if (data?.user) {
    const delays = [0, 1500, 3000];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (__DEV__ && attempt > 0) console.log('signUp: retry signIn attempt', attempt + 1);
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
      }
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (__DEV__ && signInError) {
        console.log('signUp: retry signIn failed', signInError.message, signInError.code);
      }
      if (!signInError && signInData?.session) {
        if (__DEV__) console.log('signUp: got session on retry');
        return { user: signInData.user ?? null, session: signInData.session, error: null };
      }
    }
    if (__DEV__) {
      console.log(
        'signUp: no session after retries. Disable email confirmation: Supabase Dashboard > Authentication > Providers > Email > turn OFF "Confirm email"'
      );
    }
  }
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: null,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: error ?? null,
  };
}

/**
 * Returns the URL to open for Google OAuth.
 * Caller must open this URL (e.g. with WebBrowser.openAuthSessionAsync) and then
 * handle the redirect back to the app with the tokens (see handleOAuthRedirect).
 */
export async function signInWithGoogle(redirectUrl: string): Promise<{ url: string; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });
  return {
    url: data?.url ?? '',
    error: error ?? null,
  };
}

/**
 * Returns the URL to open for Apple OAuth.
 * Caller must open this URL and then handle the redirect (see handleOAuthRedirect).
 */
export async function signInWithApple(redirectUrl: string): Promise<{ url: string; error: AuthError | null }> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });
  return {
    url: data?.url ?? '',
    error: error ?? null,
  };
}

/**
 * Call this when the app is opened via the OAuth redirect URL (e.g. myapp://auth/callback#...).
 * Parses the URL and sets the session from the hash fragment.
 */
export async function setSessionFromOAuthRedirectUrl(url: string): Promise<AuthResult> {
  const hash = url.includes('#') ? url.split('#')[1] : '';
  if (!hash) {
    return { user: null, session: null, error: { message: 'No hash in redirect URL', name: 'AuthError' } as AuthError };
  }
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) {
    return {
      user: null,
      session: null,
      error: { message: 'Missing tokens in redirect URL', name: 'AuthError' } as AuthError,
    };
  }
  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: error ?? null,
  };
}

export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error ?? null };
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/**
 * Call on app start to restore session from AsyncStorage.
 * If a session exists, Supabase validates/refreshes it and returns it.
 */
export async function restoreSession(): Promise<AuthResult> {
  const { data: { session }, error } = await supabase.auth.getSession();
  return {
    user: session?.user ?? null,
    session: session ?? null,
    error: error ?? null,
  };
}

/**
 * Subscribe to auth state changes (e.g. sign in, sign out, token refresh).
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => callback(event, session)
  );
  return () => subscription.unsubscribe();
}

/**
 * Hydrate app store from server after login or app start.
 * - Ensures profile exists (retry once if needed); if profile is empty and we have local data, syncs local -> DB.
 * - Then loads profile into store (stars, unlocked universes, hero profile).
 */
export async function hydrateStoreFromProfile(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    if (__DEV__) console.log('hydrateStoreFromProfile: no user (no session)');
    return false;
  }
  if (__DEV__) console.log('hydrateStoreFromProfile: user present, ensuring profile', user.id);
  const { ensureProfile, fetchProfile, touchLastLogin, syncLocalToProfile } = await import('./profileService');
  const { fetchAvatarById } = await import('./avatarService');
  const rawProvider = user.app_metadata?.provider as string | undefined;
  const validProvider = ['email', 'google', 'apple'].includes(rawProvider ?? '') ? (rawProvider as 'email' | 'google' | 'apple') : 'email';

  let ensure = await ensureProfile(user.id, user.email ?? null, validProvider);
  if (ensure.error) {
    await new Promise((r) => setTimeout(r, 300));
    ensure = await ensureProfile(user.id, user.email ?? null, validProvider);
  }
  if (ensure.error) {
    if (__DEV__) console.log('hydrateStoreFromProfile: ensureProfile failed (e.g. server unreachable)', ensure.error.message);
    return false;
  }

  let profile = ensure.profile;
  const store = (await import('@/store')).useAppStore.getState();
  const heroProfile = store.heroProfile;

  if (!profile) {
    if (__DEV__) console.log('hydrateStoreFromProfile: no profile');
    return true;
  }

  const needsSync = !profile.username && heroProfile?.name;
  if (needsSync) {
    const syncErr = await syncLocalToProfile(user.id, {
      username: heroProfile.name ?? null,
      selected_avatar_id: heroProfile.avatarId ?? null,
      age: heroProfile.age ?? null,
      gender: heroProfile.gender ?? null,
      unlocked_universe_ids: store.unlockedUniverses ?? [],
      stars_balance: store.stars ?? 0,
    });
    if (__DEV__ && syncErr.error) console.log('syncLocalToProfile error:', syncErr.error.message);
    profile = (await fetchProfile(user.id)) ?? profile;
  }

  await touchLastLogin(user.id);
  store.setStarsFromServer(profile.stars_balance);
  store.setIsPremium(profile.is_premium ?? false);
  const fromServer = profile.unlocked_universe_ids ?? [];
  const currentLocal = store.unlockedUniverses ?? [];
  const merged = fromServer.length > 0
    ? [...new Set([...fromServer, ...currentLocal])]
    : currentLocal;
  store.setUnlockedUniverses(merged);

  const avatarId = profile.selected_avatar_id;
  let avatarImageUrl: string | undefined;
  let avatarCharacterName: string | undefined;
  if (avatarId) {
    const avatar = await fetchAvatarById(avatarId);
    if (avatar) {
      avatarImageUrl = avatar.imageUrl;
      avatarCharacterName = avatar.characterName;
    }
  }
  store.setHeroProfile({
    id: profile.id,
    name: profile.username ?? heroProfile?.name ?? '',
    age: profile.age ?? heroProfile?.age ?? 0,
    gender: (profile.gender as 'boy' | 'girl') ?? heroProfile?.gender ?? 'boy',
    avatarId: avatarId ?? heroProfile?.avatarId ?? '',
    avatarImageUrl,
    avatarCharacterName,
  });

  const { fetchUserStoryProgress, fetchUserCreatedStories } = await import('./syncService');
  const serverStories = await fetchUserCreatedStories(user.id);
  const progressRows = await fetchUserStoryProgress(user.id);
  const completedUniverseIds = new Set(serverStories.map((s) => s.universeId));
  store.setStoryProgressList(
    progressRows
      .filter((r) => !completedUniverseIds.has(r.universe_id))
      .map((r) => ({
        universeId: r.universe_id,
        currentPageNumber: r.current_page_number,
      }))
  );

  const serverIds = new Set(serverStories.map((s) => s.id));
  const localStories = store.stories ?? [];
  const localOnly = localStories.filter((s) => !serverIds.has(s.id));
  for (const story of localOnly) {
    const { saveCreatedStory } = await import('./syncService');
    await saveCreatedStory(user.id, story);
  }
  if (serverStories.length > 0 || localOnly.length > 0) {
    store.setStories([...serverStories, ...localOnly]);
  }

  return true;
}
