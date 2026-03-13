import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/theme';

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
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },

  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.4,
  },
  navIcon: {
    fontSize: 28,
    color: colors.ink,
    fontWeight: '300',
    marginTop: -2,
  },
  navIconDisabled: {
    color: colors.inkMuted,
  },

  indicator: {
    flex: 1,
    alignItems: 'center',
  },
  indicatorText: {
    fontSize: 13,
    color: colors.inkMuted,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});
