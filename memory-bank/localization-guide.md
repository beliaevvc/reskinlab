# Гайд по локализации ReSkin Lab

> **Справочный документ** для локализации любых компонентов приложения.
> Обновлять при добавлении новых паттернов или namespace.

---

## Быстрый старт

### 1. Импорт и инициализация

```jsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('namespace'); // см. таблицу namespace ниже
  
  return <h1>{t('section.title')}</h1>;
}
```

### 2. Выбор namespace

| Namespace | Когда использовать |
|-----------|-------------------|
| `common` | Общие действия (save, cancel), статусы, профиль, accountSwitcher, stageChange |
| `admin` | Админ-панель: auditLog, dashboard, users, pricing, wallets, offer templates |
| `calculator` | Калькулятор: категории, пресеты, public calculator |
| `navigation` | Сайдбар, хедер, бредкрамбы |
| `projects` | Страницы проектов, стадии |
| `tasks` | Канбан, карточки задач, чеклисты |
| `offers` | Оферты, шаблоны оферт |
| `invoices` | Инвойсы, платежи |
| `specs` | Спецификации |
| `notifications` | Центр уведомлений |
| `auth` | Авторизация: login, register, logout |
| `errors` | Сообщения об ошибках |
| `files` | Файлы и загрузка |
| `comments` | Комментарии |

### 3. Добавление ключей

**EN:** `calculator/src/locales/en/[namespace].json`
**RU:** `calculator/src/locales/ru/[namespace].json`

---

## Структура файлов локализации

```
calculator/src/locales/
├── en/
│   ├── admin.json
│   ├── auth.json
│   ├── calculator.json
│   ├── comments.json
│   ├── common.json
│   ├── errors.json
│   ├── files.json
│   ├── invoices.json
│   ├── navigation.json
│   ├── notifications.json
│   ├── offers.json
│   ├── projects.json
│   ├── specs.json
│   └── tasks.json
└── ru/
    └── ... (зеркальная структура)
```

---

## Паттерны локализации

### Простая строка

```json
// en/common.json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

```jsx
t('actions.save')    // → "Save"
t('actions.cancel')  // → "Cancel"
```

### Интерполяция переменных

```json
// en/common.json
{
  "greeting": "Hello, {{name}}!",
  "itemCount": "{{count}} items selected"
}
```

```jsx
t('greeting', { name: 'John' })      // → "Hello, John!"
t('itemCount', { count: 5 })         // → "5 items selected"
```

### Множественное число (pluralization)

```json
// en/admin.json
{
  "auditLog": {
    "totalLogs": "{{count}} log",
    "totalLogs_plural": "{{count}} logs"
  }
}
```

```jsx
t('auditLog.totalLogs', { count: 1 })   // → "1 log"
t('auditLog.totalLogs', { count: 5 })   // → "5 logs"
```

### Динамические ключи (роли, статусы)

```json
// en/common.json
{
  "roles": {
    "admin": "Administrator",
    "am": "Account Manager", 
    "client": "Client"
  },
  "status": {
    "pending": "Pending",
    "active": "Active",
    "completed": "Completed"
  }
}
```

```jsx
const role = user.role;           // 'admin'
t(`roles.${role}`)                // → "Administrator"

const status = project.status;    // 'pending'
t(`status.${status}`)             // → "Pending"
```

### Вложенная структура

```json
// en/admin.json
{
  "auditLog": {
    "title": "Audit Log",
    "filters": {
      "action": "Action",
      "user": "User",
      "dateRange": "Date Range"
    },
    "table": {
      "time": "Time",
      "details": "Details"
    }
  }
}
```

```jsx
t('auditLog.title')           // → "Audit Log"
t('auditLog.filters.action')  // → "Action"
t('auditLog.table.time')      // → "Time"
```

---

## Локализация дат и чисел

### В компонентах (с useTranslation)

```jsx
import { useTranslation } from 'react-i18next';

export function DateDisplay({ date }) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
  
  return (
    <span>
      {new Date(date).toLocaleDateString(locale, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}
    </span>
  );
}
```

### В хуках (без useTranslation)

```jsx
import i18n from '../lib/i18n';

function getDateLocale() {
  return i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
}

