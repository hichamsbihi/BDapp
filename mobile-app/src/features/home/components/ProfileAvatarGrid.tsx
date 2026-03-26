import React from 'react';
import { View, Image, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, spacing, radius, shadows, typography } from '@/theme/theme';
import type { AvatarCharacter } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLS = 3;
const GAP = spacing.md;
const RING_PADDING = 4;
const CONTENT_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const SIZE = (CONTENT_WIDTH - GAP * (COLS - 1)) / COLS - RING_PADDING * 2;

interface ProfileAvatarGridProps {
  avatars: AvatarCharacter[];
  selectedAvatarId: string | null;
  onSelect: (avatar: AvatarCharacter) => void;
}

function GridCell({ avatar, isSelected, onSelect }: { avatar: AvatarCharacter; isSelected: boolean; onSelect: () => void }) {
  const imageUrl = avatar.frames.normal;
  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View style={[styles.cell, pressStyle]}>
      <Pressable
        onPress={onSelect}
        onPressIn={() => { pressScale.value = withSpring(0.95, { damping: 15 }); }}
        onPressOut={() => { pressScale.value = withSpring(1, { damping: 12 }); }}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={[
              styles.ring,
              isSelected && styles.ringSelected,
            ]}
          >
            <View style={styles.inner}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>?</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {avatar.characterName}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Simple 3-column grid of avatar circles. Selected state: colored border + subtle scale.
 * No animation frames or expressions - normal frame only.
 */
export const ProfileAvatarGrid: React.FC<ProfileAvatarGridProps> = ({
  avatars,
  selectedAvatarId,
  onSelect,
}) => {
  return (
    <View style={styles.grid}>
      {avatars.map((avatar) => {
        const isSelected = selectedAvatarId === avatar.id;
        return (
          <GridCell
            key={avatar.id}
            avatar={avatar}
            isSelected={isSelected}
            onSelect={() => onSelect(avatar)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    justifyContent: 'flex-start',
  },
  cell: {
    width: SIZE + RING_PADDING * 2,
    alignItems: 'center',
  },
  ring: {
    width: SIZE + RING_PADDING * 2,
    height: SIZE + RING_PADDING * 2,
    borderRadius: (SIZE + RING_PADDING * 2) / 2,
    padding: RING_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderWidth: 3,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  ringSelected: {
    borderColor: colors.primary,
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  inner: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: SIZE,
    height: SIZE,
  },
  placeholder: {
    width: SIZE,
    height: SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  placeholderText: {
    fontSize: typography.size.xl,
    color: colors.text.muted,
    fontWeight: typography.weight.bold,
  },
  label: {
    marginTop: spacing.xs,
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    maxWidth: SIZE + RING_PADDING * 2,
    textAlign: 'center',
  },
});
