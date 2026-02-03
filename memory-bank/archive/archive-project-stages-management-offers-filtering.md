# TASK ARCHIVE: Project Stages Management & Offers Filtering

## METADATA

- **Task ID:** project-stages-management-offers-filtering
- **Complexity Level:** Level 2-3 (Intermediate Feature Enhancement)
- **Date Started:** 2026-02-03
- **Date Completed:** 2026-02-03
- **Type:** Feature Enhancement
- **Status:** COMPLETED ✅

---

## SUMMARY

Реализованы две ключевые функции для улучшения управления проектами и работы с офферами:

1. **Управление этапами проекта** - Админы и AM получили возможность активировать/деактивировать этапы с каскадной логикой:
   - При активации этапа автоматически активируются все предыдущие pending этапы (слева направо)
   - При деактивации этапа автоматически деактивируются все последующие активные этапы (справа налево)
   - Модальное окно подтверждения с отображением списка этапов, которые будут затронуты

2. **Фильтрация офферов по клиентам** - Для админов и AM добавлена фильтрация офферов с поиском:
   - Выпадающий список с поиском клиентов в реальном времени
   - Отображение всех офферов для админов/AM (вместо только своих)
   - Удобный интерфейс для работы с большим количеством клиентов
   - Добавлен маршрут `/am/offers` для Account Managers

---

## REQUIREMENTS

### Основные требования:

1. **Управление этапами:**
   - Админы и AM должны иметь возможность активировать/деактивировать этапы
   - При активации этапа должны активироваться все предыдущие pending этапы
   - При деактивации этапа должны деактивироваться все последующие активные этапы
   - Все изменения должны быть видны всем ролям (клиентам тоже)
   - Модальное окно подтверждения с указанием названия этапа

2. **Фильтрация офферов:**
   - В админке и у AM должна быть фильтрация по клиентам
   - Фильтр должен быть удобен при большом количестве клиентов
   - Клиенты должны видеть только свои офферы (без изменений)

---

## IMPLEMENTATION

### Approach

Реализация выполнена с использованием модульного подхода:
- Созданы переиспользуемые хуки для каскадной логики активации/деактивации
- Создан переиспользуемый компонент фильтра с поиском
- Использована существующая инфраструктура React Query для управления состоянием

### Key Components

#### 1. Stage Management System

**Hook: `useActivateStageWithPrevious()`**
- Активирует выбранный этап и все предыдущие pending этапы
- Использует массовое обновление БД для эффективности
- Логика: `order <= targetStage.order && status === 'pending'`

**Hook: `useDeactivateStageWithPrevious()`**
- Деактивирует выбранный этап и все последующие активные/завершенные этапы
- Использует массовое обновление БД для эффективности
- Логика: `order >= targetStage.order && (status === 'in_progress' || 'review' || 'completed' || 'approved')`
- Сортировка справа налево для отображения

**Component: `StageChangeModal`**
- Модальное окно подтверждения смены этапа
- Показывает список этапов, которые будут затронуты
- Разные сообщения для активации и деактивации
- Визуальная обратная связь (зеленый для активации, красный для деактивации)

**Component: `ProjectStages`**
- Обновлен для поддержки кликабельности этапов для админов/AM
- Условная логика: `isClickable = canChangeStage && (isAdmin || isAM)`

#### 2. Offers Filtering System

**Hook: `useAllOffers()`**
- Получает все офферы без фильтрации по клиенту (для админов/AM)
- Использует RLS политику `offers_select_staff` для доступа

**Component: `ClientFilter`**
- Переиспользуемый компонент фильтра с поиском
- Поиск в реальном времени по имени клиента
- Автофокус на поле поиска при открытии
- Закрытие по Escape и клику вне компонента
- Визуальная обратная связь (подсветка выбранного элемента)
- Кнопка очистки фильтра

**Page: `OffersPage`**
- Определяет роль пользователя и путь (`/admin/offers` или `/am/offers`)
- Для админов/AM использует `useAllOffers()`, для клиентов - `useOffers()`
- Интегрирует компонент `ClientFilter` для фильтрации
- Показывает счетчик найденных офферов при активном фильтре

### Files Created

