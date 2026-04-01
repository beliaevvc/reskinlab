# TASK ARCHIVE: Card Covers & Cover Crop Feature

## METADATA

| Field | Value |
|-------|-------|
| Task ID | card-covers-crop |
| Date Started | 2026-02-19 |
| Date Completed | 2026-02-19 |
| Complexity Level | 2-3 |
| Status | ARCHIVED ✅ |

---

## SUMMARY

Реализация обложек для карточек задач в канбане ReTracker с возможностью:
- Автоматической установки обложки при загрузке изображений (настройка на уровне доски)
- Ручной установки/удаления обложки через контекстное меню на изображениях
- Настройки области кадрирования (crop) через модалку с drag-перемещением и zoom

---

## REQUIREMENTS

### Функциональные требования
1. **Автоматические обложки**: При включении настройки доски — последнее загруженное изображение становится обложкой карточки
2. **Контекстное меню**: На изображениях в чате появляется меню с опциями:
   - "Установить обложкой" (пинит обложку, защищает от автозамены)
   - "Удалить обложку"
   - "Скачать изображение"
3. **Pinned covers**: Вручную установленные обложки не заменяются автоматически
4. **Кадрирование**: Возможность настроить область отображения обложки (позиция X/Y, zoom)
5. **Отображение**: Обложка на всю ширину карточки в канбане, фиксированная высота 120px

### Нефункциональные требования
- Минималистичный UI (без лишних индикаторов)
- Интуитивный drag-to-move в модалке кадрирования
- Быстрая загрузка signed URL для обложек

---

## IMPLEMENTATION

### Database Schema

```sql
-- tasks table additions
ALTER TABLE public.tasks ADD COLUMN cover_file_id UUID REFERENCES public.task_files(id);
ALTER TABLE public.tasks ADD COLUMN cover_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN cover_position JSONB DEFAULT '{"x": 50, "y": 50, "zoom": 1}';

-- boards table additions
ALTER TABLE public.boards ADD COLUMN auto_cover_enabled BOOLEAN DEFAULT false;

-- RPC Functions
CREATE FUNCTION set_task_cover(p_task_id, p_file_id, p_pinned);
CREATE FUNCTION remove_task_cover(p_task_id);
CREATE FUNCTION auto_set_task_cover(p_task_id, p_file_id);
CREATE FUNCTION toggle_board_auto_cover(p_board_id, p_enabled);
CREATE FUNCTION update_cover_position(p_task_id, p_x, p_y, p_zoom);
```

### Files Created

| File | Purpose |
|------|---------|
| `src/components/tasks/CoverCropModal.jsx` | Модалка настройки области кадрирования с drag и zoom |
| `src/components/comments/ImageContextMenu.jsx` | Контекстное меню на изображениях (set/remove cover, download) |
| `src/components/board/settings/DisplaySettings.jsx` | Настройки отображения доски (auto-cover toggle) |
| `src/hooks/useTaskCover.js` | React Query хуки для операций с обложками |

### Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/036_task_covers.sql` | Добавлены cover_position, update_cover_position() |
| `src/components/tasks/TaskCard.jsx` | Отображение обложки с crop, кнопка настройки |
| `src/hooks/useTasks.js` | Загрузка cover_url для задач |
| `src/components/board/settings/BoardSettingsModal.jsx` | Новый таб "Отображение" |
| `src/components/comments/CommentAttachments.jsx` | Интеграция ImageContextMenu |
| `src/components/comments/CommentItem.jsx` | Проброс taskCoverFileId |
| `src/components/comments/CommentThread.jsx` | Проброс taskCoverFileId |
| `src/components/tasks/TaskDetailModal.jsx` | Проброс taskCoverFileId в CommentThread |
| `src/hooks/useComments.js` | Авто-вызов auto_set_task_cover при загрузке изображения |

### Component Architecture

```
TaskCard
├── Cover Image (with object-position & scale from cover_position)
└── Cover Crop Button (appears on hover)
    └── CoverCropModal
        ├── Draggable preview area
        ├── Zoom slider (100%-200%)
        └── Save/Reset/Cancel buttons

TaskDetailModal
└── CommentThread
    └── CommentItem
        └── CommentAttachments
            └── ImageAttachment
                └── ImageContextMenu
                    ├── Set as cover
                    ├── Remove cover
                    └── Download image
```

