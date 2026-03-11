import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { useAppStore } from '@/store';
import { getCurrentUser } from '@/services/authService';
import { upsertStoryProgress } from '@/services/syncService';

/**
 * Story creation stack layout
 * Flow: universe-select → start-select → paragraph → page
 * Saves story progress when app goes to background so user can resume later.
 */
export default function StoryLayout() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (state: AppStateStatus) => {
      if (state !== 'background') return;
      const currentStory = useAppStore.getState().currentStory;
      if (!currentStory?.universeId) return;
      const user = await getCurrentUser();
      if (!user) return;
      const currentPageNumber = (currentStory.pages?.length ?? 0) + 1;
      await upsertStoryProgress(user.id, currentStory.universeId, currentPageNumber);
    });
    return () => sub.remove();
  }, []);

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
      <Stack.Screen
        name="completed"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
