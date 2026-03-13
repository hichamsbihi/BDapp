import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        variant === 'primary' && shadows.comic,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.ink : colors.surface}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyles[variant],
            sizeTextStyles[size],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.96 }, { translateY: 2 }],
  },
  text: {
    ...typography.button,
  },
});

const variantStyles: Record<string, ViewStyle> = {
  primary: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
  },
};

const variantTextStyles: Record<string, TextStyle> = {
  primary: { color: colors.surface },
  secondary: { color: colors.ink },
  outline: { color: colors.ink },
  ghost: { color: colors.inkLight },
};

const sizeStyles: Record<string, ViewStyle> = {
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
  },
};

const sizeTextStyles: Record<string, TextStyle> = {
  small: { ...typography.buttonSmall },
  medium: { ...typography.subtitle },
  large: { ...typography.button },
};
