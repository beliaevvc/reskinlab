# Активный контекст

## Текущий фокус
*Нет активной задачи. Готов к работе.*

## Последние изменения
- Задача "Скетч (рисование) в чате задачи" архивирована (`archive-sketch-editor-chat.md`)

## Следующие шаги
- Начать новую задачу через `/van`

---

## Статус проекта
История задач и архивы — в `memory-bank/tasks.md` (нижние секции) и `memory-bank/archive/`.

### Pending Migrations
```bash
# В Supabase SQL Editor:
019_workspace_statuses.sql
020_dynamic_statuses.sql
021_board_sort_order.sql
022_user_favorite_projects.sql
025_comment_forwarding.sql
029_tasks_nullable_board.sql
030_voice_messages.sql
031_image_comments.sql
032_image_annotations.sql
033_image_comment_replies.sql
034_image_comments_optimization.sql
035_message_read_receipts.sql
036_task_covers.sql
037_rename_url_widget.sql
038_time_in_column.sql
039_task_status_history.sql
047_task_summaries.sql
048_task_summaries_per_tone.sql
049_task_summaries_track_task_updated.sql
055_ai_persistent_usage.sql
075_thread_metadata_without_content_bump.sql
```

### Production / прочее
- [ ] Применить миграции 018+ к production по мере необходимости

---

## Tech Stack (ReTracker / Lab)
- React 18 + Vite, Tailwind CSS, Supabase, React Query

## Important Files
- `memory-bank/systemPatterns.md` — паттерны и критические фиксы
- `retracker/src/components/comments/ImageAnnotationEditor.jsx` — аннотации на фото
- `retracker/src/components/comments/SketchEditor.jsx` — рисование в чате
- `retracker/src/components/comments/AttachmentMenu.jsx` — меню вложений
- `retracker/src/components/comments/CommentInput.jsx` — ввод комментария + addBlobFile

## Последний архив
- `memory-bank/archive/archive-sketch-editor-chat.md`
