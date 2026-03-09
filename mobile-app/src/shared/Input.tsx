import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '@/theme/theme';

interface InputProps {
  value: string;
  placeholder?: string;
  onChange: (text: string) => void;
  label?: string;
  error?: string;
  multiline?: boolean;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  value,
  placeholder,
  onChange,
  label,
  error,
  multiline = false,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.semantic.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          { borderColor },
          multiline && styles.multiline,
          focused && styles.focused,
        ]}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.lg,
    color: colors.text.primary,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  focused: {
    ...shadows.sm,
  },
  error: {
    fontSize: typography.size.sm,
    color: colors.semantic.error,
    marginTop: spacing.xxs,
  },
});
