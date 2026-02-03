import { supabase } from './supabase';

/**
 * Generate unique invoice number: INV-YYYY-NNNNN
 */
export async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Get last invoice number for this year
  const { data, error } = await supabase
    .from('invoices')
    .select('number')
    .like('number', `${prefix}%`)
    .order('number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last invoice number:', error);
  }

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].number;
    const numPart = parseInt(lastNumber.split('-')[2], 10);
    nextNumber = numPart + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Production workflow stages (same as in SpecificationView)
 */
const WORKFLOW_STAGES = [
  { id: 'briefing', name: 'Briefing', always: true },
  { id: 'moodboard', name: 'Moodboard & Concept', always: true },
  { id: 'symbols', name: 'Symbol Design', condition: 'hasSymbols' },
  { id: 'ui', name: 'UI & Layout', always: true },
  { id: 'animation', name: 'Animation Production', condition: 'hasAnimation' },
  { id: 'delivery', name: 'Final Delivery', always: true },
];

/**
 * Calculate payment milestones based on specification data
 * This matches the logic in SpecificationView's PaymentSchedule
 */
export function calculatePaymentMilestones(specification) {
  const state = specification.state_json || {};
  const totals = specification.totals_json || {};
  const paymentModel = state.paymentModel || { id: 'Standard' };
  const items = Array.isArray(state.items) ? state.items : [];
  const grandTotal = totals.grandTotal || 0;

  // Determine which stages are active
  const hasSymbols = items.length > 0 && items.some(item => item.symbols?.id && item.symbols?.id !== 'none');
  const hasAnimation = items.length > 0 && items.some(item => item.anim?.id && item.anim?.id !== 'none');

  const activeStages = WORKFLOW_STAGES.filter(stage => {
    if (stage.always) return true;
    if (stage.condition === 'hasSymbols') return hasSymbols;
    if (stage.condition === 'hasAnimation') return hasAnimation;
    return false;
  });

  // Payable stages exclude briefing (it's part of upfront/project start)
  const payableStages = activeStages.filter(s => s.id !== 'briefing');
  const stageCount = payableStages.length;

  const milestones = [];
  let order = 1;

  // Calculate breakdown based on payment model
  switch (paymentModel.id) {
    case 'FullPre': {
      // 100% upfront
      milestones.push({
        id: 'full',
        name: 'Full Prepayment',
        percent: 100,
        amount: grandTotal,
        order: order++,
      });
      break;
    }
    case 'Zero': {
      // 0% upfront, all split across stages
      const perStageAmount = grandTotal / stageCount;
      const perStagePercent = Math.round(100 / stageCount);
      
      payableStages.forEach(stage => {
        milestones.push({
          id: stage.id,
          name: stage.name,
          percent: perStagePercent,
          amount: perStageAmount,
          order: order++,
        });
      });
      break;
    }
    case 'Standard':
    default: {
      // 15% upfront + 85% split across stages
      const upfrontPercent = 15;
      const upfrontAmount = grandTotal * 0.15;
      const milestoneTotal = grandTotal * 0.85;
      const perStageAmount = milestoneTotal / stageCount;
      const perStagePercent = Math.round(85 / stageCount);

      // Upfront payment
      milestones.push({
        id: 'upfront',
        name: 'Upfront Payment',
        percent: upfrontPercent,
        amount: upfrontAmount,
        order: order++,
      });

      // Stage payments
      payableStages.forEach(stage => {
        milestones.push({
          id: stage.id,
          name: stage.name,
          percent: perStagePercent,
          amount: perStageAmount,
          order: order++,
        });
      });
      break;
    }
  }

  return milestones;
}

/**
 * Legacy: Get milestones based on payment model (fallback)
 * @deprecated Use calculatePaymentMilestones instead
 */
export function getMilestones(paymentModel) {
  const modelId = paymentModel?.id || 'Standard';

  switch (modelId) {
    case 'FullPre':
      return [{ id: 'full', name: 'Full Payment', percent: 100, order: 1 }];
    case 'Zero':
      return [
        { id: 'stage1', name: 'Stage 1', percent: 33, order: 1 },
        { id: 'stage2', name: 'Stage 2', percent: 33, order: 2 },
        { id: 'stage3', name: 'Final Delivery', percent: 34, order: 3 },
      ];
    case 'Standard':
    default:
      return [
        { id: 'upfront', name: 'Upfront Payment', percent: 15, order: 1 },
        { id: 'midpoint', name: 'Midpoint Payment', percent: 42, order: 2 },
        { id: 'final', name: 'Final Payment', percent: 43, order: 3 },
      ];
  }
}

/**
 * Calculate invoice due date
 * First invoice: 7 days, subsequent: 7 days after previous
 */
export function getInvoiceDueDate(milestoneOrder) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7 * milestoneOrder);
  return dueDate.toISOString();
}

/**
 * Wallet addresses for payments
 * In production, these would come from database or admin config
 */
export const WALLET_ADDRESSES = {
  TRC20: 'TYDzsYUEpvnYmQk4zGP9sWWcTEd2MiAtW7',  // Example Tron address
  ERC20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0aB1d', // Example Ethereum address
};

/**
 * Get invoice status display info
 */
export function getInvoiceStatusInfo(status) {
  switch (status) {
    case 'paid':
      return {
        label: 'Paid',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
      };
    case 'awaiting_confirmation':
      return {
        label: 'Awaiting Confirmation',
        color: 'blue',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800',
      };
    case 'overdue':
      return {
        label: 'Overdue',
        color: 'red',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'red',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'neutral',
        bgClass: 'bg-neutral-100',
        textClass: 'text-neutral-800',
      };
    case 'pending':
    default:
      return {
        label: 'Pending',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
      };
  }
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice) {
  if (invoice.status !== 'pending') return false;
  if (!invoice.due_date) return false;
  return new Date(invoice.due_date) < new Date();
}

/**
 * Format amount for display
 */
export function formatInvoiceAmount(amount, currency = 'USDT') {
  return `${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}