#### New Files
- `calculator/src/components/project/StageChangeModal.jsx` - Модальное окно подтверждения смены этапа
- `calculator/src/components/offers/ClientFilter.jsx` - Компонент фильтра клиентов с поиском
- `calculator/src/hooks/useStages.js` - Добавлены функции `useActivateStageWithPrevious()` и `useDeactivateStageWithPrevious()`
- `calculator/src/hooks/useOffers.js` - Добавлена функция `useAllOffers()` для админов/AM

#### Modified Files
- `calculator/src/components/project/ProjectStages.jsx` - Добавлена логика клика для админов/AM
- `calculator/src/pages/projects/ProjectPage.jsx` - Интеграция модального окна смены этапа
- `calculator/src/pages/offers/OffersPage.jsx` - Добавлена фильтрация по клиентам для админов/AM
- `calculator/src/components/offers/index.js` - Добавлены экспорты новых компонентов
- `calculator/src/App.jsx` - Добавлен маршрут `/am/offers` и `/am/offers/:id` для AM
- `calculator/src/components/layout/AppSidebar.jsx` - Добавлена ссылка "Offers" для AM

### Implementation Details

#### Stage Activation Logic
```javascript
// Активация: все этапы с order <= выбранного и status = 'pending'
const stagesToActivate = allStages.filter(
  stage => stage.order <= targetStage.order && stage.status === 'pending'
);
```

#### Stage Deactivation Logic
```javascript
// Деактивация: все этапы с order >= выбранного и активные/завершенные
const stagesToDeactivate = allStages
  .filter(
    stage => stage.order >= targetStage.order && 
    (stage.status === 'in_progress' || stage.status === 'review' || 
     stage.status === 'completed' || stage.status === 'approved')
  )
  .sort((a, b) => b.order - a.order); // Справа налево
```

#### Mass Update Pattern
```javascript
// Массовое обновление всех этапов за один запрос
const stageIds = stagesToDeactivate.map(s => s.id);
const updateData = {
  status: 'pending',
  started_at: null,
  completed_at: null,
};

await supabase
  .from('workflow_stages')
  .update(updateData)
  .in('id', stageIds)
  .select();
```

#### Client Filter Search Logic
```javascript
// Фильтрация клиентов по поисковому запросу
const filteredClients = useMemo(() => {
  if (!searchQuery) return clients;
  const query = searchQuery.toLowerCase();
  return clients.filter(client => 
    client.name.toLowerCase().includes(query)
  );
}, [clients, searchQuery]);
```

---

## TESTING

### Manual Testing Performed

1. **Stage Activation:**
   - ✅ Активация этапа активирует все предыдущие pending этапы
   - ✅ Модальное окно показывает правильный список этапов
   - ✅ Изменения видны всем ролям (клиентам тоже)

2. **Stage Deactivation:**
   - ✅ Деактивация этапа деактивирует все последующие активные этапы
   - ✅ Модальное окно показывает правильный список этапов (справа налево)
   - ✅ Изменения видны всем ролям

3. **Offers Filtering:**
   - ✅ Админы видят все офферы с возможностью фильтрации
   - ✅ AM видят все офферы с возможностью фильтрации
   - ✅ Клиенты видят только свои офферы (без фильтра)
   - ✅ Поиск работает корректно
   - ✅ Фильтр очищается правильно

### Edge Cases Tested

1. **Empty States:**
   - ✅ Нет этапов для активации/деактивации
   - ✅ Нет клиентов для фильтрации
   - ✅ Нет результатов поиска

2. **Role-Based Access:**
   - ✅ Клиенты не могут кликать на этапы
   - ✅ Клиенты не видят фильтр офферов
   - ✅ Админы и AM имеют полный доступ

3. **Error Handling:**
   - ✅ Ошибки при обновлении этапов обрабатываются корректно
   - ✅ Ошибки при загрузке офферов обрабатываются корректно

---

## LESSONS LEARNED

### Technical Lessons

1. **React Query для инвалидации кэша**
   - Использование `queryClient.invalidateQueries()` автоматически обновляет все связанные компоненты
   - Не нужно вручную обновлять состояние в каждом компоненте

2. **Массовые операции в БД**
   - Использование `UPDATE ... WHERE id IN (...)` эффективнее множественных отдельных обновлений
   - Меньше нагрузки на БД и быстрее выполнение

