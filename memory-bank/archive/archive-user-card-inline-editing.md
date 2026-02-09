# TASK ARCHIVE: User Card Redesign & Inline Editing

## METADATA
- **Task ID:** user-card-inline-editing
- **Date:** 2026-02-09
- **Complexity:** Level 2 (Enhancement)
- **Status:** COMPLETED ✅

---

## SUMMARY

Редизайн вкладок Profile и Company в `UserDetailModal.jsx` + инлайн-редактирование полей профиля и компании из админки. Данные сохраняются в Supabase, кэш react-query инвалидируется, изменения отражаются везде (карточка, таблица юзеров, профиль пользователя).

---

## REQUIREMENTS

1. Сделать Profile и Company табы визуально лучше — но без градиентов, теней, цветных иконочных квадратов
2. Инлайн-редактирование в Profile: Full Name, Phone, Role
3. Инлайн-редактирование в Company: Company Name, Phone, Country, Address
4. Email — не редактируется
5. Изменения должны сохраняться в БД и отражаться в профиле юзера

---

## IMPLEMENTATION

### UI: Profile таб
- **Верхний блок (list):** Full Name, Email, Phone, Role — редактируемые поля с `InlineField` / `InlineRoleField`
- **Нижний блок (grid 2x2):** Status, Joined, Last Login, User ID — read-only карточки
- **Company quick link** — кнопка-ссылка на Company таб (если клиент)

### UI: Company таб
- **Company Name** — отдельная карточка с `InlineField`
- **Grid 2x2:** Contact Email (read-only), Phone, Country, Address — `InlineField`
- **Notes** — отдельный read-only блок

### Компоненты
- `InlineField` — универсальный инлайн-редактор (text/tel). Click → input, Enter/blur → save, Escape → cancel
- `InlineRoleField` — инлайн select для смены роли (admin/am/client)

### Мутации
- `useAdminUpdateProfile()` — UPDATE profiles (full_name, phone) + audit log
- `useUpdateUserRole()` — UPDATE profiles.role + audit log (существовал ранее)
- `useUpdateClient()` — UPDATE clients (company_name, contact_phone, country, address) + инвалидация user-кэшей

### Кэш-инвалидация
- `['user', userId]` — карточка юзера
- `['users']` — таблица юзеров
- `['profile']` — профиль самого пользователя
- `['clients']` — список клиентов

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `calculator/src/components/admin/UserDetailModal.jsx` | Редизайн Profile/Company табов, InlineField/InlineRoleField компоненты, save handlers, мутации |
| `calculator/src/hooks/useUsers.js` | `useAdminUpdateProfile()`, расширение select для clients (country, address, notes) |
| `calculator/src/hooks/useClients.js` | Инвалидация `['users']` и `['user']` в `useUpdateClient` |

---

## ISSUES ENCOUNTERED & FIXED

1. **`contact_email` не существует в таблице clients** — ломало загрузку всех данных. Убрано, показываем `user.email`
2. **Потеря импортов/компонентов при StrReplace** — трижды восстанавливал потерянный код
3. **Самовольное изменение Finance таба** — вернул оригинал

---

## LESSONS LEARNED

1. Проверять схему БД перед изменением select-запросов
2. После каждого StrReplace — grep по ключевым символам
3. Не менять то, о чём не просили
4. Дизайн "золотая середина": list для editable + grid 2x2 для read-only

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-user-card-inline-editing.md`
- **DB Schema:** `calculator/supabase/migrations/001_initial_schema.sql` (clients table)
- **Related archive:** `memory-bank/archive/archive-admin-dashboard-users-improvements.md`
