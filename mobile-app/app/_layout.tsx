import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

/** Dev only: clears auth session and all persisted state so each reload starts fresh. */
async function devClearPersistedData(): Promise<void> {
  await AsyncStorage.clear();
  useAppStore.getState().resetStoreForSignOut();
  await signOut();
}

/**
 * Root layout.
 * In __DEV__: clears all persisted state on every reload for clean testing.
 * In production: no clear — persisted state (stars, unlocked universes) survives restarts.
 */
export default function RootLayout() {
  const [devReady, setDevReady] = useState(!__DEV__);

  useEffect(() => {
    if (!__DEV__) return;
    // Commenter cette ligne pour tester la persistence :
    // devClearPersistedData().then(() => setDevReady(true));
    setDevReady(true); // Remplacer par ceci pour tester la persistence
  }, []);

  if (__DEV__ && !devReady) {
    return (
      <View style={styles.devLoader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" 
        options={{
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
        }}
        />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)"
        options={{
          gestureEnabled: false,
          fullScreenGestureEnabled: false,
        }} />
        <Stack.Screen
          name="onboarding"
          options={{
            gestureEnabled: false,
          }}
        />
          <Stack.Screen name="selection" 
          options={{
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}
          />
          <Stack.Screen
          name="story"
          options={{
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: '',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  devLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFCF5',
  },
});