export function useMyData() {
  const locale = getDateLocale();
  
  return useQuery({
    // ВАЖНО: добавить locale в queryKey для реактивности!
    queryKey: ['my-data', locale],
    queryFn: async () => {
      const monthName = new Date().toLocaleDateString(locale, { month: 'short' });
      // ...
    }
  });
}
```

### Форматы дат

```jsx
const locale = 'ru-RU'; // или 'en-US'

// Месяц короткий: "Feb" / "февр."
date.toLocaleDateString(locale, { month: 'short' })

// Месяц длинный: "February" / "февраль"
date.toLocaleDateString(locale, { month: 'long' })

// Полная дата: "Feb 10, 2026" / "10 февр. 2026 г."
date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

// Время: "2:30 PM" / "14:30"
date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

// День недели: "Monday" / "понедельник"
date.toLocaleDateString(locale, { weekday: 'long' })
```

---

## Билингвальные данные из БД

### Структура в БД

```sql
-- Поля с суффиксами _en и _ru
title_en TEXT,
title_ru TEXT,
description_en TEXT,
description_ru TEXT
```

### Хук useLanguage

```jsx
import { useLanguage } from '../hooks/useLanguage';

export function TaskCard({ task }) {
  const { getLocalized } = useLanguage();
  
  // task = { title_en: "Design", title_ru: "Дизайн", ... }
  const title = getLocalized(task, 'title');         // → "Дизайн" (если RU)
  const description = getLocalized(task, 'description');
  
  return <div>{title}</div>;
}
```

### Сохранение билингвальных данных

```jsx
const { isRussian } = useLanguage();

// При сохранении — в поле текущего языка
const updateData = {
  [isRussian ? 'title_ru' : 'title_en']: newTitle,
  [isRussian ? 'description_ru' : 'description_en']: newDescription,
};
```

---

## Компоненты для переключения языка

### LanguageSwitcher (кнопка)

```jsx
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Базовое использование
<LanguageSwitcher />

// С кастомными стилями (на тёмном фоне)
<LanguageSwitcher className="text-white hover:bg-white/20 [&_svg]:text-white/80" />
```

### LanguageContext

```jsx
import { useLanguageContext } from '../contexts/LanguageContext';

const { 
  language,      // 'en' | 'ru'
  setLanguage,   // (lang) => void
  isRussian,     // boolean
  getLocalized   // (obj, field) => string
} = useLanguageContext();
```

---

## Чеклист локализации нового компонента

- [ ] **Определить namespace** (см. таблицу выше)
- [ ] **Добавить ключи в EN:** `locales/en/[namespace].json`
- [ ] **Добавить ключи в RU:** `locales/ru/[namespace].json`
- [ ] **Импортировать:** `import { useTranslation } from 'react-i18next';`
- [ ] **Инициализировать:** `const { t } = useTranslation('namespace');`
- [ ] **Заменить хардкод:** все строки → `t('key')`
- [ ] **Даты:** использовать `toLocaleDateString(locale, options)`
- [ ] **Проверить:** переключить язык, убедиться что всё переведено
- [ ] **Линтер:** запустить проверку на ошибки

---

## Примеры локализованных компонентов

### Модалка подтверждения (StageChangeModal)

```jsx
import { useTranslation } from 'react-i18next';

export function StageChangeModal({ stage, isDeactivating }) {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h3>{isDeactivating ? t('stageChange.deactivateTitle') : t('stageChange.activateTitle')}</h3>
      <p>
        <span>{t('stageChange.stageLabel')}</span> {stage.name}
      </p>
      <p>
        {isDeactivating
          ? t('stageChange.deactivateSingle', { name: stage.name })
          : t('stageChange.activateSingle', { name: stage.name })}
      </p>
      <button>{t('stageChange.cancel')}</button>
      <button>{isDeactivating ? t('stageChange.deactivate') : t('stageChange.activate')}</button>
    </div>
  );
}
```

### Таблица с сортировкой (AuditLogsTable)

```jsx
import { useTranslation } from 'react-i18next';

