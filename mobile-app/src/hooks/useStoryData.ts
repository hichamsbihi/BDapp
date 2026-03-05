import { useState, useEffect, useCallback } from 'react';
import { StoryStart, NarrativeChoice, UniverseConfig } from '@/types';
import {
  fetchUniversesByGender,
  fetchStoryStarts,
  fetchParagraphForPage,
  fetchChoicesForPage,
} from '@/services/storyService';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch universes by gender from Supabase.
 * Returns data immediately from fallback if Supabase fails.
 */
export const useUniverses = (gender: 'boy' | 'girl') => {
  const [state, setState] = useState<AsyncState<UniverseConfig[]>>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUniversesByGender(gender);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [gender]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
};

/**
 * Fetch story starts for a given universe.
 * Skips fetch if universeId is undefined (no universe selected yet).
 */
export const useStoryStarts = (universeId: string | undefined) => {
  const [state, setState] = useState<AsyncState<StoryStart[]>>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!universeId) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchStoryStarts(universeId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [universeId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
};

/**
 * Fetch paragraph text + image for a specific universe page.
 * Returns both text and imageUrl in a single call.
 */
export const useParagraph = (universeId: string | undefined, pageNumber: number) => {
  const [state, setState] = useState<AsyncState<{ text: string; imageUrl: string }>>({
    data: { text: '', imageUrl: '' },
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!universeId) {
      setState({ data: { text: '', imageUrl: '' }, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchParagraphForPage(universeId, pageNumber);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [universeId, pageNumber]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
};

/**
 * Fetch narrative choices for a specific universe page.
 * Returns empty array for the last page (no choices needed).
 */
export const useNarrativeChoices = (
  universeId: string | undefined,
  pageNumber: number,
  isLastPage: boolean
) => {
  const [state, setState] = useState<AsyncState<NarrativeChoice[]>>({
    data: [],
    loading: !isLastPage,
    error: null,
  });

  const load = useCallback(async () => {
    if (!universeId || isLastPage) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchChoicesForPage(universeId, pageNumber);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [universeId, pageNumber, isLastPage]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
};
