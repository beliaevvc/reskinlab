import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for managing calculator context (project/specification)
 * The actual calculator state (items, totals) is managed by useCalculator hook
 * This store only tracks the project/spec context and persistence
 */
const useCalculatorStore = create(
  persist(
    (set, get) => ({
      // Current project/spec context
      currentProjectId: null,
      currentProjectName: null,
      currentSpecificationId: null,
      currentSpecificationVersion: null,
      isDraft: true,
      lastSaved: null,
      isAutoSaveEnabled: true,

      // Set current project
      setProject: (projectId, projectName = null) =>
        set({
          currentProjectId: projectId,
          currentProjectName: projectName,
          // Reset specification when project changes
          currentSpecificationId: null,
          currentSpecificationVersion: null,
          isDraft: true,
          lastSaved: null,
        }),

      // Set current specification
      setSpecification: (specId, version, isDraft = true) =>
        set({
          currentSpecificationId: specId,
          currentSpecificationVersion: version,
          isDraft,
        }),

      // Update last saved time
      setLastSaved: (timestamp) => set({ lastSaved: timestamp }),

      // Toggle auto-save
      setAutoSaveEnabled: (enabled) => set({ isAutoSaveEnabled: enabled }),

      // Check if we have a project context
      hasProject: () => !!get().currentProjectId,

      // Check if we have a specification context
      hasSpecification: () => !!get().currentSpecificationId,

      // Check if current spec is editable (draft)
      isEditable: () => get().isDraft,

      // Reset all context
      reset: () =>
        set({
          currentProjectId: null,
          currentProjectName: null,
          currentSpecificationId: null,
          currentSpecificationVersion: null,
          isDraft: true,
          lastSaved: null,
        }),

      // Reset specification only (keep project)
      resetSpecification: () =>
        set({
          currentSpecificationId: null,
          currentSpecificationVersion: null,
          isDraft: true,
          lastSaved: null,
        }),
    }),
    {
      name: 'calculator-context',
      // Only persist project/spec IDs, not timestamps
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        currentProjectName: state.currentProjectName,
        currentSpecificationId: state.currentSpecificationId,
        currentSpecificationVersion: state.currentSpecificationVersion,
        isDraft: state.isDraft,
        isAutoSaveEnabled: state.isAutoSaveEnabled,
      }),
    }
  )
);

export default useCalculatorStore;
