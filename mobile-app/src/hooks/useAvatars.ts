import { useState, useEffect, useCallback } from 'react';
import { AvatarCharacter } from '@/types';
import { fetchAvatarCharacters } from '@/services/avatarService';

interface UseAvatarsResult {
  avatars: AvatarCharacter[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches avatar characters from Supabase, grouped by character with frames.
 * Supports optional gender filter (always includes gender='all').
 */
export const useAvatars = (gender?: 'boy' | 'girl'): UseAvatarsResult => {
  const [avatars, setAvatars] = useState<AvatarCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAvatarCharacters(gender);
      setAvatars(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load avatars';
      setError(message);
      if (__DEV__) console.log('useAvatars fetch error:', message);
    } finally {
      setLoading(false);
    }
  }, [gender]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { avatars, loading, error, refetch };
};
