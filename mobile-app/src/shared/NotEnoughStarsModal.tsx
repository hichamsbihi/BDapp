import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal as RNModal,
  ActivityIndicator,
} from 'react-native';

interface NotEnoughStarsModalProps {
  visible: boolean;
  onClose: () => void;
  needed: number;
  /** Rituel magique (jamais "pub" ou "ad") - ex: rewardStar('watch_ad') */
  onWatchMagic: () => Promise<unknown>;
}

/**
 * Modal "pas assez d'étoiles"
 * Ton rassurant, magique, jamais bloquant
 * Jamais de mot "pub", "ad", "advertising"
 */
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
      ? "Il te manque une petite étoile ✨"
      : `Il te manque ${needed} étoiles ✨`;

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
          <Text style={styles.title}>Presque là !</Text>
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
                <ActivityIndicator color="#FFFFFF" size="small" />
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
              <Text style={styles.buttonSecondaryText}>⏳ Plus tard</Text>
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
    backgroundColor: 'rgba(93, 78, 55, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#FFFCF5',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#5D4E37',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5D4E37',
    textAlign: 'center',
    marginBottom: 8,
  },
  submessage: {
    fontSize: 15,
    color: '#8D7B68',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A65',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonSecondaryText: {
    fontSize: 15,
    color: '#8D7B68',
  },
});
