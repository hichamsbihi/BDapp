---
name: rn-canvas-animations
description: >
  Crée des animations et effets visuels pour React Native : loaders Lottie, skeleton screens
  avec shimmer (Reanimated 4 + LinearGradient), transitions d'écrans, micro-interactions sur
  les composants. Déclencher pour tout loading state, animation UI, effet visuel, skeleton,
  transition entre écrans ou micro-interaction sur boutons/cards. Stack : lottie-react-native,
  Reanimated 4, expo-linear-gradient.
---

This skill implements production-grade animation patterns for React Native / Expo. No browser canvas, no PDF/PNG generation, no file output. All output is TypeScript React Native components using `lottie-react-native`, `Reanimated 4`, and `expo-linear-gradient`.

## Skill Workflow

1. User specifies which pattern they need + which screen or component is targeted
2. Read only the target file(s) — max 2 files before implementing
3. Implement the pattern with full TypeScript types
4. If the pattern will be reused across screens, create a reusable component in `src/components/ui/`

**Always check first**: does a similar animation component already exist in `src/components/`? Extend it rather than creating a duplicate.

---

## Global Rules (Apply to All Patterns)

```tsx
// ALWAYS respect reduced motion — import and check before animating
import { useReducedMotion } from 'react-native-reanimated'

const reduceMotion = useReducedMotion()
// If true: skip transitions, show content immediately, disable shimmer loops
const duration = reduceMotion ? 0 : 350
```

- All animations run on the **UI thread** — never call `.value =` inside a JS-thread callback without `runOnJS` isolation
- Use `withTiming`, `withSpring`, `withSequence`, `withRepeat`, `withDelay` — never `setTimeout` for animation sequencing
- All components fully typed with TypeScript
- Import Lottie JSON files with `require()` or typed `import` — never dynamic string paths

---

## Pattern 1 — Lottie Loader

**Use cases:** full-screen loading, button loading state, success/error feedback, empty states

**Lottie file storage:** `assets/animations/*.json`
**Source for free animations:** lottiefiles.com (search: loader, success, error, empty)

### Reusable `<LottieLoader />` component

```tsx
// src/components/ui/LottieLoader.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'
import { useReducedMotion } from 'react-native-reanimated'

type LottieLoaderProps = {
  source: Parameters<typeof LottieView>[0]['source']
  size?: number
  loop?: boolean
  autoPlay?: boolean
  speed?: number
  style?: object
}

export function LottieLoader({
  source,
  size = 120,
  loop = true,
  autoPlay = true,
  speed = 1,
  style,
}: LottieLoaderProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    // Show static placeholder instead of animating
    return <View style={[{ width: size, height: size }, style]} />
  }

  return (
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      style={[{ width: size, height: size }, style]}
    />
  )
}
```

### Full-screen loading overlay

```tsx
// src/components/ui/LoadingOverlay.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LottieLoader } from './LottieLoader'
import { colors } from '@/theme'

type LoadingOverlayProps = { visible: boolean }

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null
  return (
    <View style={styles.overlay}>
      <LottieLoader
        source={require('@/assets/animations/loader.json')}
        size={140}
        loop
        autoPlay
      />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
})
```

### Button loading state

```tsx
// Inside any button component — swap label for Lottie on loading
{loading ? (
  <LottieLoader
    source={require('@/assets/animations/spinner.json')}
    size={28}
    loop
    autoPlay
  />
) : (
  <Text style={styles.label}>{label}</Text>
)}
```

### Success / error feedback

```tsx
// One-shot animation: loop={false}, autoPlay, then callback
<LottieView
  source={require('@/assets/animations/success.json')}
  autoPlay
  loop={false}
  speed={1.2}
  style={{ width: 100, height: 100 }}
  onAnimationFinish={() => onDismiss()}
/>
```

---

## Pattern 2 — Skeleton Screen (Shimmer)

**Use cases:** card lists, profile headers, story grids — any content that loads asynchronously

**Implementation:** Reanimated 4 `translateX` + `expo-linear-gradient` overlay

### Core shimmer hook

```tsx
// src/hooks/useShimmer.ts
import { useEffect } from 'react'
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated'
import { useReducedMotion } from 'react-native-reanimated'

export function useShimmer(width: number) {
  const translateX = useSharedValue(-width)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    translateX.value = withRepeat(
      withTiming(width, { duration: 1000, easing: Easing.linear }),
      -1,   // infinite
      false // no reverse — restart from left
    )
  }, [width, reduceMotion])

  return translateX
}
```

### Reusable `<SkeletonBox />` component

