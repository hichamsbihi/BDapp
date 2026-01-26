import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { Button, ScreenContainer } from '@/shared';
import { useAppStore } from '@/store';

type Gender = 'boy' | 'girl';

/**
 * Hero info screen - collect hero name, age, and gender
 */
export const HeroInfoScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const ageInputRef = useRef<TextInput>(null);
  const setHeroProfile = useAppStore((state) => state.setHeroProfile);

  const isValid = name.trim().length > 0 && age.length > 0 && gender !== null;

  const handleContinue = () => {
    Keyboard.dismiss();
    if (!isValid || !gender) return;

    setHeroProfile({
      id: `hero-${Date.now()}`,
      name: name.trim(),
      age: parseInt(age, 10),
      gender,
      avatarId: '',
    });

    router.push('/onboarding/avatar-select');
  };

  const handleAgeChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue === '' || parseInt(numericValue, 10) <= 12) {
      setAge(numericValue);
    }
  };

  const handleGenderSelect = (selected: Gender) => {
    Keyboard.dismiss();
    setGender(selected);
  };

  return (
    <ScreenContainer>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Text style={styles.title}>Parle-moi de ton heros</Text>
          <Text style={styles.subtitle}>
            C'est toi le heros de tes histoires !
          </Text>

          {/* Name input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Comment t'appelles-tu ?</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ton prenom"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="words"
              maxLength={20}
              returnKeyType="next"
              onSubmitEditing={() => ageInputRef.current?.focus()}
            />
          </View>

          {/* Age input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quel age as-tu ?</Text>
            <TextInput
              ref={ageInputRef}
              style={styles.input}
              value={age}
              onChangeText={handleAgeChange}
              placeholder="Ton age (1-12)"
              placeholderTextColor="#C7C7CC"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          {/* Gender selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tu es...</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'boy' && styles.genderButtonSelected,
                ]}
                onPress={() => handleGenderSelect('boy')}
              >
                <Text style={styles.genderIcon}>👦</Text>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'boy' && styles.genderTextSelected,
                  ]}
                >
                  Un garcon
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'girl' && styles.genderButtonSelected,
                ]}
                onPress={() => handleGenderSelect('girl')}
              >
                <Text style={styles.genderIcon}>👧</Text>
                <Text
                  style={[
                    styles.genderText,
                    gender === 'girl' && styles.genderTextSelected,
                  ]}
                >
                  Une fille
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={styles.footer}>
        <Button
          title="Continuer"
          onPress={handleContinue}
          size="large"
          disabled={!isValid}
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
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1C1C1E',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  genderButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FD',
  },
  genderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  genderTextSelected: {
    color: '#007AFF',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
});
