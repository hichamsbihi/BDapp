# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack
- Expo 54, React Native 0.81, expo-router (file-based routing)
- React 19.1, TypeScript strict
- Reanimated 4, Lottie (animations)
- Zustand (global state), Supabase (auth + DB)
- LinearGradient (expo-linear-gradient), SafeAreaContext
- GestureHandlerRootView (react-native-gesture-handler) — wraps entire app in `_layout.tsx`

## Commands
```bash
npx expo start          # Start dev server (scan QR with Expo Go)
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
npx expo start --web    # Web (limited support)
```
No test runner is configured — `react-test-renderer` is in devDeps but there's no jest config.

## App Boot Sequence
`app/index.tsx` (AuthGate) runs on every launch:
1. `restoreSession()` — reads Supabase session from AsyncStorage
2. If session: `hydrateStoreFromProfile()` — syncs DB → Zustand store (stars, unlocked universes, hero profile, stories), then navigates to `/(tabs)`
3. If no session or hydration fails: clear store, navigate to `/onboarding`

**Dev mode caveat:** `app/_layout.tsx` clears all AsyncStorage and signs out Supabase on every reload in `__DEV__` mode. This is intentional — every dev reload starts from a clean state.

## Folder Structure
```
app/               # Routes (expo-router)
  index.tsx        # Auth gate — boot entry point
  (auth)/          # Login
  (tabs)/          # Main tabs: home, library, profile
  onboarding/      # welcome → hero-info → avatar-select
  story/           # universe-select → start-select → paragraph → generating → page → completed
  paywall.tsx      # Modal
src/
  features/        # auth/, home/, onboarding/, story/, library/, paywall/ — each has screens + index.ts
  shared/          # AnimatedPressable, Button, Card, Badge, Avatar, Input, StarsBadge, StarsBadgeWithModal, StarsModal, NotEnoughStarsModal, ErrorFallback, Navbar, ScreenContainer, Loader, LottieAnimation
  services/        # authService, supabase, storyService, profileService, avatarService, syncService, assetService
  store/           # Zustand store (useAppStore) + selectors.ts (selector hooks)
  theme/           # theme.ts — single source of truth
  types/           # index.ts — all shared types
  constants/       # stars.ts (economy), magicWords.ts
  hooks/           # useStoreSync, useStoryData, useAvatars, useAnimations, useCountdownStatus
  data/            # avatars.ts (static fallback data)
  utils/           # ids.ts, pdfGenerator.ts
```

## Coding Conventions
- All colors via `colors.*` from `@/theme/theme` — no hardcoded hex
- All font sizes via `typography.size.*` — no raw numbers
- All spacing via `spacing.*` — no raw px values
- Animations: Reanimated 4 (`useSharedValue`, `useAnimatedStyle`) — no Animated API
- Press interactions: use `AnimatedPressable` from `@/shared/AnimatedPressable` — never use `pressed` callback style (e.g. `style={({ pressed }) => ...}`)
- Layout vs interactive animations: `entering={}` on outer `Animated.View`, `useAnimatedStyle` on inner — never both on the same view
- Navigation: `router.replace` / `router.push` from expo-router — no React Navigation
- State: Zustand (`useAppStore`) — no useState for global data
- Selector hooks: prefer `useStars()`, `useHeroProfile()` from `@/store/selectors` over `useAppStore(s => s.x)`
- French UI strings throughout — keep all user-facing text in French
- English code comments and console.log messages
- File exports: named exports in features, default re-export in route files
- Accessibility: `accessibilityRole` and `accessibilityLabel` on interactive + semantic components

## Zustand Store
Persisted to AsyncStorage (`story-app-storage`, version 4) via `zustand/middleware/persist`.

Key slices:
- `heroProfile` — selected avatar + name/age/gender
- `currentStory` — story being created (in-progress, not persisted)
- `stories` — completed stories library (persisted, synced to DB)
- Stars economy — `stars`, `unlockedUniverses`, `lastCountdownClaimDate`
- `isPremium`, `hasEverPurchased`, `hasCompletedOnboarding`, `storyProgressList`

Prefer the exported selector hooks (`useStars`, `useHeroProfile`, etc.) over `useAppStore(state => state.x)` for performance.

## Stars Economy
Defined in `src/constants/stars.ts`. Stars are a non-monetary in-app currency.
- **Costs:** unlock universe = 3, PDF export = 1
- **Rewards:** watch ad = 1, 12h countdown = 1 (no daily bonus, no story-complete reward)
- **Initial balance:** 6 (welcome gift)
- **Packs:** 10 = 2.99 EUR, 25 = 5.99, 60 = 9.99
- **First purchase promo:** small pack gives 20 stars (tracked by `hasEverPurchased`)
- **Premium lifetime:** 14.99 EUR — unlocks all, hides stars badge
- IAP packs are mocked behind `__DEV__`; not yet wired to a billing SDK

Stars are synced to `profiles.stars_balance` in Supabase via `syncService.syncStars()`.

## PDF Export
`exportAndSharePdf(story: Story, heroName?: string): Promise<string>` in `src/utils/pdfGenerator.ts`.
- Share message is dynamic: uses `heroName` if provided, falls back to "Un jeune auteur"
- Filename derived from story title via `sanitizeFilename()`
- Returns a local file URI; uses `expo-sharing` on Android, `Share.share` on iOS

## Supabase Tables
- `profiles` — extends auth.users; stores `stars_balance`, `selected_avatar_id`, `unlocked_universe_ids`, `is_premium`, hero fields (`username`, `age`, `gender`)
- `avatars` — frame-based avatar characters (`normal`, `blink`, `wink`, `happy` image URLs), `character_prompt`, `gender`. PK is TEXT.
- `universes` — story universes (locked client-side via `unlockedUniverses` in store). PK is TEXT.
- `story_starts` — possible openings per universe
- `story_paragraphs` — page content per universe + page_number (check: page_number 1-10)
- `narrative_choices` — branching choices per page, includes `next_page_number` for branching
- `user_story_progress` — current page per user+universe (upserted on each page advance)
- `user_choices` — recorded choices for replay/resume
- `user_created_stories` — completed stories (upserted by `story_client_id`)

## What NOT To Do
- Never hardcode colors, font sizes, or spacing — use theme tokens
- Never import from `react-native/Animated` — use Reanimated 4
- Never add new global state outside Zustand store
- Never bypass theme for gradients (add tokens to theme.ts instead)
- Never create new files without checking if a shared component already exists
- Never touch node_modules/, .expo/, or generated files
- Never put `entering` layout animation and `useAnimatedStyle` transform on the same Animated.View
- Never use `Pressable` with `({ pressed }) => ...` callback — use `AnimatedPressable`

## Theme Gaps (Known — Fix Before Adding)
- Gradient palettes (Paywall, StarsModal) not yet tokenized
- WelcomeScreen uses intentional creative overrides (`INK`, `GOLD`, `WARM_BROWN`) — these are manga-specific, not theme gaps
