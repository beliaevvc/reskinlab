import { useEffect, useRef, useCallback, useState } from 'react';
import { useSaveSpecification } from './useSpecifications';

/**
 * Auto-save hook for calculator state
 * Saves to Supabase after debounce period when state changes
 */
export function useAutoSave({
  specId,
  projectId,
  stateJson,
  totalsJson,
  enabled = true,
  debounceMs = 3000,
  onSaveSuccess,
  onSaveError,
}) {
  const saveSpec = useSaveSpecification();
  const lastSavedStateRef = useRef(null);
  const timeoutRef = useRef(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(async () => {
    if (!enabled || !projectId) return;

    const stateStr = JSON.stringify(stateJson);

    // Skip if state hasn't changed
    if (stateStr === lastSavedStateRef.current) return;

    try {
      const result = await saveSpec.mutateAsync({
        specId,
        projectId,
        stateJson,
        totalsJson,
      });

      lastSavedStateRef.current = stateStr;
      setLastSaved(new Date());

      if (onSaveSuccess) {
        onSaveSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onSaveError) {
        onSaveError(error);
      }
      throw error;
    }
  }, [specId, projectId, stateJson, totalsJson, enabled, saveSpec, onSaveSuccess, onSaveError]);

  // Trigger debounced save when state changes
  useEffect(() => {
    if (!enabled || !projectId) return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      debouncedSave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [stateJson, debounceMs, enabled, projectId, debouncedSave]);

  // Manual save function (immediate)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return debouncedSave();
  }, [debouncedSave]);

  // Reset saved state tracking (e.g., when switching specs)
  const resetSavedState = useCallback(() => {
    lastSavedStateRef.current = null;
    setLastSaved(null);
  }, []);

  return {
    isSaving: saveSpec.isPending,
    lastSaved,
    saveNow,
    resetSavedState,
    error: saveSpec.error,
  };
}

export default useAutoSave;
