# TASK ARCHIVE: Projects & Invoices UI Improvements

## METADATA
| Field | Value |
|-------|-------|
| **Task ID** | `projects-ui-improvements` |
| **Date Started** | 5 Февраля 2026 |
| **Date Completed** | 5 Февраля 2026 |
| **Complexity Level** | Level 3 (Intermediate) |
| **Status** | ARCHIVED ✅ |

---

## SUMMARY

Комплексное улучшение UI/UX страницы проектов и инвойсов с фокусом на:
- Фильтрацию инвойсов по клиенту, проекту и спецификации
- Редизайн карточек и таблиц проектов с переключателем вида
- Inline редактирование названия и описания проекта
- Создание переиспользуемого компонента InlineEdit

---

## REQUIREMENTS

### Functional Requirements
1. **Invoice Filtering**: Фильтрация по клиенту (admin/AM), проекту и спецификации/офферу
2. **Projects View Toggle**: Переключение между карточками и табличным видом
3. **Project Cards Redesign**: Вертикальные карточки с сеткой статистики (Specs, Offers, Invoices, Tasks)
4. **Inline Editing**: Редактирование названия и описания без модального окна
5. **Consistent Design**: Единый стиль для Admin, AM и Client

### Non-Functional Requirements
- Responsive дизайн
- Минимальная нагрузка на сервер (кэширование React Query)
- Удобный UX (hover эффекты, индикация редактируемости)

---

## IMPLEMENTATION

### Files Created

| File | Purpose |
|------|---------|
| `calculator/src/components/InlineEdit.jsx` | Переиспользуемый компонент inline редактирования |

### Files Modified

| File | Changes |
|------|---------|
| `calculator/src/pages/projects/ProjectsPage.jsx` | Полный редизайн: AdminProjectCard, ClientProjectCard, view toggle, фильтры |
| `calculator/src/pages/invoices/InvoicesPage.jsx` | Добавлены фильтры по клиенту, проекту, спецификации |
| `calculator/src/hooks/useProjects.js` | Расширены запросы для получения counts (invoices, tasks, offers) |
| `calculator/src/hooks/useInvoices.js` | Добавлен specification в запрос через offer |
| `calculator/src/components/project/ProjectHeader.jsx` | InlineEdit для названия проекта |
| `calculator/src/components/project/index.js` | Обновлены экспорты |

### Files Deleted

| File | Reason |
|------|--------|
| `calculator/src/components/project/EditProjectModal.jsx` | Заменён на InlineEdit |

### Key Implementation Details

#### 1. InlineEdit Component
```jsx
// Универсальный компонент inline редактирования
<InlineEdit
  value={project.name}
  onSave={(value) => handleSave('name', value)}
  placeholder="Project name"
  multiline={false}
  inputClassName="text-xl font-bold"
/>
```

Особенности:
- Автофокус и выделение текста при клике
- Enter для сохранения (Cmd+Enter для multiline)
- Escape для отмены
- Hover эффект для индикации редактируемости
- `stopPropagation()` для работы внутри кликабельных контейнеров

#### 2. Project Cards
- Link заменён на div с `onClick` для поддержки inline редактирования
- Сетка статистики 4 колонки: Specs, Offers, Invoices, Tasks
- Клиент в футере карточки (только для Admin/AM)
- Фиксированный минимальный размер для консистентности

#### 3. Invoice Filtering
- `useMemo` для вычисления уникальных клиентов, проектов, офферов
- Каскадная фильтрация: выбор проекта → фильтрация офферов
- Custom Select компонент для консистентного UI

---

## TESTING

### Manual Testing Performed
1. ✅ Переключение карточки ↔ таблица сохраняется в localStorage
2. ✅ Inline редактирование названия сохраняет в БД
3. ✅ Inline редактирование описания сохраняет в БД
4. ✅ Клик на карточку переходит на страницу проекта
5. ✅ Фильтры инвойсов работают корректно
6. ✅ Client видит только свои данные (без клиента в карточках)
7. ✅ Escape отменяет редактирование

### Known Limitations
- Stage display был убран — данные не обновлялись между страницами (требует Realtime)

---

## LESSONS LEARNED

### Technical Insights
1. **React Query invalidateQueries** не рефетчит запросы для не смонтированных компонентов. Для real-time синхронизации между страницами нужны WebSocket подписки (Supabase Realtime).

2. **InlineEdit в кликабельных контейнерах** требует:
   - `e.stopPropagation()` на click, blur, keydown
   - Замена Link на div с программной навигацией через `useNavigate()`

3. **Styling inline inputs**: ring-2 выглядит слишком агрессивно, лучше использовать простой border с изменением цвета при фокусе.

### Process Insights
1. Быстрые итерации с пользователем эффективнее попыток угадать идеальный дизайн
2. Для UI изменений лучше сначала показать первую версию и получить фидбек
3. Функционал с ограничениями лучше не добавлять до полной реализации

---

## REFERENCES

### Related Documents
- **Reflection:** `memory-bank/reflection/reflection-projects-ui-improvements.md`

### Related Components
- `calculator/src/components/Select.jsx` — Custom select component
- `calculator/src/hooks/useUpdateProject.js` — Project mutation hook

### Design Decisions
- Vertical card layout выбран для лучшего отображения статистики
- Inline editing предпочтён модальному окну для быстроты редактирования
- Нейтральные цвета заголовков таблиц для консистентности с другими страницами

---

## STATUS

**ARCHIVED** ✅

Задача полностью завершена и задокументирована.
