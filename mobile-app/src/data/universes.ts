import { Universe, StoryStart } from '@/types';

/**
 * Universe configuration
 * isLocked est calculé dynamiquement par le store (unlockedUniverses)
 */
export interface UniverseConfig extends Universe {
  isLocked: boolean;
  emoji: string;
}

/**
 * Universes organisés par genre
 * Déblocage via étoiles (unlockedUniverses dans le store)
 */
export const UNIVERSES_BY_GENDER: Record<'boy' | 'girl', UniverseConfig[]> = {
  boy: [
    {
      id: 'universe-space',
      name: 'Aventure Spatiale',
      description: 'Explore les étoiles et rencontre des aliens',
      imageUrl: 'https://picsum.photos/seed/space/300/200',
      color: '#5B8DEE',
      emoji: '🚀',
      isLocked: true,
    },
    {
      id: 'universe-pirates',
      name: 'Île aux Pirates',
      description: 'Pars à la chasse au trésor sur les mers',
      imageUrl: 'https://picsum.photos/seed/pirates/300/200',
      color: '#E67E22',
      emoji: '🏴‍☠️',
      isLocked: true,
    },
    {
      id: 'universe-dinosaurs',
      name: 'Terre des Dinosaures',
      description: 'Voyage au temps des géants préhistoriques',
      imageUrl: 'https://picsum.photos/seed/dino/300/200',
      color: '#27AE60',
      emoji: '🦖',
      isLocked: true,
    },
  ],
  girl: [
    {
      id: 'universe-fantasy',
      name: 'Royaume Magique',
      description: 'Un monde de fées, de licornes et de magie',
      imageUrl: 'https://picsum.photos/seed/fantasy/300/200',
      color: '#9B59B6',
      emoji: '🏰',
      isLocked: true,
    },
    {
      id: 'universe-ocean',
      name: 'Monde Sous-Marin',
      description: 'Nage avec les sirènes et les dauphins',
      imageUrl: 'https://picsum.photos/seed/ocean/300/200',
      color: '#1ABC9C',
      emoji: '🧜‍♀️',
      isLocked: true,
    },
    {
      id: 'universe-forest',
      name: 'Forêt Enchantée',
      description: 'Découvre les secrets des animaux magiques',
      imageUrl: 'https://picsum.photos/seed/forest/300/200',
      color: '#F39C12',
      emoji: '🦋',
      isLocked: true,
    },
  ],
};

/**
 * Legacy export - all universes flat
 */
export const UNIVERSES: Universe[] = [
  ...UNIVERSES_BY_GENDER.boy,
  ...UNIVERSES_BY_GENDER.girl,
];

/**
 * Get universes filtered by gender
 */
export const getUniversesByGender = (gender: 'boy' | 'girl'): UniverseConfig[] => {
  return UNIVERSES_BY_GENDER[gender] || UNIVERSES_BY_GENDER.boy;
};

/**
 * Mock story starts for each universe
 */
export const STORY_STARTS: StoryStart[] = [
  // Fantasy universe
  {
    id: 'start-fantasy-1',
    universeId: 'universe-fantasy',
    title: 'Le Dragon Perdu',
    text: 'Un jour, dans le royaume enchanté, tu trouves un petit dragon bleu qui pleure...',
  },
  {
    id: 'start-fantasy-2',
    universeId: 'universe-fantasy',
    title: 'La Forêt Mystérieuse',
    text: 'En te promenant dans la forêt, tu découvres un chemin secret qui brille...',
  },
  // Space universe
  {
    id: 'start-space-1',
    universeId: 'universe-space',
    title: 'Mission Planète Rouge',
    text: 'Ta fusée vient d\'atterrir sur Mars et tu vois quelque chose bouger...',
  },
  {
    id: 'start-space-2',
    universeId: 'universe-space',
    title: 'L\'Ami Extraterrestre',
    text: 'Un vaisseau spatial atterrit dans ton jardin et une créature en sort...',
  },
  // Ocean universe
  {
    id: 'start-ocean-1',
    universeId: 'universe-ocean',
    title: 'Le Trésor du Capitaine',
    text: 'En plongeant près du récif, tu trouves une vieille carte au trésor...',
  },
  {
    id: 'start-ocean-2',
    universeId: 'universe-ocean',
    title: 'L\'Amitié du Dauphin',
    text: 'Un dauphin s\'approche de toi et te fait signe de le suivre...',
  },
  // Pirates universe
  {
    id: 'start-pirates-1',
    universeId: 'universe-pirates',
    title: 'Le Coffre Mystérieux',
    text: 'Sur une île déserte, tu découvres un coffre à moitié enterré dans le sable...',
  },
  {
    id: 'start-pirates-2',
    universeId: 'universe-pirates',
    title: 'Le Perroquet Parlant',
    text: 'Un perroquet coloré se pose sur ton épaule et te murmure un secret...',
  },
  // Dinosaurs universe
  {
    id: 'start-dinosaurs-1',
    universeId: 'universe-dinosaurs',
    title: 'L\'Œuf Géant',
    text: 'Dans une grotte, tu trouves un énorme œuf qui commence à trembler...',
  },
  {
    id: 'start-dinosaurs-2',
    universeId: 'universe-dinosaurs',
    title: 'Le Petit Tricératops',
    text: 'Un bébé dinosaure te suit partout et veut devenir ton ami...',
  },
  // Forest universe
  {
    id: 'start-forest-1',
    universeId: 'universe-forest',
    title: 'La Fée Lumineuse',
    text: 'Une petite lumière danse devant toi et t\'invite à la suivre...',
  },
  {
    id: 'start-forest-2',
    universeId: 'universe-forest',
    title: 'Le Renard Magique',
    text: 'Un renard aux yeux brillants t\'observe depuis un buisson fleuri...',
  },
];

export const getUniverseById = (id: string): Universe | undefined => {
  return UNIVERSES.find((universe) => universe.id === id);
};

export const getStoryStartsByUniverse = (universeId: string): StoryStart[] => {
  return STORY_STARTS.filter((start) => start.universeId === universeId);
};

export const getStoryStartById = (id: string): StoryStart | undefined => {
  return STORY_STARTS.find((start) => start.id === id);
};
