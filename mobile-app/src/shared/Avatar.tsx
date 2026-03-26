import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { colors, radius, shadows } from '@/theme/theme';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  image?: string;
  size?: AvatarSize;
  /** Fallback initials when no image is provided */
  initials?: string;
  style?: StyleProp<ViewStyle>;
  /** Describes the avatar for screen readers (e.g. character name). */
  accessibilityLabel?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 72,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: 12,
  md: 18,
  lg: 28,
};

export const Avatar: React.FC<AvatarProps> = ({
  image,
  size = 'md',
  initials,
  style,
  accessibilityLabel,
}) => {
  const dimension = sizeMap[size];

  const baseStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  const imageA11yLabel =
    accessibilityLabel ??
    (initials ? `Photo de profil, initiales ${initials}` : 'Photo de profil');

  if (image) {
    const imageStyles: StyleProp<ImageStyle> = [styles.image, baseStyle, style as ImageStyle];
    return (
      <Image
        accessibilityRole="image"
        accessibilityLabel={imageA11yLabel}
        source={{ uri: image }}
        style={imageStyles}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={imageA11yLabel}
      style={[styles.fallback, baseStyle, style]}
    >
      <Text style={[styles.initials, { fontSize: fontSizeMap[size] }]}>
        {initials ?? '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  initials: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
});
