import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, radius } from '@/theme';

interface NotEnoughStarsModalProps {
  visible: boolean;
  onClose: () => void;
  needed: number;
  onWatchMagic: () => Promise<unknown>;
}

export const NotEnoughStarsModal: React.FC<NotEnoughStarsModalProps> = ({
  visible,
  onClose,
  needed,
  onWatchMagic,
}) => {
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchMagic = async () => {
    setIsWatching(true);
    try {
      await onWatchMagic();
      onClose();
    } finally {
      setIsWatching(false);
    }
  };

  const message =
    needed === 1
      ? 'Il te manque une petite etoile'
      : `Il te manque ${needed} etoiles`;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.title}>Presque la !</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.submessage}>
            Tu peux en gagner en regardant une courte magie, ou en finissant une
            histoire !
          </Text>

          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.buttonPrimary,
                pressed && styles.buttonPressed,
                isWatching && styles.buttonDisabled,
              ]}
              onPress={handleWatchMagic}
              disabled={isWatching}
            >
              {isWatching ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <View style={styles.buttonPrimaryContent}>
                  <Text style={styles.buttonPrimaryIcon}>✨</Text>
                  <Text style={styles.buttonPrimaryText}>
                    Regarder une courte magie
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.buttonSecondary,
                pressed && styles.buttonPressed,
              ]}
              onPress={onClose}
              disabled={isWatching}
            >
              <Text style={styles.buttonSecondaryText}>Plus tard</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md - 4,
  },
  title: {
    ...typography.title,
    color: colors.ink,
    marginBottom: spacing.md - 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  submessage: {
    ...typography.body,
    fontSize: 15,
    color: colors.inkLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  buttons: {
    width: '100%',
    gap: spacing.md - 4,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 2.5,
    borderColor: colors.ink,
  },
  buttonPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonSecondary: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPrimaryIcon: {
    fontSize: 20,
  },
  buttonPrimaryText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.surface,
  },
  buttonSecondaryText: {
    ...typography.body,
    fontSize: 15,
    color: colors.inkLight,
  },
});
