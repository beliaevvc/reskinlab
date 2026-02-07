import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  STYLES,
  DEFAULT_STYLE,
  ANIMATIONS,
  ALL_ITEMS,
  USAGE_RIGHTS,
  DEFAULT_USAGE_RIGHTS,
  PAYMENT_MODELS,
  DEFAULT_PAYMENT_MODEL,
} from '../data';

/**
 * Создаёт начальное состояние для всех items
 */
const createInitialItemsState = () => {
  const initial = {};
  ALL_ITEMS.forEach((item) => {
    initial[item.id] = { qty: 0, anim: 'none', expanded: false };
  });
  return initial;
};

/**
 * Хук для управления состоянием калькулятора и расчётов
 */
export function useCalculator() {
  // Основные состояния
  const [globalStyle, setGlobalStyle] = useState(DEFAULT_STYLE);
  const [usageRights, setUsageRights] = useState(DEFAULT_USAGE_RIGHTS);
  const [paymentModel, setPaymentModel] = useState(DEFAULT_PAYMENT_MODEL);
  const [revisionRounds, setRevisionRounds] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [items, setItems] = useState(createInitialItemsState);

  // Minimum order config (set externally from useMinimumOrder hook)
  const [minimumOrderConfig, setMinimumOrderConfig] = useState({
    amount: 0,
    isFirstOrder: false,
    isEnabled: false,
  });

  // Синхронизация state при добавлении новых items (Исправление бага с отображением)
  useEffect(() => {
    setItems((prev) => {
      const next = { ...prev };
      let changed = false;
      ALL_ITEMS.forEach((item) => {
        if (!next[item.id]) {
          next[item.id] = { qty: 0, anim: 'none', expanded: false };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  // Обновление отдельного item
  const updateItem = useCallback((id, field, value) => {
    setItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  // Переключение детализации item
  const toggleDetails = useCallback((id) => {
    setItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], expanded: !prev[id].expanded },
    }));
  }, []);

  // Применение пресета
  const applyPreset = useCallback((preset) => {
    const style = STYLES.find((s) => s.id === preset.styleId);
    if (style) setGlobalStyle(style);

    const newItems = {};
    ALL_ITEMS.forEach((item) => {
      const qty = preset.items[item.id] || 0;
      newItems[item.id] = {
        qty,
        anim: qty > 0 ? preset.animId : 'none',
        expanded: false,
      };
    });
    setItems(newItems);
  }, []);

  // Загрузка полного состояния (для редактирования спецификации)
  const loadState = useCallback((state) => {
    if (!state) return;

    // Загрузка стиля
    if (state.globalStyle) {
      const style = STYLES.find((s) => s.id === state.globalStyle.id) || state.globalStyle;
      setGlobalStyle(style);
    }

    // Загрузка прав использования
    if (state.usageRights) {
      const rights = USAGE_RIGHTS.find((r) => r.id === state.usageRights.id) || state.usageRights;
      setUsageRights(rights);
    }

    // Загрузка модели оплаты
    if (state.paymentModel) {
      const model = PAYMENT_MODELS.find((m) => m.id === state.paymentModel.id) || state.paymentModel;
      setPaymentModel(model);
    }

    // Загрузка раундов ревизий
    if (state.revisionRounds !== undefined) {
      setRevisionRounds(state.revisionRounds);
    }

    // Загрузка промокода
    if (state.appliedPromo !== undefined) {
      setAppliedPromo(state.appliedPromo);
    }

    // Загрузка items (ключевая часть!)
    if (state.items) {
      const newItems = {};
      ALL_ITEMS.forEach((item) => {
        const savedItem = state.items[item.id];
        if (savedItem) {
          newItems[item.id] = {
            qty: savedItem.qty || 0,
            anim: savedItem.anim || 'none',
            expanded: false,
          };
        } else {
          newItems[item.id] = { qty: 0, anim: 'none', expanded: false };
        }
      });
      setItems(newItems);
    }
  }, []);

  // Сброс калькулятора
  const resetCalculator = useCallback(() => {
    setGlobalStyle(DEFAULT_STYLE);
    setUsageRights(DEFAULT_USAGE_RIGHTS);
    setPaymentModel(DEFAULT_PAYMENT_MODEL);
    setRevisionRounds(0);
    setAppliedPromo(null);
    setItems(createInitialItemsState());
  }, []);

  // Расчёт итогов
  const totals = useMemo(() => {
    let productionSum = 0;
    const lineItems = [];

    ALL_ITEMS.forEach((item) => {
      const state = items[item.id];
      if (!state || state.qty <= 0) return;

      const animObj = ANIMATIONS.find((a) => a.id === state.anim) || ANIMATIONS[0];

      // 1. Base Art Price
      const baseArtPrice = item.base * globalStyle.coeff;

      // 2. Animation Price
      let animCost = 0;
      if (animObj.id !== 'none') {
        const complexity = item.complexity || 1.0;
        animCost = baseArtPrice * animObj.coeff * complexity;
      }

      // 3. Unit Total = Art + Anim
      const unitPrice = baseArtPrice + animCost;
      const total = unitPrice * state.qty;

      productionSum += total;
      lineItems.push({
        ...item,
        qty: state.qty,
        anim: animObj,
        unitPrice,
        total,
        details: item.details,
        base: item.base,
      });
    });

    const revisionCost = productionSum * (0.025 * revisionRounds);
    const subtotal = productionSum + revisionCost;
    const withRights = subtotal * usageRights.coeff;
    const finalTotal = withRights * paymentModel.coeff;
    let discountAmount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'fixed') {
        discountAmount = Math.min(appliedPromo.discount, finalTotal);
      } else {
        discountAmount = finalTotal * appliedPromo.discount;
      }
    }

    // Minimum order enforcement for first order in project
    let grandTotal = finalTotal - discountAmount;
    let minimumApplied = false;
    const { amount: minAmount, isFirstOrder: minFirstOrder, isEnabled: minEnabled } = minimumOrderConfig;

    if (minEnabled && minFirstOrder && minAmount > 0 && grandTotal < minAmount && finalTotal >= minAmount) {
      // Promo cannot reduce below minimum — cap the discount
      grandTotal = minAmount;
      discountAmount = finalTotal - minAmount;
      minimumApplied = true;
    }

    return {
      productionSum,
      revisionCost,
      revisionRounds,
      withRights,
      finalTotal,
      discountAmount,
      grandTotal,
      appliedPromo,
      lineItems,
      minimumApplied,
      minimumOrderAmount: minEnabled && minFirstOrder ? minAmount : 0,
    };
  }, [items, globalStyle, usageRights, paymentModel, revisionRounds, appliedPromo, minimumOrderConfig]);

  return {
    // State
    globalStyle,
    usageRights,
    paymentModel,
    revisionRounds,
    appliedPromo,
    items,
    totals,

    // Actions
    setGlobalStyle,
    setUsageRights,
    setPaymentModel,
    setRevisionRounds,
    setAppliedPromo,
    setMinimumOrderConfig,
    updateItem,
    toggleDetails,
    applyPreset,
    loadState,
    resetCalculator,
  };
}

export default useCalculator;