```tsx
// src/components/ui/SkeletonBox.tsx
import React from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useShimmer } from '@/hooks/useShimmer'
import { colors, radius } from '@/theme'

type SkeletonBoxProps = {
  width: number | `${number}%`
  height: number
  borderRadius?: number
  style?: object
}

export function SkeletonBox({ width, height, borderRadius = radius.md, style }: SkeletonBoxProps) {
  const { width: screenWidth } = useWindowDimensions()
  const numericWidth = typeof width === 'number' ? width : screenWidth
  const translateX = useShimmer(numericWidth)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View
      style={[
        { width, height, borderRadius, backgroundColor: colors.neutral[100], overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  )
}
```

### Skeleton card (matches real content layout exactly)

```tsx
// src/components/ui/SkeletonCard.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SkeletonBox } from './SkeletonBox'
import { spacing, radius } from '@/theme'

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={64} height={64} borderRadius={radius.full} />
      <View style={styles.lines}>
        <SkeletonBox width="80%" height={16} />
        <SkeletonBox width="55%" height={12} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  lines: { flex: 1, gap: spacing.xs },
})
```

### Usage pattern

```tsx
// In any screen:
{isLoading ? (
  <>
    <SkeletonCard />
    <SkeletonCard />
    <SkeletonCard />
  </>
) : (
  <RealContent data={data} />
)}
```

---

## Pattern 3 — Transition Animations

**Use cases:** screen mount, element entry, list item stagger, conditional show/hide

### Fade in on mount

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { useReducedMotion } from 'react-native-reanimated'
import { useEffect } from 'react'

function FadeInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    opacity.value = withDelay(
      reduceMotion ? 0 : delay,
      withTiming(1, { duration: reduceMotion ? 0 : 300 })
    )
  }, [])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={style}>{children}</Animated.View>
}
```

### Slide up on mount

```tsx
function SlideUpView({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    opacity.value = withTiming(1, { duration: reduceMotion ? 0 : 350 })
    translateY.value = withSpring(0, { damping: 18, stiffness: 200 })
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}
```

### Staggered list entry

```tsx
// Apply to each item in a FlatList or map():
function StaggeredItem({ index, children }: { index: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const delay = reduceMotion ? 0 : index * 60
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 20 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}
```

### Conditional show/hide (no unmount flicker)

```tsx
// Animate out before hiding — keep mounted until animation ends
const opacity = useSharedValue(visible ? 1 : 0)

useEffect(() => {
  opacity.value = withTiming(visible ? 1 : 0, { duration: 250 })
}, [visible])

const style = useAnimatedStyle(() => ({
  opacity: opacity.value,
  pointerEvents: opacity.value === 0 ? 'none' : 'auto',
}))
```

---

## Pattern 4 — Micro-interactions

**Use cases:** button press, card tap, toggle switch, success bounce, pull-to-refresh indicator

### Button press scale

```tsx
// In any Pressable-based button:
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

const scale = useSharedValue(1)

const animStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
}))

<Animated.View style={animStyle}>
  <Pressable
    onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }) }}
    onPressOut={() => { scale.value = withSpring(1, { damping: 12 }) }}
    onPress={onPress}
  >
    {children}
  </Pressable>
</Animated.View>
```

### Success bounce

```tsx
// Trigger after a successful action (save, purchase, submit):
import { withSequence, withSpring } from 'react-native-reanimated'

const scale = useSharedValue(1)

function triggerSuccessBounce() {
  scale.value = withSequence(
    withSpring(1.12, { damping: 8, stiffness: 300 }),
    withSpring(1,    { damping: 14, stiffness: 200 })
  )
}
```

### Card tap ripple (scale + opacity)

```tsx
const scale = useSharedValue(1)
const opacity = useSharedValue(1)

const animStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
}))

<Animated.View style={animStyle}>
  <Pressable
    onPressIn={() => {
      scale.value = withSpring(0.97, { damping: 20 })
      opacity.value = withTiming(0.85, { duration: 80 })
    }}
    onPressOut={() => {
      scale.value = withSpring(1, { damping: 15 })
      opacity.value = withTiming(1, { duration: 150 })
    }}
  >
    {children}
  </Pressable>
</Animated.View>
```

### Haptic feedback (pair with animations)

```tsx
// expo-haptics — pair with success bounce or destructive actions
import * as Haptics from 'expo-haptics'

// On success:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
// On button press:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
// On error:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
```

---

## What NOT to Do
- Never use `Animated` from `react-native` — always Reanimated 4
- Never call animation `.value =` inside `useEffect` dependencies that fire on every render
- Never use `setTimeout` to sequence animations — use `withDelay` + `withSequence`
- Never load Lottie files from dynamic string paths — use static `require()`
- Never run heavy computation on UI thread inside `useAnimatedStyle` — keep worklets pure
- Never skip `useReducedMotion` check — accessibility is non-negotiable
- Never create a one-off animation component — if it appears in 2+ places, extract to `src/components/ui/`
