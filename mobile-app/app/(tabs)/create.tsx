import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { Loader } from '@/shared';

/**
 * Create tab - redirects to story creation flow
 * This tab acts as an entry point to the story creation stack
 * Goes directly to universe selection (hero info already collected in onboarding)
 */
export default function CreateTab() {
  useEffect(() => {
    // Redirect to story creation flow (starts with universe selection)
    router.replace('/story/universe-select');
  }, []);

  return <Loader fullScreen text="Chargement..." />;
}
