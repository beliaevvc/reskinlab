import { supabase } from './supabase';
import {
  getTemplateForClient,
  getAvailableVariables,
  resolveVariables,
  renderTemplateContent,
} from './offerVariables';

/**
 * Generate unique offer number: OFF-YYYY-NNNNN
 * Includes random suffix to avoid race conditions
 */
export async function generateOfferNumber() {
  const year = new Date().getFullYear();
  const prefix = `OFF-${year}-`;

  // Get last offer number for this year
  const { data, error } = await supabase
    .from('offers')
    .select('number')
    .like('number', `${prefix}%`)
    .order('number', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching last offer number:', error);
  }

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].number;
    const numPart = parseInt(lastNumber.split('-')[2], 10);
    nextNumber = numPart + 1;
  }

  // Add random suffix to prevent collisions in race conditions
  const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  return `${prefix}${String(nextNumber).padStart(5, '0')}-${randomSuffix}`;
}

/**
 * Get legal text from admin-managed template system.
 * Falls back to hardcoded text if no template is found.
 * 
 * @param {Object} spec - Specification with totals_json, state_json
 * @param {Object} project - Project record
 * @param {Object} client - Client record with profile
 * @returns {Promise<{text: string, templateId: string|null, termsVersion: string}>}
 */
export async function getLegalTextFromTemplate(spec, project, client) {
  try {
    // 1. Get the appropriate template for this client/project
    const clientId = project?.client_id || client?.profile?.id || client?.id;
    const template = await getTemplateForClient(clientId, project?.id);

    const templateText = template?.content?.text;
    if (!template || !templateText) {
      // Fallback to legacy hardcoded text
      return {
        text: getLegalTextFallback(spec),
        templateId: null,
        termsVersion: '1.0',
      };
    }

    // 2. Resolve variables
    const variables = await getAvailableVariables();
    const resolvedVars = resolveVariables(spec, project, client, variables);

    // Override terms_version from template
    resolvedVars.terms_version = template.terms_version || '1.0';

    // 3. Render template with variables
    const text = renderTemplateContent(templateText, resolvedVars);

    return {
      text,
      templateId: template.id,
      termsVersion: template.terms_version || '1.0',
    };
  } catch (err) {
    console.error('Error rendering template, falling back to hardcoded:', err);
    return {
      text: getLegalTextFallback(spec),
      templateId: null,
      termsVersion: '1.0',
    };
  }
}

/**
 * Legacy hardcoded legal text — used as fallback when no template exists.
 * @deprecated Use getLegalTextFromTemplate instead
 */
export function getLegalText(spec) {
  return getLegalTextFallback(spec);
}

function getLegalTextFallback(spec) {
  const totals = spec?.totals_json || {};
  const grandTotal = totals.grandTotal || 0;
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return `ОФЕРТА НА ОКАЗАНИЕ УСЛУГ ПО СОЗДАНИЮ ВИЗУАЛЬНОГО КОНТЕНТА

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. ПРЕДМЕТ ОФЕРТЫ

Исполнитель (ReSkin Lab, далее — «Студия») настоящим предлагает Заказчику 
(далее — «Клиент») заключить договор на оказание услуг по созданию визуальных 
материалов в соответствии с прилагаемой Спецификацией.

Спецификация является неотъемлемой частью настоящей оферты и содержит детальное 
описание объёма работ, включая:
• Перечень создаваемых визуальных элементов
• Выбранный стиль оформления
• Условия использования (лицензия)
• Количество включённых раундов правок

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ

Общая стоимость услуг: ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD

Оплата производится в криптовалюте USDT (Tether) на кошелёк Студии.
Поддерживаемые сети: TRC20 (Tron) или ERC20 (Ethereum).

График платежей:
• 50% — предоплата (до начала работ)
• 25% — по завершении этапа производства
• 25% — финальный платёж (перед передачей материалов)

Примечание: Конкретные суммы и сроки платежей указаны в выставленных инвойсах.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. СРОКИ ВЫПОЛНЕНИЯ

Сроки выполнения работ зависят от объёма проекта и текущей загрузки Студии.
Ориентировочные сроки будут согласованы после получения предоплаты.

Оферта действительна до: ${validUntil.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}

После истечения срока действия оферты Студия оставляет за собой право 
пересмотреть условия и стоимость работ.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. АКЦЕПТ ОФЕРТЫ

Акцепт (принятие) настоящей оферты осуществляется Клиентом путём:
1. Ознакомления с полным текстом оферты и Спецификации
2. Подтверждения согласия с условиями (нажатие кнопки «Принять оферту»)
3. Внесения предоплаты согласно выставленному инвойсу

Момент акцепта фиксируется в системе с сохранением:
• Даты и времени акцепта
• IP-адреса Клиента
• Идентификатора браузера
• Полной копии условий оферты

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ

5.1. Все создаваемые материалы являются объектами интеллектуальной собственности.

5.2. Права на использование передаются Клиенту в соответствии с выбранной 
лицензией, указанной в Спецификации, после полной оплаты.

5.3. До момента полной оплаты все права на материалы принадлежат Студии.

5.4. Студия сохраняет право использовать созданные материалы в портфолио 
и маркетинговых целях, если иное не оговорено отдельно.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. ПРАВКИ И ИЗМЕНЕНИЯ

6.1. Количество раундов правок, включённых в стоимость, указано в Спецификации.

6.2. Дополнительные правки сверх включённых оплачиваются отдельно по 
согласованным тарифам.

6.3. Существенные изменения в объёме или концепции проекта после начала работ 
могут потребовать пересмотра стоимости и сроков.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. РАЗРЕШЕНИЕ СПОРОВ

7.1. Стороны обязуются решать все возникающие разногласия путём переговоров.

7.2. При невозможности достичь согласия споры подлежат разрешению в соответствии 
с применимым законодательством.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

8. ПРОЧИЕ УСЛОВИЯ

8.1. Настоящая оферта является публичной и адресована неопределённому кругу лиц.

8.2. Клиент подтверждает, что ознакомлен со всеми условиями оферты, понимает их 
и принимает в полном объёме.

8.3. Студия оставляет за собой право вносить изменения в типовые условия оферты. 
Принятые офферты сохраняют свои условия на момент акцепта.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Версия условий: 1.0
Дата публикации: ${new Date().toLocaleDateString('ru-RU')}

© ReSkin Lab — Premium Visual Content Studio
`;
}

/**
 * Get offer validity period (30 days from now)
 */
export function getOfferValidUntil() {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);
  return validUntil.toISOString();
}

/**
 * Check if offer is expired
 */
export function isOfferExpired(offer) {
  if (!offer?.valid_until) return false;
  return new Date(offer.valid_until) < new Date();
}

/**
 * Get offer status display info
 */
export function getOfferStatusInfo(status, validUntil) {
  const isExpired = validUntil && new Date(validUntil) < new Date();

  if (status === 'accepted') {
    return {
      label: 'Accepted',
      color: 'emerald',
      bgClass: 'bg-emerald-100',
      textClass: 'text-emerald-800',
    };
  }

  if (status === 'cancelled') {
    return {
      label: 'Cancelled',
      color: 'red',
      bgClass: 'bg-red-100',
      textClass: 'text-red-800',
    };
  }

  if (status === 'expired' || isExpired) {
    return {
      label: 'Expired',
      color: 'neutral',
      bgClass: 'bg-neutral-100',
      textClass: 'text-neutral-800',
    };
  }

  // pending
  return {
    label: 'Pending',
    color: 'amber',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
  };
}
