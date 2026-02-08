# TASK ARCHIVE: Per-item Order Type (Art / Animation / Both)

## METADATA
- **Task ID:** per-item-order-type
- **Date:** 2026-02-07
- **Complexity:** Level 2
- **Status:** COMPLETED ✅

---

## SUMMARY

Реализована возможность выбора типа заказа для каждой позиции калькулятора: **Art Only**, **Anim Only**, **Art+Anim**. Глобальный переключатель устанавливает дефолтный тип для всех позиций и автоматически применяется к новым. Умная логика анимации: `None` убран из опций при обязательной анимации, автоподстановка `AN-L`. Колонка Type с цветными бейджами в SpecificationView.

---

## REQUIREMENTS

1. Каждая позиция калькулятора должна поддерживать три режима: Art Only, Anim Only, Art+Anim
2. Формула расчёта должна учитывать тип заказа (только арт / только анимация / оба)
3. Глобальный переключатель для массового изменения и установки дефолта
4. Новые позиции при активации автоматически получают текущий дефолтный тип
5. При Art Only — анимация дизейблится
6. При Anim Only и Art+Anim — None убран из опций, автоподстановка AN-L
7. Отображение типа в спецификации (бейджи)
8. Обратная совместимость со старыми спецификациями
9. Работа в обоих калькуляторах (страница + модалка проекта)

---

## IMPLEMENTATION

### Формула расчёта (`useCalculator.js`)

```
Art+Anim (default):  unitPrice = baseArtPrice + animCost
Art Only:            unitPrice = baseArtPrice
Anim Only:           unitPrice = animCost
```

Где:
- `baseArtPrice = item.base * globalStyle.coeff`
- `animCost = baseArtPrice * animObj.coeff * complexity`

### State Management

- `orderType` добавлен в каждый item state (`createInitialItemsState`, `loadState`, `applyPreset`)
- `defaultOrderType` — глобальное состояние для дефолтного типа
- `setAllOrderType()` — массовое переключение + установка дефолта
- `updateItem()` — при активации позиции (qty 0→1) применяет `defaultOrderType`

### UI

- **ItemRow.jsx** — сегментированный переключатель `[Art Only | Anim Only | Art+Anim]` с цветовым кодированием (синий/фиолетовый/зелёный)
- **CategorySection.jsx** — добавлена колонка Type в заголовках
- **SpecificationView.jsx** — колонка Type с бейджами: Art Only (синий), Anim Only (фиолетовый), Art+Anim (нейтральный)
- **CalculatorPage.jsx / CalculatorModal.jsx** — глобальный переключатель над категориями

### Логика анимации

- `Art Only`: anim selector дизейблится, anim = 'none'
- `Anim Only`: None убран из опций, если anim = 'none' → автоматически AN-L
- `Art+Anim`: None убран из опций, если anim = 'none' → автоматически AN-L

### Обратная совместимость

Fallback `state.orderType || 'art_and_anim'` во всех местах чтения. Миграций БД не потребовалось (JSONB).

---

## TESTING

### Проверка расчётов

Для "Low Symbols" (base: $150, complexity: 0.8) при стиле S3 (coeff: 1.3):

| orderType    | anim        | artPrice | animCost | unitPrice |
| ------------ | ----------- | -------- | -------- | --------- |
| art_and_anim | Full (x2.0) | $195     | $312     | $507      |
| art_only     | (any)       | $195     | ignored  | $195      |
| anim_only    | Full (x2.0) | $195     | $312     | $312      |

### Обратная совместимость

Старые спецификации без `orderType` в `state_json` корректно загружаются как `art_and_anim`.

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `calculator/src/hooks/useCalculator.js` | Формула, orderType в state, defaultOrderType, setAllOrderType, авто-применение |
| `calculator/src/components/ItemRow.jsx` | Переключатель per-item, фильтрация None |
| `calculator/src/components/CategorySection.jsx` | Колонка Type в заголовках |
| `calculator/src/components/SpecificationView.jsx` | Колонка Type с бейджами, обновление Revisions row |
| `calculator/src/pages/calculator/CalculatorPage.jsx` | Глобальный переключатель, defaultOrderType |
| `calculator/src/components/project/CalculatorModal.jsx` | Глобальный переключатель, defaultOrderType |

---

## LESSONS LEARNED

1. **Tailwind JIT: полные строки классов** — динамическая интерполяция (`border-${color}-200`) не работает
2. **Итеративный UX** — 4 итерации лейблов за 5 минут эффективнее долгого проектирования
3. **Глобальный дефолт > массовое действие** — автоприменение к новым позициям интуитивнее
4. **Один переключатель сверху** — дублирование над каждой категорией избыточно
5. **Дублирование Page/Modal** — системная проблема, стоит рассмотреть общий компонент

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-per-item-order-type.md`
- **Plan:** `.cursor/plans/per-item_order_type_00ae5284.plan.md`
- **Related task:** Specification Settings Inheritance (same session)
