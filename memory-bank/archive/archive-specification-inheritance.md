# TASK ARCHIVE: Specification Settings Inheritance

## METADATA
- **Task ID:** specification-inheritance
- **Date:** 2026-02-07
- **Complexity:** Level 2
- **Status:** COMPLETED ✅

---

## SUMMARY

При наличии оплаченной спецификации в проекте (первый инвойс оплачен), все последующие спецификации автоматически наследуют **Visual Style**, **Usage Rights** и **Payment Model** из первой оплаченной. Унаследованные поля залочены в UI (disabled + locked badge).

---

## REQUIREMENTS

1. Определять наличие оплаченной спецификации в проекте
2. Извлекать настройки из первой оплаченной спецификации
3. Автоматически применять унаследованные настройки при создании новой спецификации
4. Залочить UI (disabled + locked label) для унаследованных полей
5. Пресеты не должны переопределять залоченные настройки
6. Сохранять `parent_spec_id` и `is_addon: true` в новых спецификациях
7. Работа в обоих калькуляторах (страница + модалка)
8. Minimum order amount не применяется к дополнительным спецификациям

---

## IMPLEMENTATION

### Хук `useInheritedSettings.js` (новый файл)

- `useFirstPaidSpecification(projectId)` — запрос первой спецификации с оплаченным инвойсом
- `useInheritedSettings(projectId)` — определяет `shouldInherit`, `parentSpecId`, `inheritedSettings`
- Валидация настроек против текущих массивов данных (STYLES, USAGE_RIGHTS, PAYMENT_MODELS)

### UI компоненты

- `StyleSelector.jsx` — prop `disabled`, label "(locked)"
- `SettingsSection.jsx` — props `disabledUsageRights`, `disabledPaymentModel`, labels "(locked)"
- Opacity 75% для залоченных блоков

### Интеграция в Page/Modal

- `useEffect` для применения унаследованных настроек при создании новой спецификации
- `handleApplyPreset` — обёртка для пресетов, восстанавливающая залоченный стиль
- `handleSave` — передача `parentSpecId` при создании новой унаследованной спецификации
- `isSettingsLocked` — true для новых спец в проекте с оплатой ИЛИ для загруженных addon-спецификаций

### Сохранение в БД

- `useSaveSpecification` — при создании новой спецификации с наследованием: `is_addon: true`, `parent_spec_id: parentSpecId`

---

## FILES

| File | Changes |
|------|---------|
| `calculator/src/hooks/useInheritedSettings.js` | **NEW** — хук определения и загрузки наследуемых настроек |
| `calculator/src/hooks/useMinimumOrder.js` | Экспорт `useProjectHasPaidInvoices` |
| `calculator/src/hooks/useSpecifications.js` | `parentSpecId` в `useSaveSpecification`, `is_addon` логика |
| `calculator/src/components/StyleSelector.jsx` | Prop `disabled`, locked label |
| `calculator/src/components/SettingsSection.jsx` | Props `disabledUsageRights`/`disabledPaymentModel` |
| `calculator/src/pages/calculator/CalculatorPage.jsx` | Интеграция useInheritedSettings |
| `calculator/src/components/project/CalculatorModal.jsx` | Интеграция useInheritedSettings |

---

## LESSONS LEARNED

1. **Дублирование Page/Modal** — одна и та же фича пришлось реализовывать дважды. Ошибка при первой реализации (забыли модалку) поймана пользователем.
2. **Preset edge case** — `applyPreset` мог сбросить залоченный стиль. Решено обёрткой `handleApplyPreset`.
3. **Валидация данных** — наследуемые настройки проверяются против текущих массивов данных для защиты от устаревших значений.

---

## REFERENCES

- **Related task:** Per-item Order Type (same session)
