import { useState, useEffect, useCallback } from 'react';
import { CATEGORIES } from '../../data';
import { useCalculator } from '../../hooks/useCalculator';
import { useSaveSpecification, useSpecification } from '../../hooks/useSpecifications';
import useCalculatorStore from '../../stores/calculatorStore';
import { formatCurrency } from '../../lib/utils';
import { printSpecification } from '../../lib/printUtils';
import { PresetBundles } from '../PresetBundles';
import { StyleSelector } from '../StyleSelector';
import { CategorySection } from '../CategorySection';
import { OptionsSection } from '../OptionsSection';
import { SettingsSection } from '../SettingsSection';
import { PromoSection } from '../PromoSection';
import { SpecificationView } from '../SpecificationView';

/**
 * Calculator Modal - Opens calculator in a modal for creating/editing specifications
 */
export function CalculatorModal({ isOpen, onClose, projectId, projectName, specificationId = null }) {
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
    setProject,
    setSpecification,
    setLastSaved,
    resetSpecification,
  } = useCalculatorStore();

  // Save mutation
  const saveSpec = useSaveSpecification();

  // Load specification if editing
  const { data: loadedSpec, isLoading: specLoading } = useSpecification(specificationId);

  // Track loaded spec
  const [loadedSpecId, setLoadedSpecId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [view, setView] = useState('editor'); // 'editor' | 'preview'

  // Initialize on open
  useEffect(() => {
    if (isOpen && !initialized) {
      // Set project context
      setProject(projectId, projectName);
      
      if (!specificationId) {
        // Fresh calculator for new spec
        resetCalculator();
        resetSpecification();
        setLoadedSpecId(null);
      }
      setInitialized(true);
    }
  }, [isOpen, initialized, projectId, projectName, specificationId, setProject, resetCalculator, resetSpecification]);

  // Load spec state when editing
  useEffect(() => {
    if (specificationId && loadedSpec?.state_json && loadedSpec.id !== loadedSpecId) {
      loadState(loadedSpec.state_json);
      setLoadedSpecId(loadedSpec.id);
      setSpecification(loadedSpec.id, loadedSpec.version, loadedSpec.status === 'draft');
    }
  }, [specificationId, loadedSpec, loadedSpecId, loadState, setSpecification]);

  // Reset on close
  const handleClose = useCallback(() => {
    setInitialized(false);
    setLoadedSpecId(null);
    setView('editor');
    onClose();
  }, [onClose]);

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

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      const result = await saveSpec.mutateAsync({
        specId: specificationId || loadedSpecId,
        projectId: projectId,
        stateJson: getStateForSave(),
        totalsJson: totals,
      });

      setSpecification(result.id, result.version, true);
      setLastSaved(new Date());
      handleClose();
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [
    specificationId,
    loadedSpecId,
    projectId,
    getStateForSave,
    totals,
    saveSpec,
    setSpecification,
    setLastSaved,
    handleClose,
  ]);

  if (!isOpen) return null;

  // Safe number formatting
  const safeTotal = (val) => formatCurrency(val || 0);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-neutral-900">
              {specificationId ? 'Edit Specification' : 'New Specification'}
            </h2>
            <span className="text-sm text-neutral-500">
              for {projectName}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Specification / Back button */}
            <button
              onClick={() => setView(view === 'editor' ? 'preview' : 'editor')}
              disabled={!totals.grandTotal || totals.grandTotal === 0}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-neutral-700 rounded font-medium transition-colors"
            >
              {view === 'editor' ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Specification
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Editor
                </>
              )}
            </button>

            {/* Print button - only in preview mode */}
            {view === 'preview' && (
              <button
                onClick={printSpecification}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            )}
            
            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saveSpec.isPending || !totals.grandTotal || totals.grandTotal === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded font-medium transition-colors"
            >
              {saveSpec.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Draft
                </>
              )}
            </button>
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-50">
          {specLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                <p className="text-sm text-neutral-500">Loading specification...</p>
              </div>
            </div>
          ) : view === 'preview' ? (
            /* Specification Preview */
            <div className="p-6">
              <div id="specification-view" className="bg-white">
                <SpecificationView
                  totals={totals}
                  globalStyle={globalStyle}
                  usageRights={usageRights}
                  paymentModel={paymentModel}
                  noWrapper={true}
                />
              </div>
            </div>
          ) : (
            /* Editor */
            <div className="max-w-5xl mx-auto p-6 space-y-8">
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

              {/* Bottom spacing */}
              <div className="h-8" />
            </div>
          )}
        </div>

      {/* Footer with total */}
        <div className="bg-white border-t border-neutral-200 px-6 py-3 shrink-0">
          <div className="flex items-center justify-end gap-4">
            {(totals.discount || 0) > 0 && (
              <div className="text-sm text-emerald-600">
                <span>Discount:</span>
                <span className="ml-2 font-medium">-{safeTotal(totals.discount)}</span>
              </div>
            )}
            <div className="text-right">
              <span className="text-neutral-500 mr-3">Total:</span>
              <span className="text-2xl font-bold text-emerald-600">{safeTotal(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalculatorModal;
