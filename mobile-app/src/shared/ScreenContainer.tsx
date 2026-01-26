import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  safeArea?: boolean;
}

/**
 * Base container for all screens
 * Provides consistent padding and safe area handling
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  padded = true,
  safeArea = true,
}) => {
  const Container = safeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, padded && styles.padded, style]}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  padded: {
    paddingHorizontal: 20,
  },
});
