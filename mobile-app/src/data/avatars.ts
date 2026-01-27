import { Avatar } from '@/types';

/**
 * Avatars organized by gender
 * Each gender has 4 distinct avatars with unique colors and names
 */
export const AVATARS_BY_GENDER: Record<'boy' | 'girl', Avatar[]> = {
  boy: [
    {
      id: 'avatar-boy-1',
      name: 'Max',
      imageUrl: 'https://picsum.photos/seed/max/150/150',
      color: '#4ECDC4', // Teal
    },
    {
      id: 'avatar-boy-2',
      name: 'Leo',
      imageUrl: 'https://picsum.photos/seed/leo/150/150',
      color: '#5B8DEE', // Blue
    },
    {
      id: 'avatar-boy-3',
      name: 'Hugo',
      imageUrl: 'https://picsum.photos/seed/hugo/150/150',
      color: '#FF8A65', // Coral
    },
    {
      id: 'avatar-boy-4',
      name: 'Tom',
      imageUrl: 'https://picsum.photos/seed/tom/150/150',
      color: '#95E1D3', // Mint
    },
  ],
  girl: [
    {
      id: 'avatar-girl-1',
      name: 'Luna',
      imageUrl: 'https://picsum.photos/seed/luna/150/150',
      color: '#FF6B9D', // Pink
    },
    {
      id: 'avatar-girl-2',
      name: 'Stella',
      imageUrl: 'https://picsum.photos/seed/stella/150/150',
      color: '#B19CD9', // Lavender
    },
    {
      id: 'avatar-girl-3',
      name: 'Lily',
      imageUrl: 'https://picsum.photos/seed/lily/150/150',
      color: '#FFB347', // Orange
    },
    {
      id: 'avatar-girl-4',
      name: 'Mia',
      imageUrl: 'https://picsum.photos/seed/mia/150/150',
      color: '#77DD77', // Pastel green
    },
  ],
};

/**
 * Legacy export for backward compatibility
 * Returns all avatars (both genders)
 */
export const AVATARS: Avatar[] = [
  ...AVATARS_BY_GENDER.boy,
  ...AVATARS_BY_GENDER.girl,
];

/**
 * Get avatars filtered by gender
 */
export const getAvatarsByGender = (gender: 'boy' | 'girl'): Avatar[] => {
  return AVATARS_BY_GENDER[gender] || AVATARS_BY_GENDER.boy;
};

/**
 * Get a specific avatar by ID
 */
export const getAvatarById = (id: string): Avatar | undefined => {
  return AVATARS.find((avatar) => avatar.id === id);
};
