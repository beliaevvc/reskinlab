import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import {
  CATEGORIES,
  ALL_ITEMS,
  STYLES,
  DEFAULT_STYLE,
  ANIMATIONS,
  USAGE_RIGHTS,
  DEFAULT_USAGE_RIGHTS,
  PAYMENT_MODELS,
  DEFAULT_PAYMENT_MODEL,
} from '../data';

/**
 * Local fallback data — used when Supabase is unavailable or prices haven't loaded yet.
 * These values are the same as in src/data/ files (FALLBACK source of truth).
 * When Supabase prices load, they OVERRIDE the numeric values (base, complexity, coeff).
 * Metadata (names, descriptions, details, tech) always comes from local files.
 */
function getLocalFallbackData() {
  return {
    categories: CATEGORIES,
    allItems: ALL_ITEMS,
    styles: STYLES,
    defaultStyle: DEFAULT_STYLE,
    animations: ANIMATIONS,
    usageRights: USAGE_RIGHTS,
    defaultUsageRights: DEFAULT_USAGE_RIGHTS,
    paymentModels: PAYMENT_MODELS,
    defaultPaymentModel: DEFAULT_PAYMENT_MODEL,
  };
}

/**
 * Merge Supabase price_configs into local data structures.
 * Local files provide metadata (names, descriptions, details).
 * Supabase provides numeric values (base, complexity, coeff).
 */
function mergePricingData(configs) {
  if (!configs || !Array.isArray(configs) || configs.length === 0) {
    return null;
  }

  // Build lookup maps from configs
  const itemPrices = {};   // { item_id: { base, complexity, surchargePercent } }
  const styleCoeffs = {};  // { style_id: coeff }
  const animCoeffs = {};   // { anim_id: coeff }
  const rightsCoeffs = {}; // { rights_id: coeff }
  const paymentCoeffs = {};// { payment_id: coeff }
  let revisionRoundCoeff = null;

  configs.forEach((cfg) => {
    const itemId = cfg.config_data?.item_id;
    const styleId = cfg.config_data?.style_id;
    const animId = cfg.config_data?.anim_id;
    const rightsId = cfg.config_data?.rights_id;
    const paymentId = cfg.config_data?.payment_id;

    switch (cfg.config_type) {
      case 'item_price':
        if (itemId) {
          if (!itemPrices[itemId]) itemPrices[itemId] = {};
          itemPrices[itemId].base = cfg.value;
        }
        break;
      case 'complexity':
        if (itemId) {
          if (!itemPrices[itemId]) itemPrices[itemId] = {};
          itemPrices[itemId].complexity = cfg.value;
        }
        break;
      case 'surcharge':
        if (itemId) {
          if (!itemPrices[itemId]) itemPrices[itemId] = {};
          itemPrices[itemId].surchargePercent = cfg.value;
        }
        break;
      case 'style':
        if (styleId) styleCoeffs[styleId] = cfg.value;
        break;
      case 'animation':
        if (animId) animCoeffs[animId] = cfg.value;
        break;
      case 'rights':
        if (rightsId) rightsCoeffs[rightsId] = cfg.value;
        break;
      case 'payment':
        if (paymentId) paymentCoeffs[paymentId] = cfg.value;
        break;
      case 'revision':
        if (cfg.name === 'revision_round_coeff') {
          revisionRoundCoeff = cfg.value;
        }
        break;
      default:
        break;
    }
  });

  // Merge into CATEGORIES (items get dynamic base/complexity/surchargePercent)
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.map((item) => {
      const override = itemPrices[item.id];
      if (!override) return item;
      return {
        ...item,
        base: override.base ?? item.base,
        complexity: override.complexity ?? item.complexity,
        surchargePercent: override.surchargePercent ?? item.surchargePercent,
      };
    }),
  }));

  const allItems = categories.flatMap((c) => c.items);

  // Merge STYLES (dynamic coeff)
  const styles = STYLES.map((s) => ({
    ...s,
    coeff: styleCoeffs[s.id] ?? s.coeff,
  }));

  // Merge ANIMATIONS (dynamic coeff)
  const animations = ANIMATIONS.map((a) => ({
    ...a,
    coeff: animCoeffs[a.id] ?? a.coeff,
  }));

  // Merge USAGE_RIGHTS (dynamic coeff)
  const usageRightsData = USAGE_RIGHTS.map((r) => ({
    ...r,
    coeff: rightsCoeffs[r.id] ?? r.coeff,
  }));

  // Merge PAYMENT_MODELS (dynamic coeff)
  const paymentModelsData = PAYMENT_MODELS.map((p) => ({
    ...p,
    coeff: paymentCoeffs[p.id] ?? p.coeff,
  }));

  // Defaults — find same ID from merged arrays
  const defaultStyle = styles.find((s) => s.id === DEFAULT_STYLE.id) || styles[0];
  const defaultUsageRights = usageRightsData.find((r) => r.id === DEFAULT_USAGE_RIGHTS.id) || usageRightsData[0];
  const defaultPaymentModel = paymentModelsData.find((p) => p.id === DEFAULT_PAYMENT_MODEL.id) || paymentModelsData[0];

  return {
    categories,
    allItems,
    styles,
    defaultStyle,
    animations,
    usageRights: usageRightsData,
    defaultUsageRights,
    paymentModels: paymentModelsData,
    defaultPaymentModel,
    revisionRoundCoeff: revisionRoundCoeff ?? 0.025,
  };
}

/**
 * Hook: Load dynamic pricing from Supabase price_configs.
 * Merges numeric values from DB with metadata from local files.
 * Falls back to local data if Supabase is unavailable.
 *
 * Usage:
 *   const { data, isLoading, isUsingFallback } = useDynamicPricing();
 *   const calculator = useCalculator(data);
 */
export function useDynamicPricing() {
  const {
    data: configs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-pricing'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_pricing');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes — prices don't change often
    gcTime: 1000 * 60 * 60,    // 1 hour garbage collection
    retry: 2,
    retryDelay: 1000,
  });

  const mergedData = useMemo(() => {
    return mergePricingData(configs);
  }, [configs]);

  // If loaded successfully, use merged data
  if (mergedData) {
    return {
      data: mergedData,
      isLoading: false,
      isUsingFallback: false,
      error: null,
    };
  }

  // If still loading, return local fallback (calculator works immediately)
  if (isLoading) {
    return {
      data: getLocalFallbackData(),
      isLoading: true,
      isUsingFallback: true,
      error: null,
    };
  }

  // If error, return local fallback with error info
  return {
    data: getLocalFallbackData(),
    isLoading: false,
    isUsingFallback: true,
    error: error?.message || 'Failed to load pricing',
  };
}

export default useDynamicPricing;
