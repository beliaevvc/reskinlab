# Plan: Phase 6 — Admin Panel

**Status:** Planning Complete  
**Created:** 2026-02-02  

---

## Scope

Полноценная админка для управления платформой: пользователи, клиенты, настройки, аудит.

---

## 6.1 User Management

### 6.1.1 Users List Page (`/admin/users`)
**Функционал:**
- Таблица всех пользователей (profiles)
- Колонки: Avatar, Name, Email, Role, Created, Last Login
- Фильтры: по роли (admin/am/client), поиск по email/name
- Действия: Edit Role, View Profile

**Компоненты:**
- `UsersPage.jsx` — страница
- `UsersTable.jsx` — таблица с сортировкой/фильтрацией
- `UserRoleModal.jsx` — модалка смены роли

**Hooks:**
- `useUsers()` — получение списка пользователей
- `useUpdateUserRole()` — изменение роли

---

### 6.1.2 Clients Management (`/admin/clients`)
**Функционал:**
- Таблица клиентов (companies)
- Колонки: Company, Contact Person, Email, Projects Count, Total Revenue
- Детальная карточка клиента с историей проектов
- Создание клиента вручную (без регистрации)

**Компоненты:**
- `ClientsPage.jsx` — страница
- `ClientsTable.jsx` — таблица
- `ClientDetailModal.jsx` — детали клиента
- `CreateClientModal.jsx` — создание клиента

**Hooks:**
- `useClients()` — список клиентов с агрегацией
- `useClientDetails()` — детали клиента
- `useCreateClient()` — создание клиента

---

### 6.1.3 AM Assignment
**Функционал:**
- На странице проекта (admin view) — dropdown выбора AM
- Bulk assignment — назначить AM на несколько проектов
- История назначений (audit)

**Компоненты:**
- `AMAssignmentDropdown.jsx` — выбор AM
- `BulkAssignModal.jsx` — массовое назначение

**Hooks:**
- `useAssignAM()` — назначение AM на проект
- `useAMList()` — список доступных AM

---

## 6.2 Settings

### 6.2.1 Price Configuration (`/admin/settings/pricing`)
**Функционал:**
- Редактирование базовых цен калькулятора
- Коэффициенты сложности
- Минимальные/максимальные значения
- История изменений

**Компоненты:**
- `PricingSettingsPage.jsx`
- `PriceConfigForm.jsx`
- `PriceHistoryTable.jsx`

**Hooks:**
- `usePriceConfig()` — текущие настройки
- `useUpdatePriceConfig()` — обновление

---

### 6.2.2 Promo Codes (`/admin/settings/promo`)
**Функционал:**
- CRUD промо-кодов
- Типы: процент, фиксированная сумма
- Условия: срок действия, лимит использований, мин. сумма
- Статистика использования

**Компоненты:**
- `PromoCodesPage.jsx`
- `PromoCodeTable.jsx`
- `PromoCodeModal.jsx` — создание/редактирование

**Hooks:**
- `usePromoCodes()` — список
- `useCreatePromoCode()` — создание
- `useUpdatePromoCode()` — обновление
- `usePromoCodeStats()` — статистика

---

### 6.2.3 Offer Templates (`/admin/settings/templates`)
**Функционал:**
- Шаблоны текстов для офферов
- Legal text редактор
- Переменные подстановки ({{client_name}}, {{total}}, etc.)
- Preview

**Компоненты:**
- `OfferTemplatesPage.jsx`
- `TemplateEditor.jsx` — rich text с переменными
- `TemplatePreviewModal.jsx`

**Hooks:**
- `useOfferTemplates()` — список шаблонов
- `useSaveTemplate()` — сохранение

---

### 6.2.4 Audit Logs (`/admin/audit`)
**Функционал:**
- Просмотр всех критических действий
- Фильтры: по типу, пользователю, дате
- Детали: что изменилось (before/after)
- Экспорт в CSV

**Компоненты:**
- `AuditLogsPage.jsx`
- `AuditLogTable.jsx`
- `AuditLogDetailModal.jsx`
- `ExportButton.jsx`

**Hooks:**
- `useAuditLogs()` — с пагинацией и фильтрами

---

## Database Changes

```sql
-- Таблица шаблонов офферов (если нет)
CREATE TABLE IF NOT EXISTS public.offer_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'legal_text',
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## File Structure

```
src/
├── pages/
│   └── admin/
│       ├── UsersPage.jsx
│       ├── ClientsPage.jsx
│       ├── settings/
│       │   ├── PricingPage.jsx
│       │   ├── PromoCodesPage.jsx
│       │   └── TemplatesPage.jsx
│       └── AuditLogsPage.jsx
├── components/
│   └── admin/
│       ├── UsersTable.jsx
│       ├── ClientsTable.jsx
│       ├── AMAssignmentDropdown.jsx
│       ├── PromoCodeModal.jsx
│       ├── TemplateEditor.jsx
│       └── AuditLogTable.jsx
└── hooks/
    ├── useUsers.js
    ├── useClients.js (extend existing)
    ├── usePromoCodes.js
    ├── useOfferTemplates.js
    └── useAuditLogs.js
```

---

## Implementation Order

| # | Task | Complexity | Dependencies |
|---|------|------------|--------------|
| 1 | Users hooks + table | Medium | — |
| 2 | Users page + role modal | Medium | #1 |
| 3 | Clients hooks + table | Medium | — |
| 4 | Clients page + details | Medium | #3 |
| 5 | AM Assignment | Low | #2 |
| 6 | Audit logs hooks + page | Medium | — |
| 7 | Promo codes CRUD | Medium | — |
| 8 | Price config page | Low | — |
| 9 | Offer templates | High | — |

---

## Estimated Effort

- **Total components:** ~15
- **Total hooks:** ~8
- **SQL changes:** minimal
- **Complexity:** Medium
