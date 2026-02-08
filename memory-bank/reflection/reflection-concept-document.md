# Reflection: Concept Document в калькуляторе

## Дата: 2026-02-08
## Сложность: Level 2

---

## Краткое описание

Добавлена новая категория "Concept Document" в калькулятор с уникальной моделью ценообразования ($1000 фикс + 1% от суммы остальных items), без order types и анимации, с бейджем "Recommended", ограничением qty=1, исключением из addon-спецификаций. Интегрировано в оба калькулятора, спецификации и админку.

---

## Что прошло хорошо

1. **Режим вопросов перед реализацией** — 20+ вопросов позволили уточнить все неочевидные аспекты: уникальная модель ценообразования, применимость коэффициентов, ограничения qty, addon-исключение.

2. **Флаговая архитектура** — вместо хардкода `if (item.id === 'concept_doc')` использованы универсальные флаги (`noOrderType`, `noAnimation`, `noStyleCoeff`, `surchargePercent`, `maxQty`, `addonExcluded`, `recommended`). Это позволяет в будущем добавлять похожие items без изменения логики.

3. **Двухпроходный расчёт** — разделение на regularItemsSum (проход 1) и surchargeItems (проход 2) элегантно решает проблему зависимости цены от суммы других items без циклической зависимости.

4. **Консистентность** — изменения затронули все нужные слои: данные, расчёты, UI (ItemRow, CategorySection, SpecificationView), оба калькулятора, пресеты, админку, БД.

---

## Сложности

1. **Уникальная модель ценообразования** — формула "$1000 + 1% от остального" не вписывалась в текущий линейный расчёт. Потребовался двухпроходный подход. Также важно было убедиться в отсутствии циклической зависимости.

2. **Много точек изменения** — 10 файлов затронуты. Легко пропустить что-то (например, SpecificationView показывал "Art Only" бейдж для concept_doc — это было исправлено по обратной связи).

3. **Заголовки колонок в CategorySection** — для категории Concept Document столбцы "Type" и "Anim" были лишними. Потребовалось добавить условную логику скрытия заголовков, когда ВСЕ items категории имеют соответствующие флаги.

---

## Уроки

1. **SpecificationView нужно проверять отдельно** — он использует свои собственные шаблоны отображения (бейджи Type/Anim), которые не связаны с ItemRow. Изменения в ItemRow не покрывают SpecificationView автоматически.

2. **Флаги на item > проверки по id** — паттерн `item.noOrderType` гораздо надёжнее и расширяемее, чем `item.id === 'concept_doc'`. Этот подход стоит использовать для любых будущих особых items.

3. **Вопросы до реализации экономят время** — без предварительных вопросов пришлось бы несколько раз переделывать ценообразование (непонятно было: фикс $1000 + 1%, или 1% с минимумом $1000, или x1.1 коэффициент).

4. **Addon-спецификации как отдельный кейс** — при добавлении нового item нужно всегда проверять, должен ли он быть доступен в addon-спецификациях. Флаг `addonExcluded` делает это явным.

---

## Файлы изменены/созданы

### Изменены (9 файлов)
- `calculator/src/data/categories.js` — новая категория Concept Document
- `calculator/src/hooks/useCalculator.js` — двухпроходный расчёт, флаги noOrderType/noAnimation/noStyleCoeff/maxQty
- `calculator/src/components/ItemRow.jsx` — скрытие controls, maxQty, бейдж Recommended, surcharge display
- `calculator/src/components/CategorySection.jsx` — условное скрытие заголовков колонок
- `calculator/src/components/SpecificationView.jsx` — тире вместо Type/Anim для noOrderType/noAnimation items
- `calculator/src/pages/calculator/CalculatorPage.jsx` — фильтрация addonExcluded items
- `calculator/src/components/project/CalculatorModal.jsx` — аналогичная фильтрация
- `calculator/src/data/presets.js` — concept_doc в Premium Flagship
- `calculator/src/pages/admin/PricingPage.jsx` — категория Concept Document в иконках и порядке

### Создан (1 файл)
- `calculator/supabase/migrations/046_concept_document.sql` — seed данные для price_configs

---

## Рекомендации на будущее

1. При добавлении нового типа item использовать флаговую систему (не хардкод по id)
2. Всегда проверять SpecificationView при изменении ItemRow
3. Проверять CategorySection headers при добавлении items с нестандартными controls
4. Тестировать addon-спецификации при добавлении items с ограничениями
