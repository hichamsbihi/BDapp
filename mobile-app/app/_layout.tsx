import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store';
import { signOut } from '@/services/authService';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

/** In __DEV__, clear all persisted data before rendering the app so each reload starts fresh. */
async function devClearPersistedData(): Promise<void> {
  await AsyncStorage.clear();
  useAppStore.getState().resetStoreForSignOut();
  await signOut();
  if (__DEV__) console.log('DEV: AsyncStorage and session cleared');
}

/**
 * Root layout - manages top-level navigation.
 * In __DEV__: wait for storage/session clear before rendering so rehydration sees empty state.
 */
export default function RootLayout() {
  const [devReady, setDevReady] = useState(!__DEV__);

  useEffect(() => {
    if (!__DEV__) return;
    devClearPersistedData().then(() => setDevReady(true));
  }, []);

  if (__DEV__ && !devReady) {
    return (
      <View style={devLoadingStyles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
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

const devLoadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF5',
  },
});
