# TASK ARCHIVE: Task Card Deadline UI Redesign

## METADATA
- **Task ID:** task-deadline-ui-redesign
- **Date:** 4 Февраля 2026
- **Complexity Level:** 1 (Quick UI Fix)
- **Duration:** ~15 минут
- **Status:** ARCHIVED ✅

---

## SUMMARY

Редизайн секции настройки дедлайна в карточке задачи (`TaskDetailModal.jsx`). Старый дизайн был визуально грубым и не соответствовал общему стилю приложения. Новый дизайн использует emerald акценты, красивые карточки с мини-календарём, и добавляет UX-улучшения (быстрые действия).

---

## REQUIREMENTS

**Проблема:**
- Дизайн настроек дедлайна был "топорный и некрасивый"
- Серый фон, стандартные HTML инпуты
- Простой сегментный контрол без визуальной привлекательности

**Цель:**
- Улучшить визуальный стиль в соответствии с дизайн-системой проекта
- Сохранить функциональность (дата, дата+время, диапазон)

---

## IMPLEMENTATION

### Изменённый файл
- `calculator/src/components/tasks/TaskDetailModal.jsx`

### Визуальные изменения

| Элемент | Было | Стало |
|---------|------|-------|
| Заголовок | Иконка + текст + кнопка | Иконка в цветном бейдже + текст |
| Переключатель типов | bg-neutral-200 сегмент | Кнопки с иконками, border-2, emerald акцент |
| Инпуты | border-neutral-200, rounded | Белые, rounded-lg, focus-ring эффект |
| Кнопки действий | text-xs, мелкие | Полноразмерные с иконками и тенями |
| Отображение дедлайна | inline badge | Карточка с мини-календарём, градиент |
| Пустое состояние | Текст курсивом | Кнопка с border-dashed |

### Новые UX-фичи

1. **Быстрый выбор дедлайна:**
   - Сегодня (days: 0)
   - Завтра (days: 1)
   - Через неделю (days: 7)
   - Через месяц (days: 30)

2. **Относительное время:**
   - "Сегодня", "Завтра", "Через 3 дн.", "Через 2 нед."

3. **Мини-календарь:**
   - Месяц (ФЕВР.) + число (10) в красивом блоке

4. **Hover-эффекты:**
   - Иконка карандаша при наведении на карточку дедлайна

### Итерация по фидбеку
- Убрана дублирующая кнопка "Изменить" из заголовка (клик по карточке выполняет ту же функцию)

---

## CODE CHANGES

### TaskDetailModal.jsx — Deadline Section (~150 строк)

**Заголовок:**
```jsx
<div className="flex items-center gap-2 mb-3">
  <div className={`p-1.5 rounded-lg ${isOverdue() ? 'bg-red-100' : 'bg-emerald-50'}`}>
    <svg className={`w-4 h-4 ${isOverdue() ? 'text-red-600' : 'text-emerald-600'}`}>...</svg>
  </div>
  <span className="text-sm font-medium text-neutral-900">Дедлайн</span>
</div>
```

**Переключатель типов:**
```jsx
<button className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border-2 transition-all ${
  deadlineType === type.id
    ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
}`}>
```

**Карточка дедлайна:**
```jsx
<button className={`group flex items-center gap-3 w-full p-3 rounded-xl border-2 transition-all ${
  isOverdue() 
    ? 'bg-red-50 border-red-200' 
    : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
}`}>
  {/* Мини-календарь */}
  <div className="shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center bg-white shadow-sm">
    <span className="text-[10px] font-bold uppercase text-emerald-600">ФЕВР.</span>
    <span className="text-lg font-bold text-neutral-900">10</span>
  </div>
  {/* Дата + относительное время */}
  <div className="flex-1 text-left">
    <div className="text-sm font-medium">10 февр. 2026 г.</div>
    <div className="text-xs text-neutral-500">Через 6 дн.</div>
  </div>
</button>
```

---

## TESTING

- Визуальная проверка в браузере
- Проверка всех трёх типов дедлайна (дата, дата+время, период)
- Проверка быстрых действий
- Проверка состояния "просрочено" (красный стиль)
- Проверка пустого состояния
- Проверка hover-эффектов

---

## LESSONS LEARNED

1. **Изучай существующий код** — анализ `TaskCard.jsx`, `TaskChecklist.jsx`, `AccountSwitcher.jsx` дал понимание стиля проекта

2. **UX важнее UI** — быстрые действия для установки дедлайна улучшили юзабилити больше, чем визуальные изменения

3. **Убирай дубли** — кнопка "Изменить" в заголовке дублировала клик по карточке

4. **Tailwind inline styles** — длинные className строки, но быстрая итерация

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-task-deadline-ui-redesign.md`
- **Component:** `calculator/src/components/tasks/TaskDetailModal.jsx`
- **Style reference:** `calculator/src/components/tasks/TaskChecklist.jsx`

---

## RELATED PATTERNS

- **Emerald accent color:** emerald-500, emerald-600 для primary actions
- **Градиенты:** `bg-gradient-to-r from-emerald-50 to-teal-50`
- **Focus ring:** `focus:ring-2 focus:ring-emerald-500/20`
- **Rounded cards:** `rounded-xl border-2`
- **Hover hints:** `opacity-0 group-hover:opacity-100`
