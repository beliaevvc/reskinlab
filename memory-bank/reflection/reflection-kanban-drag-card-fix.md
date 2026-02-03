# Reflection: Kanban Drag Card Fix

**Date:** 2026-02-04
**Task Type:** Bug Fix (Level 1)
**Status:** COMPLETED ✅

---

## Summary

Исправлен баг с растягиванием карточки задачи при перетаскивании в Kanban Board админки. При drag-and-drop карточка становилась слишком длинной из-за отсутствия фиксированных размеров у ghost-элемента.

---

## Problem Description

При перетаскивании карточки задачи в Task Board:
- Ghost-элемент (drag preview) создавался через `cloneNode(true)`
- Ghost добавлялся в `body` без фиксированных размеров
- Без контекста родительской колонки (width: 272px) ghost растягивался на всю ширину

---

## Root Cause Analysis

### Гипотезы (проверены через debug instrumentation):
1. **H1: Ghost не удаляется** — ОТКЛОНЕНА (логи подтвердили удаление)
2. **H2-H3: Ghost без размеров** — ПОДТВЕРЖДЕНА
3. **H6-H7: Ghost нуждается в фиксированных размерах и позиционировании** — ПОДТВЕРЖДЕНА

### Доказательства из логов:
- `targetWidth: 272, targetHeight: 107` — размеры wrapper DIV
- Ghost создавался без inline styles для width/height
- При добавлении в body ghost терял ограничения ширины

---

## Solution

**File:** `calculator/src/components/tasks/KanbanBoard.jsx`

### Before:
```javascript
const ghost = e.target.cloneNode(true);
ghost.style.opacity = '0.5';
document.body.appendChild(ghost);
e.dataTransfer.setDragImage(ghost, 0, 0);
```

### After:
```javascript
const ghost = e.target.cloneNode(true);
const rect = e.target.getBoundingClientRect();

// Fix ghost dimensions and position off-screen
ghost.style.width = `${rect.width}px`;
ghost.style.height = `${rect.height}px`;
ghost.style.position = 'fixed';
ghost.style.top = '-1000px';
ghost.style.left = '-1000px';
ghost.style.opacity = '0.8';
ghost.style.pointerEvents = 'none';
ghost.style.zIndex = '9999';

document.body.appendChild(ghost);
e.dataTransfer.setDragImage(ghost, rect.width / 2, rect.height / 2);
```

---

## Key Changes

1. **Фиксированные размеры:** Ghost получает точные размеры через `getBoundingClientRect()`
2. **Off-screen позиционирование:** `position: fixed` + `top/left: -1000px` предотвращает визуальное мерцание
3. **Центрирование курсора:** Drag image центрируется (`rect.width / 2, rect.height / 2`)
4. **Улучшенная видимость:** Opacity увеличена с 0.5 до 0.8

---

## What Went Well

- Быстрая идентификация проблемы через debug instrumentation
- Систематический подход с гипотезами и их проверкой
- Минимальные изменения кода для решения проблемы
- Логи чётко подтвердили root cause

---

## Lessons Learned

1. **Browser drag-and-drop:** Ghost-элементы в body требуют явных размеров, т.к. теряют CSS-контекст родителя
2. **getBoundingClientRect():** Надёжный способ получить computed размеры элемента
3. **Debug instrumentation:** Позволяет быстро верифицировать гипотезы без угадывания

---

## Files Modified

- `calculator/src/components/tasks/KanbanBoard.jsx` — исправлена функция `handleDragStart()`

---

## Testing

- Визуальная проверка drag-and-drop в админке
- Карточка сохраняет правильный размер при перетаскивании
- Функционал перемещения задач между колонками работает корректно