export function AuditLogsTable() {
  const { t } = useTranslation('admin');
  
  const columns = [
    { key: 'created_at', label: t('auditLog.table.time') },
    { key: 'action', label: t('auditLog.table.action') },
    { key: 'user_role', label: t('auditLog.table.role') },
  ];
  
  return (
    <table>
      <thead>
        {columns.map(col => <th key={col.key}>{col.label}</th>)}
      </thead>
      {/* ... */}
    </table>
  );
}
```

### Пагинация

```jsx
<p>
  {t('auditLog.pagination.showing')} <span>{offset + 1}</span> {t('auditLog.pagination.to')}{' '}
  <span>{Math.min(offset + limit, total)}</span> {t('auditLog.pagination.of')}{' '}
  <span>{total}</span> {t('auditLog.pagination.logs')}
</p>
```

---

## Частые ошибки

### ❌ `t is not defined`

```jsx
// Забыли useTranslation
export function MyComponent() {
  return <h1>{t('title')}</h1>; // ❌ Error!
}
```

```jsx
// ✅ Исправление
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('common');
  return <h1>{t('title')}</h1>;
}
```

### ❌ Неправильный путь к i18n

```jsx
// ❌ Неправильно
import i18n from '../i18n';

// ✅ Правильно
import i18n from '../lib/i18n';
```

### ❌ Данные не обновляются при смене языка

```jsx
// ❌ Неправильно — нет locale в queryKey
return useQuery({
  queryKey: ['data'],
  queryFn: () => { /* ... */ }
});

// ✅ Правильно
const locale = getDateLocale();
return useQuery({
  queryKey: ['data', locale],  // Добавили locale!
  queryFn: () => { /* ... */ }
});
```

### ❌ Хардкоженные роли/статусы

```jsx
// ❌ Неправильно
const ROLES = { admin: 'Admin', am: 'AM', client: 'Client' };
<span>{ROLES[user.role]}</span>

// ✅ Правильно
<span>{t(`roles.${user.role}`)}</span>
```

### ❌ Хардкоженная локаль дат

```jsx
// ❌ Неправильно
date.toLocaleDateString('en', { month: 'short' })

// ✅ Правильно
const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
date.toLocaleDateString(locale, { month: 'short' })
```

---

## Существующие ключи (справочник)

### common.json

```
actions.*           — save, cancel, delete, edit, create, add, remove, close...
status.*            — draft, pending, inProgress, completed, cancelled, approved...
labels.*            — name, email, phone, address, company, date, time, amount...
profile.*           — title, subtitle, avatar, fullName, email, phone, bio...
accountSwitcher.*   — roles, switchAccount, addAccount, signOut, modal.*, errors.*
stageChange.*       — deactivateTitle, activateTitle, stageLabel, cancel, processing...
```

### admin.json

```
dashboard.*         — stats (totalProjects, activeProjects, revenue...), charts...
users.*             — table (name, email, role, projects, revenue...), filters...
auditLog.*          — title, subtitle, filters.*, table.*, pagination.*, timeline.*...
pricing.*           — categories, items, styles, animations...
wallets.*           — title, addWallet, network, address...
```

### calculator.json

```
title, subtitle
categories.*        — conceptDocument, symbols, backgrounds, popups, uiMenus, promo
sidebar.*           — total, revisions, rights, model, promo, estimatedTotal...
options.*           — title, orderType, usageRights, paymentModel, style, revisions...
orderTypes.*        — artOnly, animOnly, artAndAnim...
public.*            — calculatorTitle, banner, loadingSelection, yourSelectionCode...
```

### projects.json, tasks.json, offers.json, invoices.json, specs.json

```
(Структуру см. в соответствующих файлах)
```

---

## Добавление нового namespace

1. Создать файл `locales/en/[namespace].json`
2. Создать файл `locales/ru/[namespace].json`
3. Добавить namespace в `lib/i18n.js`:

```js
i18n.init({
  ns: ['common', 'admin', ..., 'newNamespace'],
  // ...
});
```

4. Использовать: `const { t } = useTranslation('newNamespace');`

---

## Связанные файлы

| Файл | Описание |
|------|----------|
| `src/lib/i18n.js` | Конфигурация i18next |
| `src/contexts/LanguageContext.jsx` | Контекст языка |
| `src/hooks/useLanguage.js` | Хук для билингвальных данных |
| `src/components/LanguageSwitcher.jsx` | Переключатель языка |
| `locales/en/*.json` | Английские переводы |
| `locales/ru/*.json` | Русские переводы |

---

*Последнее обновление: 2026-02-10*
