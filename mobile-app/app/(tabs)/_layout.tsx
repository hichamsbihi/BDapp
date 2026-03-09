import React from 'react';
import { Stack } from 'expo-router';

/**
 * Main app stack layout (previously tabs)
 * Home is the entry point, Library is accessible via navigation
 */
export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFCF5' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="library" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
