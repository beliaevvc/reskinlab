import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORIES as LOCAL_CATEGORIES } from '../../data';
import { useCalculator } from '../../hooks/useCalculator';
import { useDynamicPricing } from '../../hooks/useDynamicPricing';
import { useSaveSharedSession, useLoadSharedSession } from '../../hooks/useSharedSessions';
import { printSpecification } from '../../lib/printUtils';
import { useLanguage } from '../../hooks/useLanguage';
import {
  PresetBundles,
  StyleSelector,
  CategorySection,
  OptionsSection,
  SettingsSection,
  PromoSection,
  SpecificationView,
  LanguageSwitcher,
} from '../../components';

/**
 * Public Calculator Page — accessible without authentication.
 * Users can build a selection, get a shareable code, print, and register to save.
 * Route: /shared/calculator and /shared/calculator/:code
 */
export function PublicCalculatorPage() {
  const { t } = useTranslation('calculator');
  const { getLocalized } = useLanguage();
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState('editor'); // 'editor' | 'specification'
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  // Dynamic pricing from Supabase (falls back to local data)
  const { data: pricingData, isUsingFallback } = useDynamicPricing();

  // Calculator state (receives dynamic pricing data)
  const {
    globalStyle,
    usageRights,
    paymentModel,
    revisionRounds,
    appliedPromo,
    defaultOrderType,
    items,
    totals,
    setGlobalStyle,
    setUsageRights,
    setPaymentModel,
    setRevisionRounds,
    setAppliedPromo,
    updateItem,
    setAllOrderType,
    toggleDetails,
    applyPreset,
    loadState,
    resetCalculator,
  } = useCalculator(pricingData);

  // Load shared session if URL has a code
  const {
    data: loadedSession,
    isLoading: sessionLoading,
    error: sessionError,
  } = useLoadSharedSession(urlCode);

  // Track if we loaded the session to prevent re-loading
  const [loadedCode, setLoadedCode] = useState(null);

  useEffect(() => {
    if (urlCode && loadedSession?.state_json && urlCode !== loadedCode) {
      loadState(loadedSession.state_json);
      setLoadedCode(urlCode);
    }
  }, [urlCode, loadedSession, loadedCode, loadState]);

  // Save shared session mutation
  const saveSession = useSaveSharedSession();

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

  // Handle "Get Code" button
  const handleGetCode = useCallback(async () => {
    try {
      const result = await saveSession.mutateAsync({
        stateJson: getStateForSave(),
        totalsJson: totals,
      });
      setGeneratedCode(result.short_code);
      setShowCodeModal(true);
      setCopied(false);
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  }, [saveSession, getStateForSave, totals]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!generatedCode) return;
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedCode]);

  // Copy share link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!generatedCode) return;
    const link = `${window.location.origin}/shared/calculator/${generatedCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [generatedCode]);

  // Navigate to register with code
  const handleRegister = useCallback(() => {
    const code = generatedCode || urlCode;
    if (code) {
      navigate(`/register?code=${code}`);
    } else {
      navigate('/register');
    }
  }, [generatedCode, urlCode, navigate]);

  // Loading session state
  if (urlCode && sessionLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">{t('public.loadingSelection')}</p>
        </div>
      </div>
    );
  }

  // Session error
  if (urlCode && sessionError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-neutral-900 mb-2">{t('public.invalidCode')}</h2>
          <p className="text-neutral-500 mb-6">{sessionError.message}</p>
          <button
            onClick={() => navigate('/shared/calculator')}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md font-medium transition-colors"
          >
            {t('actions.startFresh')}
          </button>
        </div>
      </div>
    );
  }

  // Specification View
  if (view === 'specification') {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Top bar */}
        <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-20 px-4 md:px-6 lg:px-8 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setView('editor')}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              {t('actions.backToEditor')}
            </button>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={printSpecification}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {t('actions.print')}
              </button>
              <button
                onClick={handleGetCode}
                disabled={saveSession.isPending || totals.grandTotal === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md font-medium transition-colors"
              >
                {saveSession.isPending ? t('actions.generating') : t('actions.getCode')}
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <SpecificationView
            totals={totals}
            globalStyle={globalStyle}
            usageRights={usageRights}
            paymentModel={paymentModel}
            onBack={() => setView('editor')}
          />
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div className="min-h-screen bg-neutral-50 pb-32 lg:pb-0">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium">
              {t('public.banner')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="text-white/90 hover:text-white hover:bg-white/20 [&_svg]:text-white/80" />
            <button
              onClick={handleRegister}
              className="text-sm font-medium px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors whitespace-nowrap"
            >
              {t('actions.registerToSave')}
            </button>
          </div>
        </div>
      </div>

      {/* Fallback pricing warning */}
      {isUsingFallback && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-amber-700 text-xs">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>{t('public.fallbackWarning')}</span>
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      <div className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-20 px-4 md:px-6 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-neutral-900">{t('public.calculatorTitle')}</h1>
            {urlCode && (
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-mono">
                {urlCode}
              </span>
            )}
          </div>
          {/* Action buttons — mobile/tablet only, hidden on desktop (sidebar has them) */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* View Specification */}
            <button
              onClick={() => setView('specification')}
              disabled={totals.grandTotal === 0}
              className="hidden sm:flex items-center gap-2 px-3 py-2 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-neutral-700 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('public.specification')}
            </button>
            {/* Get Code */}
            <button
              onClick={handleGetCode}
              disabled={saveSession.isPending || totals.grandTotal === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md text-sm font-medium transition-colors"
            >
              {saveSession.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t('actions.generating')}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {t('actions.getCode')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error from save */}
      {saveSession.error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {saveSession.error.message}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-2 space-y-10">
          {/* Quick Bundles */}
          <PresetBundles onApplyPreset={applyPreset} />

          {/* Visual Style Selector */}
          <StyleSelector
            globalStyle={globalStyle}
            onStyleChange={setGlobalStyle}
            styles={pricingData?.styles}
          />

          {/* Order Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">{t('options.orderType')}:</span>
            <div className="flex rounded-md border border-neutral-200 overflow-hidden">
              {[
                { id: 'art_only', labelKey: 'orderTypes.artOnly', activeCls: 'bg-blue-500 text-white' },
                { id: 'anim_only', labelKey: 'orderTypes.animOnly', activeCls: 'bg-violet-500 text-white' },
                { id: 'art_and_anim', labelKey: 'orderTypes.artAndAnim', activeCls: 'bg-emerald-500 text-white' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setAllOrderType(type.id)}
                  className={`text-xs font-medium px-3 py-1.5 transition-colors duration-100 cursor-pointer border-r last:border-r-0 border-neutral-200 ${
                    defaultOrderType === type.id ? type.activeCls : 'bg-white text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  {t(type.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          {(pricingData?.categories || LOCAL_CATEGORIES).map((category, index) => (
            <CategorySection
              key={index}
              category={category}
              items={items}
              onUpdate={updateItem}
              onToggleDetails={toggleDetails}
              animations={pricingData?.animations}
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
            usageRightsList={pricingData?.usageRights}
            paymentModelsList={pricingData?.paymentModels}
          />

          {/* Promo */}
          <PromoSection
            appliedPromo={appliedPromo}
            onApplyPromo={setAppliedPromo}
          />
        </div>

        {/* Sidebar (Desktop) — simplified, no save button */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Total */}
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="text-sm text-neutral-500 mb-1">{t('sidebar.estimatedTotal')}</div>
              <div className={`text-3xl font-bold font-mono ${totals.appliedPromo && totals.discountAmount > 0 ? 'text-emerald-600' : 'text-neutral-900'}`}>
                ${(totals.grandTotal || 0).toLocaleString()}
              </div>
              {totals.appliedPromo && totals.discountAmount > 0 && (
                <div className="text-sm text-neutral-400 font-mono line-through mt-1">
                  ${(totals.finalTotal || 0).toLocaleString()}
                </div>
              )}

              {/* Breakdown */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>{t('sidebar.production')}</span>
                  <span className="font-mono">${(totals.productionSum || 0).toLocaleString()}</span>
                </div>
                {totals.revisionCost > 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span>{t('sidebar.revisions')} ({totals.revisionRounds}x)</span>
                    <span className="font-mono">+${(totals.revisionCost || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-500">
                  <span>{t('sidebar.usageRights')} ({usageRights.id})</span>
                  <span className="font-mono">x{usageRights.coeff}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>{t('sidebar.payment')} ({getLocalized(paymentModel, 'name')})</span>
                  <span className="font-mono">x{paymentModel.coeff}</span>
                </div>
                {totals.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>{t('sidebar.discount')}</span>
                    <span className="font-mono">-${(totals.discountAmount || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleGetCode}
                disabled={saveSession.isPending || totals.grandTotal === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                {saveSession.isPending ? t('actions.generating') : t('actions.getSelectionCode')}
              </button>
              <button
                onClick={() => setView('specification')}
                disabled={totals.grandTotal === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-neutral-700 rounded-lg font-medium transition-colors"
              >
                {t('sidebar.viewSpecification')}
              </button>
              <button
                onClick={handleRegister}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                {t('actions.registerToSave')}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg lg:hidden z-30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500">{t('sidebar.total')}</div>
            <div className="text-xl font-bold font-mono text-neutral-900">
              ${(totals.grandTotal || 0).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('specification')}
              disabled={totals.grandTotal === 0}
              className="px-3 py-2 border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 text-neutral-700 rounded-md text-sm font-medium transition-colors"
            >
              {t('public.spec')}
            </button>
            <button
              onClick={handleGetCode}
              disabled={saveSession.isPending || totals.grandTotal === 0}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-md text-sm font-medium transition-colors"
            >
              {saveSession.isPending ? '...' : t('actions.getCode')}
            </button>
          </div>
        </div>
      </div>

      {/* Code Modal */}
      {showCodeModal && generatedCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCodeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {/* Close */}
            <button
              onClick={() => setShowCodeModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">{t('public.yourSelectionCode')}</h3>
              <p className="text-sm text-neutral-500 mb-6">
                {t('public.codeExpires')}
              </p>

              {/* Code */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mb-4">
                <div className="text-3xl font-mono font-bold tracking-widest text-neutral-900 mb-3">
                  {generatedCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  {copied ? t('share.copied') : t('public.copyCode')}
                </button>
              </div>

              {/* Share Link */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-6">
                <div className="text-xs text-neutral-400 mb-1">{t('public.shareLink')}</div>
                <div className="text-sm text-neutral-700 font-mono break-all mb-2">
                  {window.location.origin}/shared/calculator/{generatedCode}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                >
                  {t('public.copyLink')}
                </button>
              </div>

              {/* Register CTA */}
              <button
                onClick={handleRegister}
                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors mb-2"
              >
                {t('actions.registerToSaveSelection')}
              </button>
              <p className="text-xs text-neutral-400">
                {t('public.alreadyHaveAccount')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicCalculatorPage;
