# Authentication System — MangaKids (Supabase + React Native Expo)

This document describes the complete authentication setup for the mobile app: Supabase project configuration, database schema, triggers, RLS, client code, auth service, login screen, session persistence, account recovery, security, and architecture.

---

## 1. Supabase setup

### 1.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → choose organization, name, database password, region.
3. Wait for the project to be ready. Note the **Project URL** and **anon public** key (Settings → API).

### 1.2 Enable Authentication

1. In the dashboard: **Authentication** → **Providers**.
2. **Email** is enabled by default.

### 1.3 Email + Password

1. **Authentication** → **Providers** → **Email**.
2. Enable **Email**.
3. **Disable "Confirm email"** so that account creation works without verification and data is persisted immediately.
   - In the dashboard: **Authentication** (left sidebar) → **Providers** → open **Email**.
   - Find the option **"Confirm email"** and turn it **OFF**.
   - If this is left ON, sign-up creates the user but returns no session, and retry sign-in returns **"Invalid login credentials"** until the user confirms their email. For the app to get a session right after sign-up, keep it OFF.
4. Click **Save**.

### 1.4 OAuth providers (Google, Apple)

**Google**

1. **Authentication** → **Providers** → **Google**.
2. Enable the provider.
3. In [Google Cloud Console](https://console.cloud.google.com/): create OAuth 2.0 credentials (Android/iOS or Web). For mobile, you typically use a Web client and redirect URI.
4. Copy **Client ID** and **Client Secret** into Supabase.
5. **Redirect URL** for mobile: add the same URL you use in the app (see below).

**Apple**

1. **Authentication** → **Providers** → **Apple**.
2. Enable the provider.
3. In [Apple Developer](https://developer.apple.com/): create a **Sign in with Apple** identifier and a **Services ID**. Configure the redirect URL and key.
4. Enter **Services ID**, **Secret Key**, **Key ID**, **Team ID**, **Bundle ID** in Supabase.

### 1.5 Redirect URLs for mobile (Expo)

Supabase needs to allow redirects back to the app.

1. **Authentication** → **URL Configuration**.
2. Add to **Redirect URLs**:
   - Development: `mobileapp://auth/callback` (or your `app.json` scheme + path).
   - Production: same scheme, e.g. `mobileapp://auth/callback`.
3. The app uses this URL when opening the OAuth flow and when receiving the redirect (see `EXPO_PUBLIC_AUTH_REDIRECT_URL` or default `mobileapp://auth/callback` in the code).
4. Ensure `app.json` has `"scheme": "mobileapp"` (or your chosen scheme) so the OS opens the app on that URL.

---

## 2. Database schema

Table **`public.profiles`** extends `auth.users`: one row per user, created by trigger on sign-up.

| Column            | Type         | Description |
|-------------------|--------------|-------------|
| `id`              | UUID, PK, FK → auth.users(id) ON DELETE CASCADE | User id; links to Auth. |
| `email`           | TEXT         | Denormalized from Auth for quick reads. |
| `username`        | TEXT         | Display name (optional). |
| `avatar_url`      | TEXT         | Profile picture URL (e.g. Storage or external). |
| `stars_balance`   | INTEGER DEFAULT 0 | In-app stars; synced on login and after actions. |
| `created_at`      | TIMESTAMPTZ  | Row creation. |
| `updated_at`      | TIMESTAMPTZ  | Last update. |
| `last_login_at`   | TIMESTAMPTZ  | Last sign-in (analytics/support). |
| `provider`        | TEXT         | `email` \| `google` \| `apple`. |
| `is_child_account`| BOOLEAN DEFAULT false | Legacy field, unused. |

SQL is in `mobile-app/supabase/migrations/001_profiles_auth.sql`.

---

## 3. SQL migrations

Run in the Supabase Dashboard **SQL Editor** (in order):

1. **001_profiles_auth.sql** — Creates `public.profiles`, trigger `on_auth_user_created` on `auth.users`, RLS (SELECT, UPDATE, INSERT for own row), and `updated_at` trigger. New signups will get a profile row automatically.

2. **002_backfill_profiles_from_auth.sql** — Run once to create profile rows for users already in `auth.users` but missing from `profiles` (e.g. signups before the trigger existed). Safe to run multiple times.

If the new user is still not persisted in `profiles`, run both scripts in the SQL Editor and ensure there are no errors in the execution log.

---

## 4. Trigger setup

**Function** `public.handle_new_user()`:

- Runs `AFTER INSERT ON auth.users`.
- Reads `NEW.email` and provider from `NEW.raw_app_meta_data`.
- Inserts one row into `public.profiles` with `id`, `email`, `provider`, `created_at`, `updated_at`.
- Uses `ON CONFLICT (id) DO NOTHING` to avoid duplicate inserts.

**Trigger** `on_auth_user_created`:

- `AFTER INSERT ON auth.users`
- `FOR EACH ROW`
- `EXECUTE FUNCTION public.handle_new_user()`

---

## 5. RLS policies

- **RLS** is enabled on `public.profiles`.
- **SELECT**: `auth.uid() = id` (user sees only their row).
- **UPDATE**: `auth.uid() = id` for both `USING` and `WITH CHECK`.
- **INSERT**: trigger creates the row (SECURITY DEFINER). Policy `profiles_insert_own` (auth.uid() = id) allows client to create own row on first sign-in if trigger did not run (e.g. migration added after sign-up).

---

## 6. Supabase client (React Native)

File: `mobile-app/src/services/supabase.ts`.

- Uses `@supabase/supabase-js` and `AsyncStorage` for persistent session storage.
- Options:
  - `storage: AsyncStorage` — session survives app restarts.
  - `autoRefreshToken: true` — refresh token before expiry.
  - `persistSession: true` — persist to storage.
  - `detectSessionInUrl: false` — no URL used for session in native.

Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## 7. Auth service

File: `mobile-app/src/services/authService.ts`.

| Function | Role |
|----------|------|
| `signUpWithEmail(email, password)` | Create account (email confirmation if enabled). |
| `signInWithEmail(email, password)` | Sign in with email/password. |
| `signInWithGoogle(redirectUrl)` | Returns OAuth URL; caller opens it (e.g. WebBrowser). |
| `signInWithApple(redirectUrl)` | Same for Apple. |
| `setSessionFromOAuthRedirectUrl(url)` | After redirect: parse URL, call `setSession`. |
| `signOut()` | Sign out. |
| `getCurrentUser()` | Current user (async). |
| `restoreSession()` | On app start: `getSession()` (from storage, refresh if needed). |
| `onAuthStateChange(callback)` | Subscribe to auth events. |
| `hydrateStoreFromProfile()` | Fetch profile, update `last_login_at`, sync stars into Zustand. |

**Session management**

- Session is stored in AsyncStorage by the Supabase client.
- `access_token` (JWT) has short expiry; `refresh_token` is used to get a new one.
- `getSession()` returns the current session and triggers refresh when needed.
- After OAuth redirect, the app parses the URL and calls `setSession({ access_token, refresh_token })`.

---

## 8. Login screen

- **Location**: `mobile-app/src/features/auth/screens/LoginScreen.tsx`; route `app/(auth)/login.tsx`.
- **Fields**: Email, Password.
- **Actions**: Sign up, Login, Continue with Google, Continue with Apple (iOS).
- **Flow**: Uses `expo-web-browser` for OAuth (open URL, then handle redirect URL and call `setSessionFromOAuthRedirectUrl`). After success, calls `hydrateStoreFromProfile()` and `router.replace('/(tabs)')`.
- **Redirect URL**: `EXPO_PUBLIC_AUTH_REDIRECT_URL` or default `mobileapp://auth/callback`.

---

## 9. Session persistence and restore on app start

- **Persistence**: Supabase client stores the session in AsyncStorage; it is restored on next launch.
- **On app start**:
  1. **Auth gate** (`app/index.tsx`) runs first.
  2. It calls `restoreSession()` (reads from storage, refreshes if needed).
  3. If there is a session:
     - Call `hydrateStoreFromProfile()` (fetch profile, update `last_login_at`, set stars in Zustand).
     - `router.replace('/(tabs)')`.
  4. If there is no session: `router.replace('/(auth)/login')`.
- **After login** (email or OAuth): same `hydrateStoreFromProfile()` then `router.replace('/(tabs)')`.

So: one session source (Supabase + AsyncStorage), one place that hydrates profile and stars (Zustand) on start and after login.

---

## 10. Account recovery after reinstall

- User deletes the app and installs again.
- On first open, there is no local session (AsyncStorage is empty).
- Auth gate sees no session → redirects to login.
- User signs in (email, Google, or Apple). Supabase recognizes the user and returns the same `auth.users` id.
- Trigger has already created (or existing) `profiles` row.
- `hydrateStoreFromProfile()` loads `profiles` (including `stars_balance`) and writes stars into the Zustand store.
- **Stars** and **profile** are restored from Supabase. **Story progress** and other app state can be restored the same way by persisting them in Supabase (e.g. a `user_stories` or `user_progress` table) and loading them in `hydrateStoreFromProfile()` or a similar step.

---

## 11. Security best practices

- **Duplicate profiles**: Trigger uses `ON CONFLICT (id) DO NOTHING`; only one profile per user.
- **Protect user data**: RLS ensures users can only read/update their own `profiles` row; use anon key only in the app, never the service role.
- **Expired sessions**: `autoRefreshToken: true` and `getSession()` handle refresh; on refresh failure the app can redirect to login.
- **Profile updates**: All updates go through `updateProfile(userId, updates)`; RLS restricts to `auth.uid() = id`. Validate and sanitize inputs; avoid updating `id` or sensitive fields from client.
- **Sync stars to server**: To persist star changes, call `profileService.syncStarsToServer(userId, starsBalance)` when the balance changes (e.g. after add/spend) or periodically/on background, so a reinstall restores the latest balance.

---

## 12. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile App (React Native / Expo)                            │
│  - Auth gate (index) → restoreSession → redirect             │
│  - Login screen → signIn / signUp / OAuth → setSession        │
│  - After login: hydrateStoreFromProfile() → (tabs)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Auth                                               │
│  - auth.users (email, OAuth)                                  │
│  - Session in AsyncStorage, auto refresh                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  public.profiles (trigger on INSERT auth.users)               │
│  - id, email, username, avatar_url, stars_balance, provider   │
│  - RLS: read/update own row only                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Zustand store                                               │
│  - stars (from profile.stars_balance on restore/login)        │
│  - heroProfile, stories, etc. (optional sync from DB)         │
└─────────────────────────────────────────────────────────────┘
```

---

## Optional: Sign out

Add a "Se déconnecter" (or "Déconnexion") button (e.g. in ProfileScreen) that:

1. Calls `authService.signOut()`.
2. Optionally clears local state (e.g. hero profile, stories) if you do not want to keep it until next login.
3. Redirects to login: `router.replace('/(auth)/login')`.

---

## Dev note: session persistence

In `app/_layout.tsx`, `DEV_CLEAR_STORAGE` clears AsyncStorage on cold start when `__DEV__` is true. That also removes the Supabase session. To test auth persistence (e.g. session restore after app restart), set `DEV_CLEAR_STORAGE = false` or comment out the clear logic.

---

## Troubleshooting: sign-up works but no session / "Invalid login credentials"

If the app logs show **hasUser: true, hasSession: false** and **retry signIn failed Invalid login credentials**:

- **Cause:** "Confirm email" is enabled in Supabase. The user is created in `auth.users` but cannot get a session until they click the confirmation link in the email.
- **Fix:** Supabase Dashboard → **Authentication** → **Providers** → **Email** → turn **OFF** "Confirm email" → **Save**. Then try signing up with a new email (or delete the test user in Authentication → Users and try again).

---

## Optional: persist stars when they change

To keep `profiles.stars_balance` in sync with the app:

1. When the user is signed in, after any action that changes stars (add, spend, reward), call:
   - `syncStarsToServer(userId, currentStars)` from `profileService`.
2. Get `userId` from `getCurrentUser()` (or from a small auth context/store that holds the current user id).

This way, after a reinstall and login, `hydrateStoreFromProfile()` will load the last saved balance.
