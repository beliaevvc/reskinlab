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

## 9. Общие правила

1. **Не использовать нативные `<select>`** — только `<Select>` из `src/components/Select.jsx`
2. **Не использовать `!important`**
3. **Focus-стили:** `focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`
4. **Hover-стили для интерактивных элементов** — всегда добавлять `transition-colors`
5. **Скругления:** `rounded` для мелких элементов, `rounded-lg` для карточек и инпутов
6. **Тени:** `shadow-lg` только для выпадающих списков и модальных окон
7. **z-index:** `z-50` для выпадающих списков, `z-[9999]` для модальных окон

---

*Последнее обновление: 2026-02-06*
