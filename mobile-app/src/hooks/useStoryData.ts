import { useState, useEffect, useCallback } from 'react';
import { StoryStart, NarrativeChoice, UniverseConfig } from '@/types';
import {
  fetchUniversesByAvatar,
  fetchStoryStarts,
  fetchParagraphForPage,
  fetchParagraphById,
  fetchChoicesForPage,
} from '@/services/storyService';

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Fetch universes for the current avatar from Supabase.
 * Uses avatar character name as primary filter, falls back to gender.
 */
export const useUniverses = (
  avatarCharacterName: string | undefined,
  gender: 'boy' | 'girl'
) => {
  const [state, setState] = useState<AsyncState<UniverseConfig[]>>({
    data: [],
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchUniversesByAvatar(avatarCharacterName, gender);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [avatarCharacterName, gender]);

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

/** Paragraph result when loading by id (branching). */
export type ParagraphByIdResult = {
  id: string;
  text: string;
  imageUrl: string;
  pageNumber: number;
  step?: number | null;
} | null;

/**
 * Fetch a single paragraph by id (for branching: after user selects a choice with nextParagraphId).
 */
export const useParagraphById = (paragraphId: string | undefined) => {
  const [state, setState] = useState<AsyncState<ParagraphByIdResult>>({
    data: null,
    loading: !!paragraphId,
    error: null,
  });

  const load = useCallback(async () => {
    if (!paragraphId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchParagraphById(paragraphId);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState({ data: null, loading: false, error: message });
    }
  }, [paragraphId]);

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
