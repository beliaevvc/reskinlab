import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CATEGORIES } from '../../data';
import { useCalculator } from '../../hooks/useCalculator';
import { useSaveSpecification, useSpecification } from '../../hooks/useSpecifications';
import useCalculatorStore from '../../stores/calculatorStore';
import {
  PresetBundles,
  StyleSelector,
  CategorySection,
  OptionsSection,
  SettingsSection,
  PromoSection,
  Sidebar,
  MobileFooter,
  SpecificationView,
} from '../../components';
import {
  ProjectSelector,
  DraftStatusBadge,
  SaveDraftButton,
} from '../../components/calculator';

/**
 * Calculator Page
 * Wrapper around existing calculator functionality with Supabase integration
 */
export function CalculatorPage() {
  const [view, setView] = useState('editor');
  const [searchParams] = useSearchParams();

  // Calculator state
  const calculator = useCalculator();
  const {
    globalStyle,
    usageRights,
    paymentModel,
    revisionRounds,
    appliedPromo,
    items,
    totals,
    setGlobalStyle,
    setUsageRights,
    setPaymentModel,
    setRevisionRounds,
    setAppliedPromo,
    updateItem,
    toggleDetails,
    applyPreset,
    loadState,
    resetCalculator,
  } = calculator;

  // Store context
  const {
    currentProjectId,
    currentSpecificationId,
    isDraft,
    setLastSaved,
    setSpecification,
    resetSpecification,
  } = useCalculatorStore();

  // Save mutation
  const saveSpec = useSaveSpecification();

  // Load specification ONLY if spec parameter is in URL (editing mode)
  const specIdFromUrl = searchParams.get('spec');
  const { data: loadedSpec, isLoading: specLoading } = useSpecification(specIdFromUrl);

  // Track if we've already loaded this spec to prevent re-loading
  const [loadedSpecId, setLoadedSpecId] = useState(null);
  const [hasResetOnMount, setHasResetOnMount] = useState(false);

  // Reset calculator when opening without spec parameter (fresh start)
  useEffect(() => {
    if (!specIdFromUrl && !hasResetOnMount) {
      console.log('Fresh calculator start - resetting state');
      resetCalculator();
      resetSpecification(); // Also clear store's spec context
      setLoadedSpecId(null);
      setHasResetOnMount(true);
    }
  }, [specIdFromUrl, hasResetOnMount, resetCalculator, resetSpecification]);

  // Load spec state into calculator when editing
  useEffect(() => {
    if (specIdFromUrl && loadedSpec?.state_json && loadedSpec.id !== loadedSpecId) {
      console.log('Loading specification state:', loadedSpec.id);
      loadState(loadedSpec.state_json);
      setLoadedSpecId(loadedSpec.id);
      
      // Update store with specification context
      if (loadedSpec.project_id) {
        setSpecification(loadedSpec.id, loadedSpec.status === 'draft');
      }
    }
  }, [specIdFromUrl, loadedSpec, loadedSpecId, loadState, setSpecification]);

  // Prepare state for saving
  const getStateForSave = useCallback(() => {
    return {
      globalStyle,
      usageRights,
      paymentModel,
      revisionRounds,
      appliedPromo,
      items,
    };
  }, [globalStyle, usageRights, paymentModel, revisionRounds, appliedPromo, items]);

  // Handle manual save
  const handleSave = useCallback(async () => {
    if (!currentProjectId) return;

    try {
      const result = await saveSpec.mutateAsync({
        specId: currentSpecificationId,
        projectId: currentProjectId,
        stateJson: getStateForSave(),
        totalsJson: totals,
      });

      // Update store with new spec info
      if (!currentSpecificationId) {
        setSpecification(result.id, result.version, true);
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [
    currentProjectId,
    currentSpecificationId,
    getStateForSave,
    totals,
    saveSpec,
    setSpecification,
    setLastSaved,
  ]);

  // Specification View
  if (view === 'specification') {
    return (
      <SpecificationView
        totals={totals}
        globalStyle={globalStyle}
        usageRights={usageRights}
        paymentModel={paymentModel}
        onBack={() => setView('editor')}
      />
    );
  }

  // Editor View
  return (
    <div className="pb-32 lg:pb-0">
      {/* Calculator Header with Project Selector - Sticky under AppHeader, full width */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-16 z-20 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-4 md:mb-6 lg:mb-8 px-4 md:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Project selector */}
          <div className="flex items-center gap-4">
            <ProjectSelector />
            <DraftStatusBadge
              isSaving={saveSpec.isPending}
              lastSaved={useCalculatorStore.getState().lastSaved}
            />
          </div>

          {/* Right: Save button */}
          <SaveDraftButton
            onSave={handleSave}
            isSaving={saveSpec.isPending}
            disabled={totals.grandTotal === 0}
            variant="primary"
          />
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Bundles */}
          <PresetBundles onApplyPreset={applyPreset} />

          {/* Visual Style Selector */}
          <StyleSelector
            globalStyle={globalStyle}
            onStyleChange={setGlobalStyle}
          />

          {/* Categories */}
          {CATEGORIES.map((category, index) => (
            <CategorySection
              key={index}
              category={category}
              items={items}
              onUpdate={updateItem}
              onToggleDetails={toggleDetails}
            />
          ))}

          {/* Options */}
          <OptionsSection
            revisionRounds={revisionRounds}
            onRevisionChange={setRevisionRounds}
          />

          {/* Settings */}
          <SettingsSection
            usageRights={usageRights}
            paymentModel={paymentModel}
            onUsageRightsChange={setUsageRights}
            onPaymentModelChange={setPaymentModel}
          />

          {/* Promo */}
          <PromoSection
            appliedPromo={appliedPromo}
            onApplyPromo={setAppliedPromo}
          />
        </div>

        {/* Sidebar (Desktop) */}
        <Sidebar
          totals={totals}
          usageRights={usageRights}
          paymentModel={paymentModel}
          onViewSpecification={() => setView('specification')}
        />
      </main>

      {/* Mobile Footer */}
      <MobileFooter
        totals={totals}
        usageRights={usageRights}
        paymentModel={paymentModel}
        onViewSpecification={() => setView('specification')}
      />
    </div>
  );
}

export default CalculatorPage;
