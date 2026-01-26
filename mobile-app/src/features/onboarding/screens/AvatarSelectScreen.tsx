import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';
import { AVATARS } from '@/data';
import { Avatar } from '@/types';

/**
 * Avatar selection screen - final step of onboarding
 */
export const AvatarSelectScreen: React.FC = () => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  const updateHeroProfile = useAppStore((state) => state.updateHeroProfile);
  const setHasCompletedOnboarding = useAppStore(
    (state) => state.setHasCompletedOnboarding
  );
  const heroProfile = useAppStore((state) => state.heroProfile);

  const handleComplete = () => {
    if (!selectedAvatarId) return;

    updateHeroProfile({ avatarId: selectedAvatarId });
    setHasCompletedOnboarding(true);

    // Go directly to story creation (not empty library)
    router.replace('/story/universe-select');
  };

  const renderAvatar = ({ item }: { item: Avatar }) => {
    const isSelected = selectedAvatarId === item.id;

    return (
      <TouchableOpacity
        style={[styles.avatarItem, isSelected && styles.avatarItemSelected]}
        onPress={() => setSelectedAvatarId(item.id)}
      >
        {/* Colored circle with initial as fallback */}
        <View style={[styles.avatarCircle, { backgroundColor: item.color || '#E5E5EA' }]}>
          <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
        </View>
        <Text
          style={[styles.avatarName, isSelected && styles.avatarNameSelected]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Text style={styles.title}>Choisis ton avatar</Text>
        <Text style={styles.subtitle}>
          {heroProfile?.name
            ? `Super ${heroProfile.name} ! Maintenant choisis ton apparence`
            : 'Choisis l\'avatar qui te represente le mieux'}
        </Text>

        <FlatList
          data={AVATARS}
          renderItem={renderAvatar}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.avatarList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <Button
          title="C'est parti !"
          onPress={handleComplete}
          size="large"
          disabled={!selectedAvatarId}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  avatarList: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarItem: {
    width: '47%',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  avatarNameSelected: {
    color: '#007AFF',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
