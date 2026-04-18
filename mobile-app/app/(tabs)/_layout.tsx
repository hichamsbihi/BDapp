import React from 'react';
import { Stack } from 'expo-router';
import { useStoreSync } from '@/hooks/useStoreSync';

/**
 * Main app stack layout (previously tabs)
 * Home is the entry point, Library is accessible via navigation.
 * useStoreSync persists stars, profile, unlocked universes to Supabase when user is connected.
 */
export default function MainLayout() {
  useStoreSync();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFCF5' },
      }}
    >
      <Stack.Screen name="index" 
      options={{
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
      }}/>
      <Stack.Screen name="library" />
      <Stack.Screen name="profile" 
      />
    </Stack>
  );
}
