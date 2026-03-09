/**
 * Avatar data layer.
 * Avatars are now fetched from Supabase (table: avatars).
 * Use the useAvatars() hook in components for reactive data.
 *
 * This file re-exports the service + hook for backward compatibility
 * with existing imports from '@/data'.
 */

export { fetchAvatarCharacters, fetchAvatarByName } from '@/services/avatarService';
export { useAvatars } from '@/hooks/useAvatars';
