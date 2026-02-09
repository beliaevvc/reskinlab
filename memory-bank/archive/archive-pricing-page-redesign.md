# TASK ARCHIVE: Calculator Settings (PricingPage) Redesign v2

## METADATA

| Field | Value |
|-------|-------|
| Task ID | pricing-page-redesign |
| Date Started | 2026-02-09 |
| Date Completed | 2026-02-09 |
| Complexity Level | Level 2 |
| Status | ARCHIVED ✅ |

---

## SUMMARY

Комплексный редизайн раздела "Calculator Settings" (Price) в админ-панели ReSkin Lab. Задача включала множество итераций на основе обратной связи пользователя — от начальных 3 вариантов дизайна до финальной версии с sidebar-layout, объединёнными карточками настроек, табличным видом и редактируемыми названиями items.

### Финальный функционал

1. **Sidebar-layout** — категории слева, настройки справа
2. **PairedCard** — объединение base price + complexity/surcharge в одну карточку
3. **ValueCard** — одиночные настройки с унифицированным стилем
4. **Table view** — переключатель карточки/таблица, категории как секции
5. **Editable names** — редактирование display_name, синхронизация с калькулятором
6. **PairedEditModal** — редактирование пары в одном модальном окне
7. **Concept Document pair** — base price + surcharge объединены

---

## REQUIREMENTS

### Оригинальный запрос
> Редизайн раздела Price (настройки калькулятора). Сделать стильнее и удобнее — возможно карточками.

### Эволюция требований

| Итерация | Требование |
|----------|-----------|
| 1 | Предложить варианты дизайна |
| 2 | Сделать переключалку между Cards Grid и Sidebar+Detail |
| 3 | Исправить bug с растягиванием карточек |
| 4 | Оставить только Sidebar view |
| 5 | Поменять местами техническое и человеческое название |
| 6 | Убрать эмоджи и цветастость, сделать emerald стиль |
| 7 | Объединить base price + complexity в одну карточку |
| 8 | Добавить возможность редактировать названия items |
| 9 | Исправить отображение paired cards (wrong values) |
| 10 | Объединить редактирование в один modal |
| 11 | Унифицировать стиль ValueCard с PairedCard |
| 12 | Добавить табличный вид |
| 13 | В table view убрать sidebar, категории как секции |
| 14 | Объединить Concept Document base + surcharge |

---

## IMPLEMENTATION

### Architecture

```
PricingPage.jsx
├── State
│   ├── activeCategory (string)
│   ├── searchQuery (string)
│   ├── viewMode ('cards' | 'table')
│   ├── editingConfig (object | null)
│   └── editingPair (object | null)
│
├── Constants
│   ├── CATEGORIES (array)
│   └── PAIRED_CATEGORIES (array) — includes Concept Document
│
├── Helpers
│   ├── getConfigType(name) → 'price' | 'coefficient' | 'percent'
│   ├── formatConfigValue(value, type) → formatted string
│   ├── getHumanName(config) → display name
│   ├── groupByItemId(configs) → { pairs, standalone }
│   ├── getCategoryStats(configs) → { prices, coeffs, percents }
│   └── formatCurrency(value) → $X,XXX
│
├── Components
│   ├── ValueCard — single setting card
│   ├── PairedCard — base + secondary card
│   ├── EditModal — single value editing
│   ├── PairedEditModal — pair editing (base + secondary + name)
│   ├── SettingsTable — table view component
│   ├── MinimumOrderSection — special category
│   ├── GridIcon / TableIcon — view toggle icons
│   └── PencilIcon / XIcon — action icons
│
└── Layout
    ├── Cards view: Sidebar + Detail panel
    └── Table view: Categories as sections (no sidebar)
```

### Key Functions

#### `groupByItemId(configs)`
Группирует configs по `item_id` из `config_data`:
- `base` — config с `config_type === 'item_price'` или `name.endsWith('_base')`
- `secondary` — config с `config_type === 'complexity'/'surcharge'`
- `secondaryType` — 'complexity' или 'surcharge' для правильного форматирования

#### `PairedEditModal`
- Единое окно для редактирования display_name, base price, secondary value
- Surcharge автоконвертируется: 0.01 ↔ 1%
- Keyboard shortcuts: Escape (close), ⌘+Enter (save)

### Database Changes

**Migration 053_dynamic_item_names.sql:**
```sql
-- Add display_name column
ALTER TABLE price_configs ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Populate from descriptions
UPDATE price_configs SET display_name = regexp_replace(description, ...);

-- Update RPC to return display_name
CREATE OR REPLACE FUNCTION get_public_pricing() RETURNS JSONB ...
```

### Files Modified

| File | Changes |
|------|---------|
| `PricingPage.jsx` | Complete redesign (~1000 lines) |
| `usePricing.js` | Added display_name to mutation |
| `useDynamicPricing.js` | Merge display_name from Supabase |
| `053_dynamic_item_names.sql` | New migration |

---

## TESTING

### Manual Testing Performed

1. ✅ Cards view — все категории отображаются корректно
2. ✅ Table view — категории как секции, без sidebar
3. ✅ PairedCard — base + complexity отображаются правильно
4. ✅ Concept Document — base + surcharge в одной карточке
5. ✅ Surcharge formatting — 0.01 отображается как 1%
6. ✅ Edit modal — single и paired работают
7. ✅ Display name editing — сохраняется в БД
8. ✅ Build verification — `npm run build` успешен

### Edge Cases

- Пустые категории — скрываются при поиске
- Standalone items в paired категориях — отображаются отдельно
- Minimum Order — специальная секция, не paired

---

## LESSONS LEARNED

### Technical

1. **Config type > naming convention** — `config_type` из БД надёжнее чем парсинг имён
2. **Percentage storage** — хранить как decimal (0.01), конвертировать для UI
3. **View mode restructure** — переключение вида может требовать полной смены layout

### Process

1. **Iterative design** — 14 итераций дали лучший результат чем "идеальный" первый вариант
2. **User feedback loop** — конкретный фидбек ("поменяй местами") эффективнее общего ("сделай лучше")
3. **Scope discovery** — новые требования (surcharge pairs) выявляются в процессе

### Architecture

1. **Flexible grouping** — `secondaryType` позволяет легко добавить новые типы пар
2. **Component reuse** — унификация ValueCard/PairedCard упрощает maintenance
3. **DB for UI flexibility** — `display_name` в БД лучше чем hardcoded mapping

---

## REFERENCES

| Document | Path |
|----------|------|
| Reflection | `memory-bank/reflection/reflection-pricing-page-redesign.md` |
| Migration | `calculator/supabase/migrations/053_dynamic_item_names.sql` |
| Main Component | `calculator/src/pages/admin/PricingPage.jsx` |
| Pricing Hook | `calculator/src/hooks/usePricing.js` |
| Dynamic Pricing | `calculator/src/hooks/useDynamicPricing.js` |

---

## NEXT STEPS

1. **Apply migration 053** в production Supabase
2. **Verify calculator** отображает кастомные названия после миграции
3. **Consider** unit tests для groupByItemId и formatConfigValue
4. **Consider** TypeScript для type safety в complex state

---

*Archived: 2026-02-09*
