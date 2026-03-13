import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, shadows } from '@/theme';

type IllustrationVariant =
  | 'welcome'
  | 'empty'
  | 'creating'
  | 'celebrating'
  | 'reading'
  | 'exploring'
  | 'sleeping';

interface ComicIllustrationProps {
  variant: IllustrationVariant;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

const VARIANT_CONFIG: Record<
  IllustrationVariant,
  { emoji: string; accentEmoji: string; bgColor: string }
> = {
  welcome: { emoji: '📖', accentEmoji: '✨', bgColor: '#FFF8F0' },
  empty: { emoji: '✏️', accentEmoji: '💭', bgColor: '#F5F5F5' },
  creating: { emoji: '🎨', accentEmoji: '🖌️', bgColor: '#FFF3EE' },
  celebrating: { emoji: '🎉', accentEmoji: '⭐', bgColor: '#FFF8F0' },
  reading: { emoji: '📚', accentEmoji: '💡', bgColor: '#F5F5F5' },
  exploring: { emoji: '🗺️', accentEmoji: '🧭', bgColor: '#F5F5F5' },
  sleeping: { emoji: '💤', accentEmoji: '🌙', bgColor: '#F0F0F0' },
};

const SIZE_MAP = {
  small: { container: 80, emoji: 32, accent: 16, border: 2.5 },
  medium: { container: 140, emoji: 48, accent: 22, border: 3 },
  large: { container: 200, emoji: 72, accent: 32, border: 3.5 },
};

/**
 * Comic-panel style illustration placeholder.
 * Thick ink border + drop shadow = hand-drawn comic feel.
 * Replace emoji with real SVG/PNG assets later.
 */
export const ComicIllustration: React.FC<ComicIllustrationProps> = ({
  variant,
  size = 'medium',
  style,
}) => {
  const config = VARIANT_CONFIG[variant];
  const dims = SIZE_MAP[size];

  return (
    <View style={[{ width: dims.container, height: dims.container }, style]}>
      {/* Comic offset shadow layer */}
      <View
        style={[
          styles.shadowLayer,
          {
            width: dims.container,
            height: dims.container,
            borderRadius: dims.container * 0.32,
            borderWidth: dims.border,
          },
        ]}
      />
      {/* Main panel */}
      <View
        style={[
          styles.panel,
          {
            width: dims.container,
            height: dims.container,
            borderRadius: dims.container * 0.32,
            borderWidth: dims.border,
            backgroundColor: config.bgColor,
            top: -4,
            left: -4,
          },
        ]}
      >
        <Text style={{ fontSize: dims.emoji }}>{config.emoji}</Text>

        {/* Accent floating emoji */}
        <View style={[styles.accentBubble, { top: '8%', right: '8%' }]}>
          <Text style={{ fontSize: dims.accent }}>{config.accentEmoji}</Text>
        </View>

        {/* Comic speed lines */}
        {size !== 'small' && (
          <>
            <View style={[styles.speedLine, styles.speedLine1]} />
            <View style={[styles.speedLine, styles.speedLine2]} />
            <View style={[styles.speedLine, styles.speedLine3]} />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  panel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: colors.ink,
  },
  accentBubble: {
    position: 'absolute',
  },
  speedLine: {
    position: 'absolute',
    height: 2.5,
    backgroundColor: colors.ink,
    opacity: 0.12,
    borderRadius: 2,
  },
  speedLine1: {
    width: 18,
    bottom: '22%',
    left: '10%',
    transform: [{ rotate: '-12deg' }],
  },
  speedLine2: {
    width: 24,
    bottom: '30%',
    left: '6%',
    transform: [{ rotate: '-8deg' }],
  },
  speedLine3: {
    width: 14,
    top: '25%',
    right: '10%',
    transform: [{ rotate: '10deg' }],
  },
});
