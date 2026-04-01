# TASK ARCHIVE: Project Header Description & Sidebar Improvements

## METADATA
- **Task ID:** project-header-description
- **Date Completed:** 2026-02-20
- **Complexity:** Level 2
- **Type:** UI Enhancement

---

## SUMMARY

Добавление описания проекта в header открытого проекта с возможностью inline-редактирования. Улучшение сайдбара при свёрнутом состоянии — убран лишний UI (плюсик создания, список проектов с инициалами).

---

## REQUIREMENTS

1. Показывать описание проекта в header рядом с названием
2. Возможность редактировать описание inline (как название)
3. Упростить свёрнутый сайдбар — убрать лишние элементы

---

## IMPLEMENTATION

### 1. BoardHeader — Project Description

**Изменения в `retracker/src/components/board/BoardHeader.jsx`:**

- Добавлены состояния для редактирования описания:
  - `isEditingDesc` — флаг режима редактирования
  - `editDescValue` — значение в input
  - `descInputRef` — ref для фокуса

- Layout header:
  ```
  [ Название проекта ] [ Аватарки участников ]
    Описание проекта...
  ```

- Функции:
  - `handleDescClick()` — начать редактирование
  - `handleSaveDesc()` — сохранить через `updateWorkspace.mutate()`
  - `handleCancelDesc()` — отменить
  - `handleDescKeyDown()` — Enter/Escape

- Стилизация:
  - Input: `text-sm text-neutral-500 bg-transparent border-0 border-b border-emerald-400`
  - Paragraph: `text-sm text-neutral-500 mt-0.5 border-b border-transparent`
  - Динамическая ширина: `size={Math.max(editDescValue.length + 2, 30)}`

### 2. Sidebar Collapsed State

**Изменения в `retracker/src/components/layout/Layout.jsx`:**

- Убран плюсик создания проекта при `!sidebarOpen`
- Убран список проектов с буквами-инициалами
- Оставлена только иконка папки → ссылка на `/projects`

**До:**
```
[📁] — иконка проектов
[+]  — создать проект
[L]  — Lucky Fruits Slot
[T]  — Test Project
```

**После:**
```
[📁] — иконка проектов (ссылка на страницу проектов)
```

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `retracker/src/components/board/BoardHeader.jsx` | Добавлено описание + inline editing, аватарки рядом с названием |
| `retracker/src/components/layout/Layout.jsx` | Упрощён свёрнутый сайдбар |

---

## TESTING

- [x] Отображение описания в header
- [x] Клик → режим редактирования
- [x] Enter → сохранение
- [x] Escape → отмена
- [x] Blur → сохранение
- [x] Свёрнутый сайдбар — только иконка папки

---

## CHALLENGES & SOLUTIONS

### Challenge: Input Height Jump
При переключении между `<p>` и `<input>` контент прыгал на 1-2 пикселя.

**Root Cause:** Разные default styles браузера для input и p элементов.

**Solution:** 
- `border-b border-transparent` на `<p>` для matching height
- `size` атрибут для динамической ширины input
- Одинаковые `mt-0.5` отступы

---

## LESSONS LEARNED

1. **Input/Paragraph Height** — для pixel-perfect inline editing нужно явно задавать все box-model свойства обоим элементам

2. **Collapsed Sidebar** — минимум UI при свёрнутом состоянии = лучший UX

3. **Layout Iterations** — иногда нужно попробовать несколько вариантов (справа, снизу) прежде чем найти оптимальный

---

## RELATED TASKS

Эта задача — часть серии улучшений страницы проектов:
- Inline создание проектов (карточки/список/сайдбар)
- Избранное для workspaces (отдельно от досок)
- Кастомный Select компонент
- Сворачиваемый список проектов в сайдбаре

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-project-header-description.md`
- **Hook:** `useUpdateWorkspace` в `retracker/src/hooks/useWorkspaces.js`
