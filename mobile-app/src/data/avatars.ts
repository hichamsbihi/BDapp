import { Avatar } from '@/types';

/**
 * Mock avatars for hero selection
 * Using picsum.photos for reliable placeholder images
 */
export const AVATARS: Avatar[] = [
  {
    id: 'avatar-1',
    name: 'Luna',
    // Pink/red themed avatar
    imageUrl: 'https://picsum.photos/seed/luna/150/150',
    color: '#FF6B6B',
  },
  {
    id: 'avatar-2',
    name: 'Max',
    // Teal themed avatar
    imageUrl: 'https://picsum.photos/seed/max/150/150',
    color: '#4ECDC4',
  },
  {
    id: 'avatar-3',
    name: 'Stella',
    // Yellow themed avatar
    imageUrl: 'https://picsum.photos/seed/stella/150/150',
    color: '#FFE66D',
  },
  {
    id: 'avatar-4',
    name: 'Leo',
    // Green themed avatar
    imageUrl: 'https://picsum.photos/seed/leo/150/150',
    color: '#95E1D3',
  },
];

export const getAvatarById = (id: string): Avatar | undefined => {
  return AVATARS.find((avatar) => avatar.id === id);
};
