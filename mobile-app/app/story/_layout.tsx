import React from 'react';
import { Stack } from 'expo-router';

/**
 * Story creation stack layout
 * Flow: universe-select → start-select → paragraph → generating → page
 * Hero info is collected during onboarding (first time only)
 */
export default function StoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Retour',
        headerTintColor: '#007AFF',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="universe-select"
        options={{
          title: 'Ton Univers',
        }}
      />
      <Stack.Screen
        name="start-select"
        options={{
          title: 'Ton Histoire',
        }}
      />
      <Stack.Screen
        name="paragraph"
        options={{
          title: 'Ton Histoire',
        }}
      />
      <Stack.Screen
        name="generating"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="page"
        options={{
          title: 'Ta Page BD',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="reader"
        options={{
          title: 'Lecture',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
