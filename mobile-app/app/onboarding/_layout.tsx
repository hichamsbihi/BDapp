import React from 'react';
import { Stack } from 'expo-router';

/**
 * Onboarding stack layout
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true, // iOS swipe back without header
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="hero-info" />
      <Stack.Screen name="avatar-select" />
    </Stack>
  );
}
