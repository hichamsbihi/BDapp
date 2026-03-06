import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ViewerControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Bottom navigation bar for the comic viewer.
 * Previous / page indicator / Next with warm parchment styling.
 */
export const ViewerControls: React.FC<ViewerControlsProps> = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  const isFirst = currentPage === 0;
  const isLast = currentPage === totalPages - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.navButton, isFirst && styles.navButtonDisabled]}
        onPress={onPrev}
        disabled={isFirst}
        activeOpacity={0.7}
      >
        <Text style={[styles.navIcon, isFirst && styles.navIconDisabled]}>
          ‹
        </Text>
      </TouchableOpacity>

      <View style={styles.indicator}>
        <Text style={styles.indicatorText}>
          Page {currentPage + 1} sur {totalPages}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.navButton, isLast && styles.navButtonDisabled]}
        onPress={onNext}
        disabled={isLast}
        activeOpacity={0.7}
      >
        <Text style={[styles.navIcon, isLast && styles.navIconDisabled]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 252, 245, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E0D5',
  },

  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5EBE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F5F0EA',
    opacity: 0.4,
  },
  navIcon: {
    fontSize: 28,
    color: '#5D4E37',
    fontWeight: '300',
    marginTop: -2,
  },
  navIconDisabled: {
    color: '#C4B5A5',
  },

  indicator: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 13,
    color: '#9A8B7A',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
