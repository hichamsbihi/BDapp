/**
 * Mock images for comic book pages
 * In production, these would be AI-generated images
 */

// Different colored placeholder images for variety
const IMAGE_COLORS = [
  'FFB6C1', // Light pink
  'ADD8E6', // Light blue
  '90EE90', // Light green
  'FFD700', // Gold
  'DDA0DD', // Plum
  'F0E68C', // Khaki
  'FFA07A', // Light salmon
  '87CEEB', // Sky blue
];

/**
 * Generate a mock image URL for a story page
 */
export const generateMockPageImage = (pageNumber: number, universeId: string): string => {
  const colorIndex = (pageNumber - 1) % IMAGE_COLORS.length;
  const color = IMAGE_COLORS[colorIndex];
  
  // Different theme based on universe
  let themeText = '';
  if (universeId.includes('fantasy')) {
    themeText = 'Fantasy';
  } else if (universeId.includes('space')) {
    themeText = 'Space';
  } else if (universeId.includes('ocean')) {
    themeText = 'Ocean';
  }
  
  return `https://picsum.photos/seed/${universeId}-${pageNumber}/400/300`;
};

/**
 * Get mock images for all pages of a story
 */
export const getMockStoryImages = (universeId: string, pageCount: number = 5): string[] => {
  return Array.from({ length: pageCount }, (_, index) => 
    generateMockPageImage(index + 1, universeId)
  );
};
