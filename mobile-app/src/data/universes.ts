import { Universe, StoryStart } from '@/types';

/**
 * Mock universes for story creation
 * Each universe has a theme and visual style
 */
export const UNIVERSES: Universe[] = [
  {
    id: 'universe-fantasy',
    name: 'Royaume Magique',
    description: 'Un monde de dragons, de princesses et de magie',
    imageUrl: 'https://picsum.photos/seed/fantasy/300/200',
    color: '#9B59B6',
  },
  {
    id: 'universe-space',
    name: 'Aventure Spatiale',
    description: 'Explore les etoiles et rencontre des aliens',
    imageUrl: 'https://picsum.photos/seed/space/300/200',
    color: '#3498DB',
  },
  {
    id: 'universe-ocean',
    name: 'Monde Sous-Marin',
    description: 'Plonge dans les profondeurs de l\'ocean',
    imageUrl: 'https://picsum.photos/seed/ocean/300/200',
    color: '#1ABC9C',
  },
];

/**
 * Mock story starts for each universe
 * These are pre-written beginnings for stories
 */
export const STORY_STARTS: StoryStart[] = [
  // Fantasy universe
  {
    id: 'start-fantasy-1',
    universeId: 'universe-fantasy',
    title: 'Le Dragon Perdu',
    text: 'Un jour, dans le royaume enchante, tu trouves un petit dragon bleu qui pleure...',
  },
  {
    id: 'start-fantasy-2',
    universeId: 'universe-fantasy',
    title: 'La Foret Mysterieuse',
    text: 'En te promenant dans la foret, tu decouvres un chemin secret qui brille...',
  },
  // Space universe
  {
    id: 'start-space-1',
    universeId: 'universe-space',
    title: 'Mission Planete Rouge',
    text: 'Ta fusee vient d\'atterrir sur Mars et tu vois quelque chose bouger...',
  },
  {
    id: 'start-space-2',
    universeId: 'universe-space',
    title: 'L\'Ami Extraterrestre',
    text: 'Un vaisseau spatial atterrit dans ton jardin et une creature en sort...',
  },
  // Ocean universe
  {
    id: 'start-ocean-1',
    universeId: 'universe-ocean',
    title: 'Le Tresor du Capitaine',
    text: 'En plongeant pres du recif, tu trouves une vieille carte au tresor...',
  },
  {
    id: 'start-ocean-2',
    universeId: 'universe-ocean',
    title: 'L\'Amitie du Dauphin',
    text: 'Un dauphin s\'approche de toi et te fait signe de le suivre...',
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
