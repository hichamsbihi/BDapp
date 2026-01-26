import React from 'react';
import { Stack } from 'expo-router';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

/**
 * Root layout - manages top-level navigation
 */
export default function RootLayout() {
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
