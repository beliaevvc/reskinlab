# ReSkin Lab — UI Style Guide

Документ фиксирует UI-решения проекта, чтобы обеспечить единообразие компонентов.

---

## 1. Цветовая палитра

### Основные цвета
| Назначение | Tailwind-класс | Описание |
|---|---|---|
| Primary / Accent | `emerald-500`, `emerald-600` | Кнопки, фокус, активные элементы |
| Primary hover | `emerald-600`, `emerald-700` | Hover-состояния |
| Primary light | `emerald-50`, `emerald-100` | Фон выделенных элементов |
| Text primary | `neutral-900` | Основной текст |
| Text secondary | `neutral-700` | Второстепенный текст |
| Text muted | `neutral-500`, `neutral-400` | Подписи, лейблы |
| Borders | `neutral-200` | Границы карточек и инпутов |
| Borders hover | `neutral-300` | Hover-состояние границ |
| Background | `white`, `neutral-50` | Фон карточек, строк таблиц |

### Статусные цвета
| Статус | Background | Text |
|---|---|---|
| Success / Create | `emerald-100` | `emerald-700` |
| Info / Update | `blue-100` | `blue-700` |
| Warning | `amber-100` | `amber-700` |
| Danger / Delete | `red-100` | `red-700` |

---

## 2. Компоненты форм

### 2.1 Select (Dropdown)

**Компонент:** `src/components/Select.jsx`

**Правило:** Везде, где нужен выпадающий список — использовать `<Select>`, **не** нативный `<select>`.

**Интерфейс:**
```jsx
import { Select } from '../Select';

<Select
  value={currentValue}
  onChange={(val) => handleChange(val)}
  options={[
    { value: 'all', label: 'All Items' },
    { value: 'active', label: 'Active' },
  ]}
  disabled={false}
  className=""
/>
```

**Стиль:**
- Триггер: `bg-neutral-50 border-neutral-200`, при открытии `border-emerald-500 ring-1`
- Список: `absolute z-50 bg-white border shadow-lg max-h-60 overflow-auto`
- Активный пункт: `bg-emerald-50 text-emerald-700 font-medium` + иконка `check`
- Hover: `hover:bg-neutral-50`
- Chevron поворачивается на 180° при открытии
- Закрывается по клику вне и по Escape

### 2.2 Text Input

```jsx
<input
  type="text"
  className="w-full border border-neutral-200 rounded-lg bg-white px-3 py-2 text-sm text-neutral-700 
             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
             hover:border-neutral-300 transition-colors"
/>
```

### 2.3 Date Input

```jsx
<input
  type="date"
  className="w-full border border-neutral-200 rounded-lg bg-white px-3 py-2 text-sm text-neutral-700 
             focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
             hover:border-neutral-300 transition-colors"
/>
```

### 2.4 Labels для фильтров

```jsx
<label className="block text-xs font-medium text-neutral-500 mb-1">Label</label>
```

---

## 3. Кнопки

### Primary
```jsx
<button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium 
                   hover:bg-emerald-600 transition-colors">
```

### Secondary
```jsx
<button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg text-sm font-medium 
                   hover:bg-neutral-200 transition-colors">
```

### Ghost / Text
```jsx
<button className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
```

### Preset / Tag Button
```jsx
<button className="px-3 py-1.5 rounded text-xs font-medium bg-neutral-100 text-neutral-600 
                   hover:bg-neutral-200 transition-colors">
```
Активный: `bg-emerald-500 text-white`

---

## 4. Таблицы

### Заголовок
```jsx
<th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
```

### Ячейка
```jsx
<td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-600">
```

### Строка hover
```jsx
<tr className="hover:bg-neutral-50 transition-colors cursor-pointer">
```

### Развёрнутая строка
```jsx
<tr>
  <td colSpan={N} className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
```

---

## 5. Карточки / Панели

```jsx
<div className="bg-white rounded-lg border border-neutral-200">
```

С заголовком:
```jsx
<div className="bg-white rounded-lg border border-neutral-200">
  <div className="px-4 py-3 border-b border-neutral-100">
    {/* header */}
  </div>
  <div className="px-4 py-3">
    {/* content */}
  </div>
</div>
```

