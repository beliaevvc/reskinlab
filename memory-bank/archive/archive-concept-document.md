# TASK ARCHIVE: Concept Document в калькуляторе

## METADATA
- **Task ID:** concept-document
- **Date:** 2026-02-08
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Добавлена новая категория "Concept Document" в калькулятор — первая в списке, выше Symbols. Уникальная модель ценообразования: $1000 фиксированная стоимость + 1% от суммы всех остальных items в спецификации. Реализована через флаговую архитектуру и двухпроходный расчёт. Интегрировано во все слои: данные, расчёты, UI обоих калькуляторов, спецификации, пресеты и админку.

---

## REQUIREMENTS

1. **Новый item** — "Concept Document" как отдельная категория, первая в калькуляторе
2. **Ценообразование** — $1000 (base) + 1% от суммы остальных items (surchargePercent)
3. **Без order type** — не применимы Art Only / Anim Only / Art+Anim (noOrderType)
4. **Без анимации** — анимационная сложность не применима (noAnimation)
5. **Без style coefficient** — визуальный стиль не влияет на цену (noStyleCoeff)
6. **Максимум 1 штука** — ограничение qty (maxQty: 1)
7. **Бейдж "Recommended"** — визуальный индикатор в UI (recommended)
8. **Исключён из addon-спецификаций** — не доступен при дозаказе (addonExcluded)
9. **Описания RU/EN** — полные описания, примеры и тех. характеристики на двух языках
10. **Пресет Premium Flagship** — включён в пресет
11. **Админка** — настраиваемая цена через price_configs
12. **Спецификация** — корректное отображение (без Art Only бейджа, без Anim: None)
13. **Применимость стандартных настроек** — usage rights, payment model, revisions, discounts, minimum order влияют на финальную цену

---

## IMPLEMENTATION

### Архитектура: флаговая система

Вместо хардкода проверок `if (item.id === 'concept_doc')` реализована система флагов на уровне item в `categories.js`:

| Флаг | Назначение |
|------|-----------|
| `surchargePercent: 0.01` | 1% от суммы других items |
| `noOrderType: true` | Скрыть переключатель Type |
| `noAnimation: true` | Скрыть Animation selector |
| `noStyleCoeff: true` | Не применять style coefficient |
| `maxQty: 1` | Максимум 1 штука |
| `recommended: true` | Бейдж "Recommended" |
| `addonExcluded: true` | Исключить из addon-спек |

### Двухпроходный расчёт (useCalculator.js)

**Проход 1** — подсчёт `regularItemsSum`: сумма всех items без `surchargePercent`.
**Проход 2** — расчёт surcharge items: `unitPrice = item.base + (item.surchargePercent * regularItemsSum)`. Surcharge items добавляются в начало `lineItems` через `unshift()`.

### UI изменения

- **ItemRow.jsx** — условное скрытие Order Type selector и Animation selector, ограничение кнопки "+" по maxQty, бейдж "Recommended", отображение surcharge формулы
- **CategorySection.jsx** — скрытие заголовков "Type" и "Anim" если все items категории имеют noOrderType/noAnimation
- **SpecificationView.jsx** — тире "—" вместо Art Only бейджа и Anim: None для items с noOrderType/noAnimation
- **CalculatorPage.jsx + CalculatorModal.jsx** — фильтрация items с addonExcluded при isSettingsLocked

### Данные и миграция

- **categories.js** — новая категория первой в CATEGORIES array с полными RU/EN описаниями
- **presets.js** — `concept_doc: 1` в Premium Flagship
- **046_concept_document.sql** — seed: concept_doc_base ($1000) + concept_doc_surcharge (0.01) в price_configs
- **PricingPage.jsx** — иконка 📋 и позиция в CATEGORY_ORDER

---

## FILES

### Изменены (9 файлов)
| Файл | Изменения |
|------|-----------|
| `calculator/src/data/categories.js` | Новая категория Concept Document с флагами |
| `calculator/src/hooks/useCalculator.js` | Двухпроходный расчёт, поддержка всех флагов в createInitialItemsState, updateItem, setAllOrderType, applyPreset, loadState, totals |
| `calculator/src/components/ItemRow.jsx` | Скрытие controls, maxQty, бейдж Recommended, surcharge display |
| `calculator/src/components/CategorySection.jsx` | Условное скрытие заголовков Type/Anim |
| `calculator/src/components/SpecificationView.jsx` | Тире вместо Type/Anim бейджей |
| `calculator/src/pages/calculator/CalculatorPage.jsx` | Фильтрация addonExcluded items |
| `calculator/src/components/project/CalculatorModal.jsx` | Аналогичная фильтрация |
| `calculator/src/data/presets.js` | concept_doc в Premium Flagship |
| `calculator/src/pages/admin/PricingPage.jsx` | Категория в CATEGORY_ICONS + CATEGORY_ORDER |

### Создан (1 файл)
| Файл | Назначение |
|------|-----------|
| `calculator/supabase/migrations/046_concept_document.sql` | Seed: base + surcharge в price_configs |

---

## LESSONS LEARNED

1. **Флаги на item > проверки по id** — универсальная, расширяемая архитектура
2. **SpecificationView нужно проверять отдельно от ItemRow** — разные шаблоны отображения
3. **Вопросы до реализации экономят время** — уточнение ценообразования предотвратило переделки
4. **Addon-спецификации — отдельный кейс** — всегда проверять при добавлении нового item

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-concept-document.md`
- **Migration:** `calculator/supabase/migrations/046_concept_document.sql`
