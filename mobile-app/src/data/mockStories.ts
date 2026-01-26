import { Story, StoryPage } from '@/types';

/**
 * Mock stories for the library
 * These represent previously created stories
 */

const createMockPage = (
  pageNumber: number,
  text: string
): StoryPage => ({
  id: `page-${pageNumber}-${Date.now()}`,
  paragraphText: text,
  imageUrl: `https://via.placeholder.com/400x300/E8E8E8/333333?text=Page+${pageNumber}`,
  pageNumber,
});

export const MOCK_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'Le Dragon Perdu',
    universeId: 'universe-fantasy',
    heroId: 'hero-1',
    pages: [
      createMockPage(1, 'Un jour, dans le royaume enchante, tu trouves un petit dragon bleu qui pleure...'),
      createMockPage(2, 'Tu t\'approches doucement et lui demandes ce qui ne va pas.'),
      createMockPage(3, 'Le dragon te dit qu\'il a perdu sa famille et ne sait pas comment rentrer chez lui.'),
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isComplete: true,
  },
  {
    id: 'story-2',
    title: 'Mission Planete Rouge',
    universeId: 'universe-space',
    heroId: 'hero-1',
    pages: [
      createMockPage(1, 'Ta fusee vient d\'atterrir sur Mars et tu vois quelque chose bouger...'),
      createMockPage(2, 'Tu enfiles ta combinaison spatiale et sors explorer.'),
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    isComplete: false,
  },
];

/**
 * Generate a unique ID for new stories
 */
export const generateStoryId = (): string => {
  return `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a unique ID for new pages
 */
export const generatePageId = (): string => {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
