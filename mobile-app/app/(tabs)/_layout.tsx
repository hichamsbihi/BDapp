import React from 'react';
import { Tabs } from 'expo-router';

/**
 * Tab navigation layout
 * Main navigation for library and story creation
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mes Histoires',
          tabBarLabel: 'Bibliotheque',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Creer',
          tabBarLabel: 'Nouvelle',
        }}
      />
    </Tabs>
  );
}
