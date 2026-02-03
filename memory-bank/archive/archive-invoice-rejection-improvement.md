# TASK ARCHIVE: Invoice Rejection Logic Improvement

## METADATA

| Field | Value |
|-------|-------|
| **Task ID** | `invoice-rejection-improvement` |
| **Complexity** | Level 2 (Simple Enhancement) |
| **Type** | UX/Logic Improvement |
| **Started** | 2026-02-03 |
| **Completed** | 2026-02-03 |
| **Status** | ARCHIVED ✅ |

---

## SUMMARY

Изменена логика отклонения инвойсов в административной панели. Вместо тотального отклонения (статус `rejected`), инвойсы теперь всегда возвращаются в статус `pending` с комментарием об отклонении. Комментарии видны как клиенту (для исправления ошибки), так и администратору (для отслеживания истории). Клиент получает возможность повторно оплатить инвойс после исправления ошибки.

**Ключевые изменения:**
- Упрощена форма отклонения: один вариант "Return to Pending" с обязательным комментарием
- Убрана опция "Reject Permanently"
- Добавлено отображение комментариев для клиента и админа
- Добавлен визуальный индикатор в списке инвойсов
- Убрана секция "Rejected" из списка инвойсов

---

## REQUIREMENTS

### Исходные требования

1. **Изменение логики отклонения**
   - Убрать тотальное отклонение (статус `rejected`)
   - Всегда возвращать инвойс в статус `pending` с комментариями
   - Комментарии должны быть видны клиенту

2. **Отображение комментариев**
   - Клиент должен видеть комментарий в конкретном инвойсе
   - У клиента должна быть возможность заново оплатить

3. **Дополнительное требование (после реализации)**
   - Админ также должен видеть комментарии об отклонении в инвойсах

---

## IMPLEMENTATION

### Core Logic Changes

#### `useInvoices.js` - Hook `useRejectPayment`

**Было:**
```javascript
mutationFn: async ({ invoiceId, rejectToPending, reason }) => {
  const updateData = rejectToPending
    ? { status: 'pending', tx_hash: null, rejection_reason: null }
    : { status: 'rejected', rejection_reason: reason || 'Payment rejected' };
  // ...
}
```

**Стало:**
```javascript
mutationFn: async ({ invoiceId, reason }) => {
  if (!reason || !reason.trim()) {
    throw new Error('Rejection reason is required');
  }
  const { data, error } = await supabase
    .from('invoices')
    .update({
      status: 'pending',
      tx_hash: null, // Clear the tx_hash so client can try again
      rejection_reason: reason.trim(), // Save rejection reason for client to see
    })
    .eq('id', invoiceId)
    .eq('status', 'awaiting_confirmation')
    .select()
    .single();
  // ...
}
```

**Изменения:**
- Убрана опция `rejectToPending` - всегда возврат в `pending`
- Комментарий обязателен (валидация на уровне мутации)
- Комментарий сохраняется в `rejection_reason` для отображения клиенту и админу
- `tx_hash` очищается для возможности повторной оплаты

### UI Changes

#### `InvoiceModal.jsx` - Форма отклонения

**Было:**
- Два варианта: "Return to Pending" и "Reject Permanently"
- Простое текстовое поле для комментария
- Комментарий требовался только для "Reject Permanently"

**Стало:**
- Один вариант: "Return to Pending" с обязательным комментарием
- `textarea` вместо `input` для удобства ввода длинных комментариев
- Placeholder с объяснением, что комментарий будет виден клиенту
- Валидация: кнопка неактивна без комментария

**Код:**
```jsx
<div className="space-y-3 p-3 bg-white rounded-lg border border-blue-200">
  <p className="text-sm font-medium text-neutral-700">Return to Pending with comment:</p>
  <textarea
    value={rejectReason}
    onChange={(e) => setRejectReason(e.target.value)}
    placeholder="Enter reason for rejection (required). This comment will be visible to the client."
    rows={3}
    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
  />
  <div className="flex gap-2">
    <button
      onClick={() => {
        if (rejectReason.trim()) {
          rejectPayment({ invoiceId: invoice.id, reason: rejectReason }, { ... });
        }
      }}
      disabled={isRejecting || !rejectReason.trim()}
      className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm font-medium rounded transition-colors"
    >
      {isRejecting ? 'Returning...' : 'Return to Pending'}
    </button>
    <button onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>Cancel</button>
  </div>
</div>
```

#### `InvoiceModal.jsx` - Отображение комментариев

