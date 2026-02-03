import { STYLES, DEFAULT_STYLE } from '../data/styles';
import { USAGE_RIGHTS, DEFAULT_USAGE_RIGHTS } from '../data/usageRights';
import { PAYMENT_MODELS, DEFAULT_PAYMENT_MODEL } from '../data/paymentModels';

/**
 * Преобразует данные спецификации из БД в формат для SpecificationView
 * @param {Object} specification - объект спецификации из БД
 * @returns {Object} - данные в формате для SpecificationView
 */
export function prepareSpecificationForView(specification) {
  if (!specification) return null;

  const totals = specification.totals_json || {};
  const state = specification.state_json || {};

  // Находим объекты стиля, прав использования и модели оплаты
  // Если объект уже полный (сохранен как полный объект), используем его напрямую
  // Иначе ищем по ID в константах
  const globalStyle = state.globalStyle?.id && state.globalStyle?.name && state.globalStyle?.coeff
    ? state.globalStyle
    : STYLES.find(s => s.id === state.globalStyle?.id) || DEFAULT_STYLE;
  const usageRights = state.usageRights?.id && state.usageRights?.name && state.usageRights?.coeff
    ? state.usageRights
    : USAGE_RIGHTS.find(u => u.id === state.usageRights?.id) || DEFAULT_USAGE_RIGHTS;
  const paymentModel = state.paymentModel?.id && state.paymentModel?.name && state.paymentModel?.coeff
    ? state.paymentModel
    : PAYMENT_MODELS.find(p => p.id === state.paymentModel?.id) || DEFAULT_PAYMENT_MODEL;

  // Generate spec number from ID (last 4 chars of UUID, uppercase)
  const specNumber = specification.id 
    ? specification.id.slice(-4).toUpperCase() 
    : null;
  
  // Format date
  const specDate = specification.created_at
    ? new Date(specification.created_at).toLocaleDateString()
    : null;

  return {
    totals: {
      lineItems: totals.lineItems || [],
      productionSum: totals.productionSum || 0,
      revisionCost: totals.revisionCost || 0,
      revisionRounds: totals.revisionRounds || state.revisionRounds || 0,
      withRights: totals.withRights || 0,
      finalTotal: totals.finalTotal || totals.grandTotal || 0,
      grandTotal: totals.grandTotal || 0,
      discountAmount: totals.discountAmount || 0,
      appliedPromo: totals.appliedPromo || state.appliedPromo || null,
    },
    globalStyle,
    usageRights,
    paymentModel,
    specNumber,
    specDate,
  };
}
