import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '@/theme';

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  illustration?: React.ReactNode;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  imageUrl,
  onPress,
  style,
  children,
  illustration,
  selected = false,
}) => {
  const content = (
    <View style={[styles.card, selected && styles.cardSelected, style]}>
      {illustration && <View style={styles.illustrationSlot}>{illustration}</View>}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: colors.ink,
    ...shadows.comic,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
    ...shadows.cardLifted,
  },
  pressed: {
    transform: [{ scale: 0.97 }, { translateY: 2 }],
  },
  illustrationSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: colors.surfaceAlt,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.inkMuted,
    lineHeight: 20,
  },
});
