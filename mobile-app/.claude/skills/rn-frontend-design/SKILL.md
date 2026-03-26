---
name: rn-frontend-design
description: >
  Guide la création d'interfaces React Native / Expo production-grade avec une direction esthétique
  forte. Rejette les patterns génériques. Utilise Reanimated 4 pour les animations, Pressable pour
  les interactions, expo-font pour la typo. Déclencher pour tout travail UI/design sur l'app mobile :
  nouveaux composants, refonte visuelle, amélioration animations, polish général.
---

This skill guides creation of distinctive, production-grade React Native / Expo interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides UI requirements: a component, screen, or flow to build or improve. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this screen/component solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Execute it with full intentionality.
- **Constraints**: Technical requirements (Expo 54, React Native 0.81, Reanimated 4, TypeScript strict).
- **Differentiation**: What makes this screen UNFORGETTABLE? What's the one thing a user will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code (React Native + Expo) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## React Native Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Load custom fonts via `expo-font` + `useFonts()` declared in `app/_layout.tsx`. Pair a distinctive display font with a refined body font. Never default to system fonts alone — they are generic. Always reference sizes via `typography.size.*` from `@/theme/theme`.
- **Color & Theme**: Commit to a cohesive aesthetic. All colors via `colors.*` from `@/theme/theme` — never hardcode hex. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. For gradients, use `expo-linear-gradient` (already installed).
- **Motion**: Use animations for effects and micro-interactions. Use **Reanimated 4** (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withSequence`, `withDelay`) for all animations — never the legacy `Animated` API. For complex multi-frame animations, prefer **Lottie** (`lottie-react-native`, already installed) over Reanimated. Focus on high-impact moments: one well-orchestrated screen entry with staggered reveals creates more delight than scattered micro-interactions.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Generous negative space OR controlled density. Use `spacing.*` from `@/theme/theme` — never raw px values.
- **Backgrounds & Visual Depth**: Create atmosphere. Use `expo-linear-gradient` for gradient backgrounds and overlays. Layer `View` components with opacity, border, and shadow for depth. Use `shadows.*` from `@/theme/theme`. Avoid flat, single-color screens.

NEVER produce generic React Native aesthetics: plain `View` + `Text` with no visual treatment, default blue touchable feedback, flat white screens, unpadded layouts, system font at size 16, or cookie-cutter card lists with no compositional intention.

Interpret creatively. No screen should look the same. Vary between light and dark treatments, distinct typographic hierarchies, different spatial rhythms.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate `StyleSheet` rules, layered Views, and Reanimated sequences. Minimalist designs need restraint, precision, and careful spacing. Elegance comes from executing the vision well.

## React Native Implementation Rules

### Styling
- All styles via `StyleSheet.create()` — no inline style objects except for dynamic values
- All colors via `colors.*` from `@/theme/theme`
- All font sizes via `typography.size.*`
- All spacing via `spacing.*`
- All border radii via `radius.*`
- All shadows via `shadows.*`

### Animations
```tsx
// Reanimated 4 — standard motion
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withDelay, withSequence } from 'react-native-reanimated';

const opacity = useSharedValue(0);
const scale = useSharedValue(0.92);
const animStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));
// Trigger:
opacity.value = withTiming(1, { duration: 400 });
scale.value = withSpring(1, { damping: 14 });

// Staggered entry:
opacity.value = withDelay(index * 80, withTiming(1, { duration: 350 }));

// Scroll-triggered:
const scrollY = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
const headerStyle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [0, 80], [1, 0]) }));
```

```tsx
// Lottie — complex multi-frame animations (prefer over Reanimated for illustrations)
import LottieView from 'lottie-react-native';
<LottieView source={require('@/assets/animations/success.json')} autoPlay loop={false} style={{ width: 120, height: 120 }} />
```

### Interactions
```tsx
// Pressable with pressed state — never TouchableOpacity
<Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={onPress}>
  {({ pressed }) => <Text style={[styles.label, pressed && styles.labelPressed]}>…</Text>}
</Pressable>
// Minimum touch target: 44x44 points — enforce via minWidth/minHeight or hitSlop
<Pressable hitSlop={8} style={styles.iconBtn}>…</Pressable>
```

### Safe Area & Layout
```tsx
// Always use insets — never hardcode top/bottom padding
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
<View style={{ paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }}>
```

### Platform Differences
```tsx
import { Platform } from 'react-native';
// Use only when visual behavior genuinely differs between iOS and Android
const shadowStyle = Platform.OS === 'ios'
  ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 }
  : { elevation: 4 };
```

### Gradients
```tsx
import { LinearGradient } from 'expo-linear-gradient';
// Backgrounds:
<LinearGradient colors={[colors.background, colors.surface]} style={StyleSheet.absoluteFill} />
// Overlays:
<LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.overlay} />
```

### Font Loading
```tsx
// Declare once in app/_layout.tsx
import { useFonts } from 'expo-font';
const [loaded] = useFonts({
  'DisplayFont-Bold': require('@/assets/fonts/DisplayFont-Bold.ttf'),
  'BodyFont-Regular': require('@/assets/fonts/BodyFont-Regular.ttf'),
});
// Reference in theme/theme.ts under typography.fontFamily.*
```

### Navigation
```tsx
import { router } from 'expo-router';
router.push('/story/reader');
router.replace('/(tabs)');
// Never use React Navigation directly
```

## What NOT to Do
- No `import { Animated } from 'react-native'` — use Reanimated 4
- No hardcoded hex, px values, or magic numbers — use theme tokens
- No `TouchableOpacity` — use `Pressable`
- No hardcoded `paddingTop: 44` or `paddingBottom: 34` — use `useSafeAreaInsets()`
- No hover states — not applicable on mobile, remove entirely
- No custom cursors — not applicable, omit
- No CSS, CSS variables, or web-only properties
- No touch targets smaller than 44×44 points
- No inline `style={{ color: '#FF0000' }}` — always `StyleSheet.create()`