---

## 6. Badges / Tags

### Роли
| Роль | Classes |
|---|---|
| admin | `bg-red-100 text-red-700` |
| am | `bg-blue-100 text-blue-700` |
| client | `bg-amber-100 text-amber-700` |
| unknown | `bg-neutral-100 text-neutral-600` |

### Действия
| Действие | Classes |
|---|---|
| create | `bg-emerald-100 text-emerald-700` |
| update | `bg-blue-100 text-blue-700` |
| delete | `bg-red-100 text-red-700` |
| login/logout | `bg-purple-100 text-purple-700` |
| page_view | `bg-neutral-100 text-neutral-600` |

---

## 7. Иконки

**Компонент:** `src/components/Icon.jsx`

Доступные иконки передаются через `name` prop. Использовать `<Icon>` вместо инлайн SVG, где возможно.

```jsx
import { Icon } from '../Icon';
<Icon name="chevronDown" size={16} className="text-neutral-400" />
```

---

## 8. Типографика

| Элемент | Classes |
|---|---|
| Page title | `text-2xl font-bold text-neutral-900` |
| Section title | `text-lg font-semibold text-neutral-900` |
| Card title | `text-sm font-semibold text-neutral-800` |
| Body text | `text-sm text-neutral-700` |
| Caption / Label | `text-xs text-neutral-500` |
| Uppercase label | `text-xs font-medium text-neutral-400 uppercase tracking-wider` |

---

## 9. Модальные окна подтверждения (Confirm Modal)

**Правило:** Везде, где нужно подтверждение действия — использовать кастомную модалку, **не** нативный `confirm()` / `alert()`.

**Структура:**
```jsx
{showConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Overlay */}
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
    {/* Modal */}
    <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
      {/* Icon + Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center {iconBgClass}">
          {/* SVG icon */}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      </div>
      {/* Message */}
      <p className="text-sm text-neutral-600 mb-6">{message}</p>
      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 px-4 py-2.5 rounded-md border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors text-sm">
          Cancel
        </button>
        <button className="flex-1 px-4 py-2.5 rounded-md text-white font-medium transition-colors text-sm {confirmBtnClass}">
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
)}
```

**Цвета иконки и кнопки по типу действия:**

| Тип действия | Icon bg | Icon color | Confirm button |
|---|---|---|---|
| Success / Complete | `bg-emerald-100` | `text-emerald-600` | `bg-emerald-500 hover:bg-emerald-600` |
| Warning / Archive | `bg-amber-100` | `text-amber-600` | `bg-amber-500 hover:bg-amber-600` |
| Danger / Delete | `bg-red-100` | `text-red-600` | `bg-red-500 hover:bg-red-600` |
| Info | `bg-blue-100` | `text-blue-600` | `bg-blue-500 hover:bg-blue-600` |

**Ключевые правила:**
- Overlay: `bg-black/50 backdrop-blur-sm`
- Контейнер: `max-w-sm rounded-lg shadow-xl p-6`
- Cancel-кнопка всегда слева, Confirm-кнопка справа
- Обе кнопки `flex-1` (одинаковой ширины)
- Закрывается по клику на overlay
- Текст сообщения может содержать название сущности (жирным через `<span className="font-medium">`)

---

## 10. Общие правила

1. **Не использовать нативные `<select>`** — только `<Select>` из `src/components/Select.jsx`
2. **Не использовать нативные `confirm()` / `alert()`** — только кастомные модалки (см. секцию 9)
3. **Не использовать `!important`**
4. **Focus-стили:** `focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`
5. **Hover-стили для интерактивных элементов** — всегда добавлять `transition-colors`
6. **Скругления:** `rounded` для мелких элементов, `rounded-lg` для карточек и инпутов
7. **Тени:** `shadow-lg` только для выпадающих списков и модальных окон
8. **z-index:** `z-50` для выпадающих списков, `z-[9999]` для модальных окон

---

*Последнее обновление: 2026-02-07*
