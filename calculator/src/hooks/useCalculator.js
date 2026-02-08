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
    initial[item.id] = {
      qty: 0,
      anim: 'none',
      orderType: item.noOrderType ? 'art_only' : 'art_and_anim',
      expanded: false,
    };
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
  const [defaultOrderType, setDefaultOrderType] = useState('art_and_anim');
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
          next[item.id] = {
            qty: 0,
            anim: 'none',
            orderType: item.noOrderType ? 'art_only' : 'art_and_anim',
            expanded: false,
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  // Обновление отдельного item
  const updateItem = useCallback((id, field, value) => {
    setItems((prev) => {
      const current = prev[id];
      // Find item definition for special flags
      const itemDef = ALL_ITEMS.find((i) => i.id === id);

      // Enforce maxQty limit
      if (field === 'qty' && itemDef?.maxQty && value > itemDef.maxQty) {
        value = itemDef.maxQty;
      }

      // When activating an item (qty goes from 0 to >0), apply defaultOrderType
      if (field === 'qty' && value > 0 && current.qty === 0) {
        // Items with noOrderType keep their fixed orderType and anim
        if (itemDef?.noOrderType) {
          return {
            ...prev,
            [id]: { ...current, qty: value },
          };
        }
        const newAnim = defaultOrderType === 'art_only' ? 'none'
          : current.anim === 'none' ? 'AN-L'
          : current.anim;
        return {
          ...prev,
          [id]: { ...current, qty: value, orderType: defaultOrderType, anim: newAnim },
        };
      }
      return {
        ...prev,
        [id]: { ...current, [field]: value },
      };
    });
  }, [defaultOrderType]);

  // Массовое переключение orderType для всех items + установка дефолта
  const setAllOrderType = useCallback((orderType) => {
    setDefaultOrderType(orderType);
    setItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        // Skip items with noOrderType — they keep their fixed type
        const itemDef = ALL_ITEMS.find((i) => i.id === id);
        if (itemDef?.noOrderType) return;

        next[id] = { ...next[id], orderType };
        if (next[id].qty > 0) {
          if (orderType === 'art_only') {
            next[id].anim = 'none';
          } else if (next[id].anim === 'none') {
            next[id].anim = 'AN-L';
          }
        }
      });
      return next;
    });
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
        anim: item.noAnimation ? 'none' : (qty > 0 ? preset.animId : 'none'),
        orderType: item.noOrderType ? 'art_only' : 'art_and_anim',
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
        const defaultOrderType = item.noOrderType ? 'art_only' : 'art_and_anim';
        if (savedItem) {
          newItems[item.id] = {
            qty: savedItem.qty || 0,
            anim: item.noAnimation ? 'none' : (savedItem.anim || 'none'),
            orderType: item.noOrderType ? 'art_only' : (savedItem.orderType || 'art_and_anim'),
            expanded: false,
          };
        } else {
          newItems[item.id] = { qty: 0, anim: 'none', orderType: defaultOrderType, expanded: false };
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
    setDefaultOrderType('art_and_anim');
    setItems(createInitialItemsState());
  }, []);

  // Расчёт итогов (двухпроходный — для items с surchargePercent)
  const totals = useMemo(() => {
    let productionSum = 0;
    const lineItems = [];

    // --- Проход 1: посчитать сумму всех обычных items (без surcharge) ---
    let regularItemsSum = 0;
    const surchargeItems = [];

    ALL_ITEMS.forEach((item) => {
      const state = items[item.id];
      if (!state || state.qty <= 0) return;

      // Items с surchargePercent обрабатываются во втором проходе
      if (item.surchargePercent) {
        surchargeItems.push(item);
        return;
      }

      const animObj = ANIMATIONS.find((a) => a.id === state.anim) || ANIMATIONS[0];
      const orderType = state.orderType || 'art_and_anim';

      // 1. Base Art Price (noStyleCoeff — стиль не влияет)
      const baseArtPrice = item.noStyleCoeff
        ? item.base
        : item.base * globalStyle.coeff;

      // 2. Animation Price (noAnimation — пропустить)
      let animCost = 0;
      if (!item.noAnimation && animObj.id !== 'none') {
        const complexity = item.complexity || 1.0;
        animCost = baseArtPrice * animObj.coeff * complexity;
      }

      // 3. Unit Total based on orderType
      let unitPrice;
      if (item.noOrderType || orderType === 'art_only') {
        unitPrice = baseArtPrice;
      } else if (orderType === 'anim_only') {
        unitPrice = animCost; // 0 if anim === 'none'
      } else {
        // art_and_anim (default)
        unitPrice = baseArtPrice + animCost;
      }

      const total = unitPrice * state.qty;

      regularItemsSum += total;
      lineItems.push({
        ...item,
        qty: state.qty,
        anim: animObj,
        orderType,
        unitPrice,
        total,
        details: item.details,
        base: item.base,
      });
    });

    // --- Проход 2: посчитать items с surchargePercent (Concept Document) ---
    surchargeItems.forEach((item) => {
      const state = items[item.id];
      const unitPrice = item.base + (item.surchargePercent * regularItemsSum);
      const total = unitPrice * state.qty;

      lineItems.unshift({
        ...item,
        qty: state.qty,
        anim: ANIMATIONS[0], // none
        orderType: 'art_only',
        unitPrice,
        total,
        details: item.details,
        base: item.base,
      });
    });

    productionSum = regularItemsSum + surchargeItems.reduce((sum, item) => {
      const state = items[item.id];
      const unitPrice = item.base + (item.surchargePercent * regularItemsSum);
      return sum + (unitPrice * state.qty);
    }, 0);

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
    defaultOrderType,
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
    setAllOrderType,
    toggleDetails,
    applyPreset,
    loadState,
    resetCalculator,
  };
}

export default useCalculator;
