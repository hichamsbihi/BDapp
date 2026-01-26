import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';

/**
 * Welcome screen - first screen of onboarding
 * Introduces the app to the child
 */
export const WelcomeScreen: React.FC = () => {
  const handleStart = () => {
    router.push('/onboarding/hero-info');
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          {/* Placeholder for welcome illustration */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Illustration</Text>
          </View>
        </View>

        <Text style={styles.title}>Bienvenue dans ton</Text>
        <Text style={styles.titleHighlight}>Monde d'Histoires !</Text>
        
        <Text style={styles.subtitle}>
          Cree des aventures magiques avec ton heros prefere
        </Text>
      </View>

      <View style={styles.footer}>
        <Button
          title="Commencer l'aventure"
          onPress={handleStart}
          size="large"
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 40,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F2F2F7',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
