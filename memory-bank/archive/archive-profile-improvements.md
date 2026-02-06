# TASK ARCHIVE: Profile Improvements & Avatar System

## METADATA
- **Task ID:** profile-improvements
- **Date Started:** 2026-02-07
- **Date Completed:** 2026-02-07
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Полный редизайн страницы профиля для всех ролей (client, admin, AM) с добавлением загрузки аватара, смены пароля и Danger Zone. Расширение модели данных профиля (phone, telegram, bio для staff). Подтягивание аватаров во все компоненты приложения: AccountSwitcher, комментарии к задачам, аудит-логи, дашборд. Исправление роутинга профиля для admin/AM.

---

## REQUIREMENTS

### Клиентский профиль (существовал, улучшения):
1. Добавить загрузку аватара
2. Заменить нативный `<select>` на кастомный `<Select>` из дизайн-системы
3. Закрепить кнопку "Save Changes" вверху страницы

### Профиль Admin/AM (новый функционал):
1. Аватар (как у клиента)
2. Дополнительные поля: Phone, Telegram, Bio
3. Смена пароля
4. Роль — read-only
5. Danger Zone (деактивация аккаунта)
6. Профили admin и AM — одинаковые

### Сквозные улучшения:
- Аватары в AccountSwitcher
- Аватары в комментариях к задачам
- Аватары в аудит-логах и дашборде

---

## IMPLEMENTATION

### 1. Миграция БД
**Файл:** `calculator/supabase/migrations/042_profile_extra_fields.sql`
- Добавлены поля `phone TEXT`, `telegram TEXT`, `bio TEXT` в таблицу `profiles`
- RLS-политики не потребовались — существующие покрывают новые колонки

### 2. AuthContext — 3 новые функции
**Файл:** `calculator/src/contexts/AuthContext.jsx`
- `uploadAvatar(file)` — удаление старых файлов → загрузка в Supabase Storage (`avatars` bucket) → cache-buster URL → обновление profile.avatar_url
- `changePassword(newPassword)` — `supabase.auth.updateUser({ password })`
- `deactivateAccount()` — `is_active = false` → аудит-лог → signOut

### 3. ProfilePage — полный редизайн
**Файл:** `calculator/src/pages/profile/ProfilePage.jsx`
- **Аватар:** кликабельный 96px, hover-overlay с камерой, удаление, fallback на инициалы, валидация (5MB, jpeg/png/webp/gif)
- **Sticky Save:** `backdrop-blur`, активна только при изменениях (change detection через useEffect)
- **Секция Account:** email (read-only), full name, role badge (admin=red, am=blue, client=amber)
- **Секция Contact & Bio (staff only):** Phone, Telegram (с @-префиксом), Bio (счётчик символов)
- **Секция Company (client only):** Type через `<Select>`, company name, country, address, contact name/phone
- **Секция Password:** раскрываемая, валидация (min 6, совпадение), отдельная форма
- **Danger Zone:** красная рамка, деактивация через ввод "DEACTIVATE"

### 4. Фикс роутинга
**Файл:** `calculator/src/components/layout/AppSidebar.jsx`
- Ссылка Profile: `/profile` → динамическая по роли (`isAdmin ? '/admin/profile' : isAM ? '/am/profile' : '/profile'`)

### 5. AccountSwitcher — аватары
**Файл:** `calculator/src/components/admin/AccountSwitcher.jsx`
- useEffect синхронизирует `avatar_url`, `full_name`, `role` текущего пользователя в localStorage
- Заголовок дропдауна: реальный аватар вместо инициала
- Список аккаунтов: кэшированные аватары, реальные имена, цвет кружка по роли

### 6. CommentItem — аватары
**Файл:** `calculator/src/components/comments/CommentItem.jsx`
- `comment.author.avatar_url` уже приходил из `useComments` (join на profiles)
- Добавлен `<img>` с fallback на цветной кружок с инициалом

### 7. Аудит-логи — аватары
**Файлы:**
- `calculator/src/hooks/useAuditLogs.js` — добавлен `avatar_url` в select
- `calculator/src/components/audit-logs/AuditLogsTable.jsx` — аватар в десктоп-таблице и мобильных карточках
- `calculator/src/pages/admin/AdminDashboardPage.jsx` — аватар в Recent Activity

---

## TESTING

- Сборка Vite: ✅ (995 modules, 0 errors)
- Линтер: ✅ (0 errors)
- Ручное тестирование пользователем: профиль admin, комментарии, AccountSwitcher

---

## LESSONS LEARNED

1. **Роуты по ролям:** ссылки в навигации должны быть динамическими при наличии role-prefixed маршрутов
2. **Аватары — сквозная фича:** при добавлении аватаров проверять все компоненты с пользователями
3. **Cache-buster:** `?t=Date.now()` в URL аватара решает проблему кэширования браузера
4. **Данные часто уже есть:** avatar_url был в запросах комментариев, но не использовался в UI
5. **Storage bucket уже существовал:** проверка существующей инфраструктуры перед созданием новой

---

## FILES

### Created
| File | Description |
|------|-------------|
| `calculator/supabase/migrations/042_profile_extra_fields.sql` | Миграция: phone, telegram, bio |

### Modified
| File | Description |
|------|-------------|
| `calculator/src/contexts/AuthContext.jsx` | +3 функции, экспорт |
| `calculator/src/pages/profile/ProfilePage.jsx` | Полный редизайн |
| `calculator/src/components/layout/AppSidebar.jsx` | Динамическая ссылка Profile |
| `calculator/src/components/admin/AccountSwitcher.jsx` | Аватары и имена |
| `calculator/src/components/comments/CommentItem.jsx` | Аватары в комментариях |
| `calculator/src/components/audit-logs/AuditLogsTable.jsx` | Аватары в логах |
| `calculator/src/pages/admin/AdminDashboardPage.jsx` | Аватары в Activity |
| `calculator/src/hooks/useAuditLogs.js` | avatar_url в select |

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-profile-improvements.md`
- **Style Guide:** `memory-bank/style-guide.md` (Select, цвета, badges)
- **Storage Policies:** `calculator/supabase/migrations/003_storage.sql` (avatars bucket)

---

*Archived: 2026-02-07*
