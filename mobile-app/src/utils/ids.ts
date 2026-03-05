export const generateStoryId = (): string => {
  return `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const generatePageId = (): string => {
  return `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