**Для клиента:**
```jsx
{isPending && invoice.rejection_reason && !canManagePayments && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-amber-600">...</svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-amber-800">Payment Needs Correction</h3>
        <p className="text-amber-700 text-sm mt-1">{invoice.rejection_reason}</p>
        <p className="text-amber-600 text-xs mt-2">
          Please review the comment above and submit payment again with the correct transaction hash.
        </p>
      </div>
    </div>
  </div>
)}
```

**Для админа:**
```jsx
{isPending && invoice.rejection_reason && canManagePayments && (
  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-neutral-600">...</svg>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-neutral-800">Previous Rejection Comment</h3>
        <p className="text-neutral-700 text-sm mt-1">{invoice.rejection_reason}</p>
        <p className="text-neutral-500 text-xs mt-2">
          This invoice was previously rejected and returned to pending. Client can see this comment and retry payment.
        </p>
      </div>
    </div>
  </div>
)}
```

**Особенности:**
- Разные цветовые схемы: желтый (предупреждение) для клиента, нейтральный (информация) для админа
- Разные заголовки для понимания контекста
- Подсказки для пользователей о дальнейших действиях

#### `InvoiceCard.jsx` - Визуальный индикатор

**Добавлено:**
```jsx
{invoice.status === 'pending' && invoice.rejection_reason && (
  <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <span className="font-medium">Needs correction</span>
  </div>
)}
```

**Цель:** Быстрое понимание статуса инвойса в списке без открытия модального окна.

#### `InvoicesPage.jsx` - Убрана секция "Rejected"

**Было:**
```jsx
const rejectedInvoices = invoices?.filter((i) => i.status === 'rejected') || [];
// ...
{rejectedInvoices.length > 0 && (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-red-600">Rejected ({rejectedInvoices.length})</h2>
    {/* ... */}
  </div>
)}
```

**Стало:**
- Секция полностью удалена, так как статус `rejected` больше не используется

---

## FILES MODIFIED

### Core Logic
- `calculator/src/hooks/useInvoices.js`
  - Изменена функция `useRejectPayment`
  - Убрана опция `rejectToPending`
  - Добавлена валидация обязательного комментария
  - Изменен audit log action на `payment_rejected_to_pending`

### UI Components
- `calculator/src/components/project/InvoiceModal.jsx`
  - Упрощена форма отклонения (один вариант вместо двух)
  - Заменен `input` на `textarea` для комментария
  - Добавлено отображение комментария для клиента
  - Добавлено отображение комментария для админа
  - Улучшена валидация формы

- `calculator/src/pages/invoices/InvoicesPage.jsx`
  - Убрана секция "Rejected" из списка инвойсов
  - Удалена фильтрация по статусу `rejected`

- `calculator/src/components/invoices/InvoiceCard.jsx`
  - Добавлен визуальный индикатор "Needs correction" для инвойсов с `rejection_reason`

### Documentation
- `memory-bank/activeContext.md`
  - Обновлен раздел "Latest Changes" с информацией об изменениях

---

## TESTING RECOMMENDATIONS

### Functional Testing

1. **Админ отклоняет инвойс:**
   - [ ] Админ открывает инвойс со статусом `awaiting_confirmation`
   - [ ] Нажимает "Reject"
   - [ ] Вводит комментарий в textarea
   - [ ] Нажимает "Return to Pending"
   - [ ] Инвойс возвращается в статус `pending`
   - [ ] Комментарий сохраняется в `rejection_reason`

2. **Клиент видит комментарий:**
   - [ ] Клиент открывает инвойс со статусом `pending` и `rejection_reason`
   - [ ] Видит желтый блок "Payment Needs Correction"
   - [ ] Видит комментарий администратора
   - [ ] Видит подсказку о необходимости повторной оплаты

3. **Админ видит комментарий:**
   - [ ] Админ открывает инвойс со статусом `pending` и `rejection_reason`
   - [ ] Видит нейтральный блок "Previous Rejection Comment"
   - [ ] Видит комментарий, который был оставлен ранее
   - [ ] Видит пояснение о том, что клиент может видеть этот комментарий

4. **Повторная оплата:**
   - [ ] Клиент видит форму оплаты в инвойсе с комментарием об отклонении
   - [ ] Клиент может ввести новый transaction hash
   - [ ] Клиент может отправить платеж повторно
   - [ ] Инвойс переходит в статус `awaiting_confirmation`

5. **Визуальный индикатор:**
   - [ ] В списке инвойсов инвойсы с `rejection_reason` показывают индикатор "Needs correction"
   - [ ] Индикатор заметен, но не навязчив

### Validation Testing

1. **Валидация комментария:**
   - [ ] Невозможно отклонить инвойс без комментария
   - [ ] Пустой комментарий (только пробелы) не принимается
   - [ ] Кнопка "Return to Pending" неактивна без комментария
   - [ ] Ошибка валидации отображается пользователю

