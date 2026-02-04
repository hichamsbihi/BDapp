import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// DEV flag: set to true to clear storage on cold start (not hot reload)
const DEV_CLEAR_STORAGE = __DEV__;

// Module-level flag survives hot reloads but resets on cold start (Ctrl+C + restart)
let hasCleared = false;

/**
 * Root layout - manages top-level navigation
 */
export default function RootLayout() {
  // Clear AsyncStorage only on cold start, not hot reload
  useEffect(() => {
    if (DEV_CLEAR_STORAGE && !hasCleared) {
      hasCleared = true;
      AsyncStorage.clear().then(() => {
        console.log('DEV: AsyncStorage cleared (cold start)');
      });
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="onboarding"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen name="story" />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: '',
        }}
      />
    </Stack>
  );
}
