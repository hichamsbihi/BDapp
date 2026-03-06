import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ViewerHeaderProps {
  title: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * Floating header overlay for the comic viewer.
 * Shows story title and close button. Toggled by tapping the page.
 */
export const ViewerHeader: React.FC<ViewerHeaderProps> = ({
  title,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeButton}
        activeOpacity={0.7}
      >
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* Spacer to balance the close button */}
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 252, 245, 0.75)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(232, 224, 213, 0.5)',
    zIndex: 10,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5EBE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#5D4E37',
    fontWeight: '400',
  },

  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3F32',
    textAlign: 'center',
    marginHorizontal: 12,
  },

  spacer: {
    width: 36,
  },
});