2. **Очистка данных:**
   - [ ] При отклонении `tx_hash` очищается
   - [ ] Комментарий сохраняется корректно
   - [ ] После успешного отклонения форма очищается

### UI/UX Testing

1. **Форма отклонения:**
   - [ ] Textarea удобна для ввода длинных комментариев
   - [ ] Placeholder понятен и информативен
   - [ ] Кнопки имеют правильные состояния (active/disabled)
   - [ ] Отмена работает корректно

2. **Отображение комментариев:**
   - [ ] Цветовые схемы соответствуют контексту
   - [ ] Заголовки понятны для каждой роли
   - [ ] Подсказки помогают пользователям понять дальнейшие действия

---

## LESSONS LEARNED

### Technical Insights

1. **Упрощение логики улучшает UX**
   - Убрать опцию "Reject Permanently" было правильным решением
   - Меньше вариантов выбора = меньше путаницы
   - Обязательный комментарий гарантирует обратную связь клиенту

2. **Разделение представления для разных ролей**
   - Один и тот же комментарий отображается по-разному для клиента и админа
   - Разные заголовки и стили помогают понять контекст
   - Условный рендеринг на основе `canManagePayments` работает эффективно

3. **Валидация на уровне мутации**
   - Валидация обязательного комментария в хуке обеспечивает консистентность
   - Ошибка валидации отображается через `onError` callback
   - Это предотвращает некорректные данные в базе

4. **Визуальная обратная связь важна**
   - Индикатор в списке помогает быстро понять статус
   - Разные цветовые схемы улучшают UX
   - Подсказки в UI помогают пользователям понять дальнейшие действия

### Process Insights

1. **Эффективность итеративного подхода**
   - Сначала реализована базовая логика
   - Затем добавлено отображение для клиента
   - После уточнения пользователя добавлено отображение для админа
   - Такой подход позволил быстро реагировать на требования

2. **Важность обратной совместимости**
   - Статус `rejected` оставлен в базе данных для обратной совместимости
   - Старые инвойсы со статусом `rejected` не сломаются
   - Не потребовалась миграция для удаления статуса

3. **Модульная структура кода**
   - Существующая функция `useRejectPayment` была легко модифицирована
   - Разделение логики между хуками и компонентами позволило точечные изменения
   - Не потребовалось рефакторинга всей системы инвойсов

---

## RELATED WORK

### Previous Tasks
- **Payment Confirmation Flow** (`archive-payment-confirmation-flow.md`)
  - Исходная реализация подтверждения и отклонения платежей
  - Добавление статуса `rejected` и поля `rejection_reason`
  - Эта задача улучшает логику, реализованную в предыдущей задаче

### Reflection Document
- `memory-bank/reflection/reflection-invoice-rejection-improvement.md`
  - Подробная рефлексия по выполненной задаче
  - Анализ вызовов и решений
  - Рекомендации для будущей работы

### Database Migrations
- `calculator/supabase/migrations/009_invoice_rejection.sql`
  - Миграция с добавлением статуса `rejected` и поля `rejection_reason`
  - Статус `rejected` больше не используется, но оставлен для обратной совместимости

---

## ACTION ITEMS FOR FUTURE WORK

### High Priority
1. **Email-уведомления клиенту об отклонении**
   - Добавить email-уведомление при отклонении инвойса с комментарием
   - Клиент может не заходить в систему регулярно
   - Уведомление поможет быстрее исправить ошибку

### Medium Priority
2. **История комментариев об отклонениях**
   - Создать таблицу `invoice_rejection_history` для хранения всех комментариев
   - Отслеживать даты и авторов комментариев
   - Позволит видеть, сколько раз инвойс был отклонен

### Low Priority
3. **Автоматическая очистка комментария при подтверждении**
   - При подтверждении платежа очищать `rejection_reason`
   - Данные будут более чистыми и актуальными

4. **Статистика отклонений**
   - Добавить метрики: сколько инвойсов было отклонено
   - Среднее количество попыток до подтверждения
   - Поможет выявить системные проблемы с платежами

---

## NOTES

- Статус `rejected` остался в базе данных и в `invoiceUtils.js` для обратной совместимости
- Старые инвойсы со статусом `rejected` будут работать корректно
- Миграция базы данных не потребовалась
- Все изменения обратно совместимы

---

## COMPLETION CHECKLIST

- [x] Implementation complete
- [x] Reflection complete
- [x] Archive document created
- [x] Cross-references updated
- [x] Memory Bank updated

**Status:** ✅ ARCHIVED
