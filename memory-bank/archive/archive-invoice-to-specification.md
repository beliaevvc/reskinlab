# TASK ARCHIVE: invoice-to-specification

## METADATA

| Field | Value |
|-------|-------|
| **Task ID** | invoice-to-specification |
| **Complexity** | Level 2 |
| **Started** | 2026-02-01 |
| **Completed** | 2026-02-01 |
| **Status** | ARCHIVED ✅ |

---

## SUMMARY

Преобразование компонента InvoiceView в SpecificationView — документ "Estimate/Invoice" переделан в полноценную спецификацию проекта с:
- **Production Workflow** — 7 этапов работы с timeline UI
- **Payment Terms** — условия оплаты с разбивкой по milestone'ам
- **Динамическая логика** — этапы скрываются если не применимы

---

## REQUIREMENTS

### Исходный запрос
> Переделать инвойс в спецификацию. Помимо перечня услуг — добавить этапы работы.

### Уточнённые требования
1. Переименовать Invoice → Specification
2. Добавить секцию Production Workflow (этапы работы)
3. Этапы: Briefing, Moodboard, Symbols, UI, Animation, Revisions, Delivery
4. Убрать Integration & QA (пока нет фронтенда)
5. Этапы Symbol Design и Animation — условные (зависят от заказа)
6. Добавить Payment Terms с разбивкой по этапам

---

## IMPLEMENTATION

### Новые компоненты

**SpecificationView.jsx** — основной компонент спецификации:
- `WORKFLOW_STAGES` — константа с 7 этапами
- `activeStages` — фильтрация по условиям (`hasSymbols`, `hasAnimation`)
- Timeline UI с нумерацией и сроками
- Секция Assets & Services (бывшая таблица позиций)
- Секция Payment Terms

**PaymentSchedule** — хелпер-компонент:
- Расчёт `breakdown` в зависимости от модели оплаты
- Standard: 15% upfront + 85% по этапам
- Pre-50%: 50% + 50% по этапам
- Full Prepay: 100% сразу
- Zero: 0% + 100% по этапам
- Равномерное распределение milestone-суммы

### Изменённые файлы

| File | Change |
|------|--------|
| `src/components/SpecificationView.jsx` | Created (новый компонент) |
| `src/components/InvoiceView.jsx` | Deleted |
| `src/components/index.js` | Export: InvoiceView → SpecificationView |
| `src/components/Sidebar.jsx` | Prop: onViewInvoice → onViewSpecification |
| `src/components/MobileFooter.jsx` | Button: "Invoice" → "Spec" |
| `src/App.jsx` | View: 'invoice' → 'specification' |
| `src/index.css` | Print: #invoice-view → #specification-view |

### Этапы работы (WORKFLOW_STAGES)

| # | ID | Name | Duration | Condition |
|---|-----|------|----------|-----------|
| 1 | briefing | Briefing | 1-2 days | always |
| 2 | moodboard | Moodboard & Concept | 2-3 days | always |
| 3 | symbols | Symbol Design | 3-5 days | hasSymbols |
| 4 | ui | UI & Layout | 2-4 days | always |
| 5 | animation | Animation Production | 3-5 days | hasAnimation |
| 6 | revisions | Revisions | TBD | always |
| 7 | delivery | Final Delivery | 1 day | always |

---

## TESTING

### Проверки
- [x] Спецификация открывается по кнопке "View Specification"
- [x] Этапы отображаются корректно
- [x] Символы/Анимация скрываются если не в заказе
- [x] Payment Terms показывает правильные суммы
- [x] Print/Export работает (PDF не пустой)
- [x] Мобильная версия — кнопка "Spec" работает

### Исправленные баги
- Print показывал белые страницы → обновлён CSS селектор

---

## LESSONS LEARNED

1. **При переименовании компонентов** — проверять ВСЕ зависимости:
   - CSS селекторы (особенно @media print)
   - Импорты/экспорты
   - State переменные

2. **Бизнес-логика** требует итеративного уточнения:
   - Абстрактные "milestones" → конкретные этапы
   - Feedback-цикл эффективнее угадывания

3. **Компоненты-хелперы** улучшают читаемость:
   - PaymentSchedule вынесен отдельно
   - WORKFLOW_STAGES как редактируемая константа

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-invoice-to-specification.md`
- **Component:** `calculator/src/components/SpecificationView.jsx`
- **Related:** Payment models in `calculator/src/data/paymentModels.js`

---

## FUTURE IMPROVEMENTS

- [ ] Добавить реквизиты для оплаты (Bank, PayPal, Crypto)
- [ ] Редизайн спецификации под выбранный UI-стиль
- [ ] Возможность скачать как PDF напрямую (без Print dialog)
