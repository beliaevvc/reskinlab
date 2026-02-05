# TASK ARCHIVE: Admin Dashboard & Specifications Page

## METADATA
- **Task ID:** admin-specifications-page
- **Date Started:** 5 Февраля 2026
- **Date Completed:** 5 Февраля 2026
- **Complexity Level:** 2 (Enhancement)
- **Status:** ARCHIVED ✅

---

## SUMMARY

Исправление багов в админ-дашборде и создание новой страницы управления спецификациями для админа и AM.

### Key Achievements
1. Исправлен баг "Active Projects" — показывал 0 из-за неверного статуса в фильтре
2. Разделён блок "Pending Approvals" на два отдельных блока с суммами
3. Создана страница спецификаций для админа с фильтрами и модалкой
4. Добавлен раздел спецификаций для AM с фильтрацией по назначенным клиентам
5. Улучшен UI: кастомные дропдауны, сворачиваемые секции

---

## REQUIREMENTS

### Original Request
- Исправить блок "Active Projects" в дашборде (показывал 0)
- Проверить и исправить блоки "Completed Projects" и "Pending Approvals"
- Создать страницу спецификаций для админа (как Offers/Invoices)
- Добавить модалку для просмотра спецификации
- Исправить UI проблемы (обрезание заголовков, стиль дропдаунов)

### Additional Requests (during implementation)
- Разделить "Pending Approvals" на "Awaiting Offer" и "Pending Offers" с суммами
- Сделать Production Workflow сворачиваемым
- Добавить раздел спецификаций для AM

---

## IMPLEMENTATION

### Dashboard Fixes

#### Active Projects Fix
**Problem:** Код фильтровал по `status === 'in_progress'`, но такого статуса нет в БД.
**Solution:** Изменено на `status === 'active' || status === 'in_production'`

```javascript
// Before
in_progress: projects?.filter(p => p.status === 'in_progress').length || 0,

// After
in_progress: projects?.filter(p => p.status === 'active' || p.status === 'in_production').length || 0,
```

#### Pending Approvals Split
Заменён единый блок на два:

1. **Awaiting Offer** — финализированные спецификации без оффера
   - Количество + общая сумма
   - Ссылка на `/admin/specifications`

2. **Pending Offers** — офферы в статусе pending
   - Количество + общая сумма
   - Ссылка на `/admin/offers`

**Key Challenge:** Supabase relations возвращают `[]` вместо `null`:
```javascript
// Wrong approach
const specsWithoutOffer = finalizedSpecs?.filter(s => !s.offer);

// Correct approach
const specIdsWithOffers = new Set(allOffers?.map(o => o.specification_id) || []);
const specsWithoutOffer = finalizedSpecs?.filter(s => !specIdsWithOffers.has(s.id));
```

### Specifications Page

#### New Components
- `StatusFilter` — кастомный дропдаун для фильтра статуса
- Использован существующий `ClientFilter`

#### Features
- Grid и Table режимы отображения
- Фильтрация по клиенту и статусу
- Клик открывает `SpecificationModal`
- Пагинация (если нужно)

#### Routes
- `/admin/specifications` — для админа (все спецификации)
- `/am/specifications` — для AM (только назначенные проекты)

### AM Specifications

#### New Hook
```javascript
export function useAMSpecifications(userId) {
  return useQuery({
    queryKey: ['specifications', 'am', userId],
    queryFn: async () => {
      // Get projects assigned to AM
      const { data: amProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('am_id', userId);

      // Get specifications for those projects
      const { data } = await supabase
        .from('specifications')
        .select(`...`)
        .in('project_id', projectIds);
      
      return data;
    },
  });
}
```

### UI Improvements

#### Table Header Clipping Fix
```jsx
// Before
<th className="pb-3 ...">

// After  
<th className="py-3 ...">
```

#### Collapsible Production Workflow
```jsx
const [workflowExpanded, setWorkflowExpanded] = useState(false);

<button onClick={() => setWorkflowExpanded(!workflowExpanded)}>
  Production Workflow
  <ChevronIcon className={workflowExpanded ? 'rotate-180' : ''} />
</button>

{workflowExpanded && <WorkflowContent />}
```

---

## FILES MODIFIED

### Hooks
- `calculator/src/hooks/useDashboard.js` — статистика дашборда
- `calculator/src/hooks/useSpecifications.js` — `useAllSpecifications`, `useAMSpecifications`

### Pages
- `calculator/src/pages/admin/AdminDashboardPage.jsx` — новые блоки, StatCard subtitle
- `calculator/src/pages/specifications/SpecificationsPage.jsx` — страница + StatusFilter

### Components
- `calculator/src/components/layout/AppSidebar.jsx` — меню + clipboard icon
- `calculator/src/components/SpecificationView.jsx` — сворачиваемый workflow

### Routes
- `calculator/src/App.jsx` — `/admin/specifications`, `/am/specifications`

---

## TESTING

### Manual Testing
1. ✅ Active Projects показывает корректное количество
2. ✅ Awaiting Offer показывает финализированные спеки без офферов
3. ✅ Pending Offers показывает офферы в статусе pending
4. ✅ Суммы корректно рассчитываются
5. ✅ Страница спецификаций отображает данные
6. ✅ Фильтры работают
7. ✅ Модалка открывается по клику
8. ✅ AM видит только свои спецификации

---

## LESSONS LEARNED

### Technical
1. **Supabase relations** — возвращают `[]`, не `null`. Использовать Set для проверки наличия.
2. **DB schema verification** — всегда проверять миграции перед использованием статусов
3. **Hooks by role** — паттерн `useAll*` (admin) vs `use*ByRole` (am/client)

### Process
1. **Роли синхронизировать** — если добавили функционал админу, проверить AM
2. **Кастомные компоненты** — лучше нативных для консистентности UI

### Discovered Issues
- AM роль сильно отстала от админа — требуется отдельный аудит

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-admin-specifications-page.md`
- **Related:** `memory-bank/archive/archive-admin-dashboard-users-improvements.md`
- **Patterns:** `memory-bank/systemPatterns.md`

---

## NEXT STEPS

1. [ ] Аудит AM роли — составить список недостающего функционала
2. [ ] Документировать статусы проектов в systemPatterns.md
3. [ ] Добавить тесты для useDashboard
