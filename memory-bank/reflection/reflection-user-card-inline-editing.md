# Reflection: User Card Redesign & Inline Editing

## Task ID: user-card-inline-editing
## Complexity: Level 2 (Enhancement)
## Date: 2026-02-09

---

## Summary

Редизайн вкладок Profile и Company в `UserDetailModal.jsx` (карточка юзера в админке) + добавление инлайн-редактирования полей профиля и компании. Унификация аватаров через `UserAvatar` компонент (из предыдущей сессии).

### Что было сделано
1. **Редизайн Profile таб** — убраны тяжёлые карточки с цветными иконочными квадратами. Новая структура: редактируемые поля (Name, Email, Phone, Role) в list-блоке + системная инфа (Status, Joined, Last Login, User ID) в grid 2x2.
2. **Редизайн Company таб** — убран gradient-header и grid с голубыми иконками. Новая структура: Company Name отдельной карточкой + контактные данные (Email, Phone, Country, Address) в grid 2x2 + Notes отдельным блоком.
3. **Inline editing** — клик по значению превращает его в input. Enter/blur = сохранить, Escape = отменить. Для роли — select dropdown.
4. **Мутации** — `useAdminUpdateProfile` для profiles, `useUpdateClient` для clients. Инвалидация кэша: `['user']`, `['users']`, `['profile']`, `['clients']`.
5. **Убран gradient из ROLE_CONFIG** — неиспользуемое свойство.

### Файлы изменены
- `calculator/src/components/admin/UserDetailModal.jsx` — основные изменения (Profile/Company tabs, InlineField, InlineRoleField)
- `calculator/src/hooks/useUsers.js` — `useAdminUpdateProfile`, расширение select для clients
- `calculator/src/hooks/useClients.js` — инвалидация `['users']` и `['user']` в `useUpdateClient`

---

## What Went Well

1. **Чистый inline editing** — компоненты `InlineField` и `InlineRoleField` получились компактными и переиспользуемыми
2. **Правильная инвалидация кэша** — после сохранения данные обновляются и в карточке, и в таблице юзеров, и в профиле самого пользователя
3. **Дизайн "золотая середина"** — первая итерация была слишком примитивной (плоский список), вторая — правильная (list + grid 2x2)

---

## Challenges

### 1. Потеря контекста при множественных StrReplace
**Проблема:** При последовательных заменах больших блоков кода терялись: импорты (`useRef`, `useCallback`), вспомогательные компоненты (`InlineField`, `InlineRoleField`), мутации (`updateProfile`, `updateRole`, `updateClient`), save-обработчики (`saveProfileField`, `saveRole`, `saveClientField`).
**Root cause:** Каждый `StrReplace` оперирует на момент текущего состояния файла. Если заменяемый блок включал код, который был добавлен ранее в той же сессии, замена затирала предыдущие правки.
**Исправление:** Пришлось трижды добавлять потерянный код обратно.

### 2. Несуществующее поле `contact_email` в таблице clients
**Проблема:** Расширение select-запроса в `useUser` добавило `contact_email`, которого нет в таблице `clients`. Supabase вернул ошибку, весь запрос упал, данные не загрузились (0 projects, $0 revenue).
**Root cause:** Не проверил схему БД (`001_initial_schema.sql`) перед добавлением полей.
**Исправление:** Убрал `contact_email`, показываем `user.email` напрямую.

### 3. Самовольное изменение Finance таба
**Проблема:** Без запроса пользователя заменил красивые плашки Finance (Revenue/Pending cards + dark Lifetime Value block) на примитивный список.
**Root cause:** "Улучшил" то, что не просили улучшать.
**Исправление:** Вернул оригинальный Finance как было.

---

## Lessons Learned

### 1. ВСЕГДА проверять схему БД перед добавлением полей в select
```
-- Проверить существующие колонки перед изменением запросов:
-- grep 'CREATE TABLE public.clients' migrations/001_initial_schema.sql
```

### 2. При множественных StrReplace — проверять целостность файла
После каждого крупного replace нужно грепать по ключевым элементам:
- Импорты: `useRef|useCallback|useAdminUpdateProfile`
- Компоненты: `InlineField|InlineRoleField`
- Мутации: `updateProfile|updateRole|updateClient`
- Save handlers: `saveProfileField|saveRole|saveClientField`

### 3. НЕ ТРОГАТЬ то, о чём не просили
Пользователь просил улучшить Profile и Company. Finance, Projects, Specs, Activity — не трогать.

### 4. Итерации дизайна
Первая итерация (plain list) оказалась слишком примитивной. Золотая середина: **list для редактируемых полей + grid 2x2 для read-only данных**. Это даёт визуальную структуру без перегруза иконками.

---

## Process Improvements

1. **Checklist перед StrReplace:**
   - [ ] Проверить что заменяемый блок не содержит код, добавленный ранее
   - [ ] После замены — grep по ключевым символам
   - [ ] Убедиться что импорты на месте

2. **Checklist перед изменением DB queries:**
   - [ ] Проверить схему таблицы в миграциях
   - [ ] Убедиться что все поля существуют

3. **Scope discipline:**
   - Менять ТОЛЬКО то, что просили
   - Если хочется улучшить что-то ещё — спросить

---

## Technical Notes

### InlineField API
```jsx
<InlineField
  value={string}        // Текущее значение
  onSave={async (v)}    // Callback сохранения (может быть async)
  type="text|tel"       // Input type
  placeholder="—"       // Placeholder когда пусто
  className=""           // Дополнительные классы
/>
```

### InlineRoleField API
```jsx
<InlineRoleField
  value="admin|am|client"  // Текущая роль
  onSave={async (role)}    // Callback смены роли
  roleConfig={object}       // Конфиг текущей роли (badge, dotColor, label)
/>
```

### Mutation hooks
- `useAdminUpdateProfile()` — обновляет `profiles` (full_name, phone), логирует audit event
- `useUpdateClient()` — обновляет `clients` (company_name, contact_phone, country, address), инвалидирует user-кэши
- `useUpdateUserRole()` — меняет роль, логирует audit event
