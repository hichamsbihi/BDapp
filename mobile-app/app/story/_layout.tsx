import React from 'react';
import { Stack } from 'expo-router';

/**
 * Story creation stack layout
 * Flow: universe-select → start-select → paragraph → page
 * 
 * Swipe back is ALLOWED on first two screens (exploration phase)
 * Swipe back is DISABLED on creation screens (paragraph, page, reader)
 */
export default function StoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {/* Exploration phase - swipe back allowed */}
      <Stack.Screen
        name="universe-select"
        options={{
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="start-select"
        options={{
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />

      {/* Creation phase - swipe back disabled */}
      <Stack.Screen
        name="paragraph"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="generating"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="page"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="reader"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