3. **Мемоизация для производительности**
   - Использование `useMemo` для фильтрации и вычисления списка клиентов
   - Избежание ненужных пересчетов при каждом рендере

4. **Условная логика на основе пути**
   - Использование `location.pathname.startsWith('/admin')` для определения контекста
   - Один компонент работает для разных ролей с разной логикой

### Process Lessons

1. **Важность уточнения требований**
   - Неправильное понимание "деактивировать предыдущие" привело к неправильной реализации
   - При неоднозначных требованиях нужно уточнять на конкретных примерах

2. **Проверка зависимостей**
   - Изменение файлов экспортов требует проверки всех зависимостей
   - После изменения `index.js` нужно проверять сборку проекта

3. **Итеративная разработка**
   - Регулярная обратная связь от пользователя помогает находить проблемы раньше
   - Предлагать пользователю протестировать функциональность после каждого значимого изменения

---

## CHALLENGES ENCOUNTERED

### Challenge 1: Неправильное понимание логики деактивации
- **Проблема:** Изначально реализована деактивация предыдущих этапов вместо последующих
- **Решение:** Изменено условие с `order <= targetStage.order` на `order >= targetStage.order`
- **Урок:** Важно уточнять требования и проверять логику на конкретных примерах

### Challenge 2: Ошибка экспорта компонентов
- **Проблема:** Случайно удалены экспорты `LegalTextViewer` и `AcceptOfferModal` из `index.js`
- **Решение:** Восстановлены все необходимые экспорты
- **Урок:** При изменении файлов экспортов нужно проверять все зависимости

### Challenge 3: Белый экран из-за ошибки сборки
- **Проблема:** Приложение не загружалось из-за отсутствующих экспортов
- **Решение:** Исправлены экспорты и проверена сборка
- **Урок:** Всегда проверять сборку после изменений в файлах экспортов

### Challenge 4: Неправильная логика определения деактивации
- **Проблема:** `isDeactivating` определялся только для активных этапов, но не для завершенных
- **Решение:** Изменено на `isDeactivating = isActive || isCompleted`
- **Урок:** Нужно учитывать все возможные состояния при определении логики

---

## FUTURE CONSIDERATIONS

### Potential Enhancements

1. **Тестирование логики каскадных операций**
   - Создать unit-тесты для функций `useActivateStageWithPrevious` и `useDeactivateStageWithPrevious`
   - Убедиться, что логика работает правильно для всех сценариев

2. **Улучшение UX модального окна**
   - Добавить визуальное отображение порядка этапов (например, с номерами)
   - Сделать более понятным, какие этапы будут затронуты

3. **Оптимизация фильтра клиентов**
   - Добавить виртуализацию списка для очень большого количества клиентов (100+)
   - Улучшить производительность при работе с большим количеством клиентов

4. **Документация компонентов**
   - Добавить JSDoc комментарии к новым компонентам и хукам
   - Упростить поддержку и использование компонентов в будущем

5. **Проверка сборки в CI/CD**
   - Добавить автоматическую проверку сборки в процесс разработки
   - Предотвратить ошибки сборки до коммита

---

## REFERENCES

### Related Documents
- **Reflection Document:** `memory-bank/reflection/reflection-project-stages-management-offers-filtering.md`
- **Tasks Document:** `memory-bank/tasks.md`
- **Progress Document:** `memory-bank/progress.md`

### Related Code Files
- `calculator/src/hooks/useStages.js` - Хуки для управления этапами
- `calculator/src/hooks/useOffers.js` - Хуки для работы с офферами
- `calculator/src/components/project/StageChangeModal.jsx` - Модальное окно смены этапа
- `calculator/src/components/offers/ClientFilter.jsx` - Компонент фильтра клиентов
- `calculator/src/pages/projects/ProjectPage.jsx` - Страница проекта
- `calculator/src/pages/offers/OffersPage.jsx` - Страница офферов

### Database Schema
- `calculator/supabase/migrations/001_initial_schema.sql` - Схема таблицы `workflow_stages`
- `calculator/supabase/migrations/002_rls_policies.sql` - RLS политики для `offers` и `workflow_stages`

---

## COMPLETION STATUS

- [x] Implementation complete
- [x] Reflection complete
- [x] Archiving complete
- [x] Documentation complete

**Status:** COMPLETED ✅

**Archive Date:** 2026-02-03