### Key Implementation Details

1. **Cover URL Loading**: В `useTasks` добавлена загрузка signed URLs для обложек задач через batch-запрос к `task_files` + `storage.createSignedUrl()`

2. **Auto-cover Logic**: В `useComments.useAddComment` после успешной загрузки изображения вызывается RPC `auto_set_task_cover`, который проверяет:
   - Включён ли auto_cover на доске
   - Не запинена ли текущая обложка

3. **Crop Modal Drag**: Использует mouse events (mousedown/mousemove/mouseup) с расчётом delta в процентах от размера контейнера. Направление инвертировано (drag right → image moves left).

4. **Object Position**: CSS `object-position: ${x}% ${y}%` и `transform: scale(${zoom})` с `transform-origin` в той же точке.

---

## UI ITERATIONS

| # | Change | Reason |
|---|--------|--------|
| 1 | Blur background → object-cover | Пользователь не хотел blur |
| 2 | Pin badge на карточке → убран | Перегружал UI |
| 3 | Неполная ширина → full width | Белое пространство слева |
| 4 | Crosshair индикатор → убран | Выглядел лишним |
| 5 | Comment badge → bottom-right | Конфликт с context menu |

---

## TESTING

### Manual Testing Checklist
- [x] Автоматическая установка обложки при загрузке изображения
- [x] Контекстное меню появляется при hover на изображение
- [x] "Установить обложкой" работает корректно
- [x] "Удалить обложку" работает корректно
- [x] "Скачать изображение" работает корректно
- [x] Pinned обложка не заменяется автоматически
- [x] Модалка кадрирования открывается по клику на кнопку
- [x] Drag перемещает область просмотра
- [x] Zoom slider работает
- [x] Сохранение позиции применяется к карточке
- [x] Обложка отображается на всю ширину карточки

---

## LESSONS LEARNED

### Technical
1. **JSONB для составных настроек** — удобно хранить x, y, zoom в одном поле, легко расширять
2. **RPC для бизнес-логики** — auto_set_task_cover инкапсулирует проверки на стороне БД
3. **Prop drilling vs Context** — для 5 уровней компонентов prop drilling приемлем, Context был бы избыточен

### Process
1. **UI-итерации неизбежны** — закладывать гибкость в CSS сразу
2. **Миграции: additive approach** — не редактировать применённые миграции, добавлять новые
3. **Уточняющие вопросы ДО реализации** — blur vs crop, значки, позиции — всё это лучше выяснять заранее

### UX
1. **Минимализм > индикаторы** — crosshair кружок и pin badge оказались лишними
2. **Модалки > inline редактирование** — для сложных задач (crop) модалка даёт больше пространства

---

## REFERENCES

| Document | Path |
|----------|------|
| Reflection | `memory-bank/reflection/reflection-card-covers-crop.md` |
| Migration | `retracker/supabase/migrations/036_task_covers.sql` |
| Main Hook | `retracker/src/hooks/useTaskCover.js` |
| Crop Modal | `retracker/src/components/tasks/CoverCropModal.jsx` |

---

## SQL TO APPLY (if migration not yet applied)

```sql
-- Add cover_position field
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS cover_position JSONB DEFAULT '{"x": 50, "y": 50, "zoom": 1}';

COMMENT ON COLUMN public.tasks.cover_position IS 
  'Crop settings for cover: x/y position (0-100%) and zoom level (1-3)';

-- Function to update cover position
CREATE OR REPLACE FUNCTION public.update_cover_position(
  p_task_id UUID,
  p_x NUMERIC,
  p_y NUMERIC,
  p_zoom NUMERIC DEFAULT 1
)
RETURNS public.tasks AS $$
DECLARE
  v_task public.tasks;
BEGIN
  UPDATE public.tasks
  SET 
    cover_position = jsonb_build_object('x', p_x, 'y', p_y, 'zoom', p_zoom),
    updated_at = now()
  WHERE id = p_task_id
  RETURNING * INTO v_task;
  
  RETURN v_task;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## STATUS

✅ Implementation Complete
✅ Reflection Complete  
✅ Archive Complete
