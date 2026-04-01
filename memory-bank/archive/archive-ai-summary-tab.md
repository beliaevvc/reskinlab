# TASK ARCHIVE: AI Summary Tab in Task Detail Modal

## Metadata
- **Task ID:** ai-summary-tab
- **Complexity:** Level 3-4
- **Date Completed:** 21 Февраля 2026
- **Duration:** ~6 часов
- **Commits:** `ee4be69`, `551ec72`
- **Related Tasks:** -

---

## Summary

Реализация вкладки "AI Summary" в модалке задачи ReTracker. GPT-powered анализ всех аспектов задачи (название, описание, чеклисты, виджеты, комментарии включая голосовые транскрипции) с генерацией структурированного саммари.

**Ключевые возможности:**
- Три тона: деловой, нейтральный, простой
- Per-tone caching с отдельным кешем для каждого тона
- Stale check для экономии токенов (отслеживание `last_comment_id` + `task.updated_at`)
- Markdown parsing (`**bold**` → `<strong>`)
- Брендовые цвета (emerald green) включая text selection

---

## Requirements

### Functional
1. Анализ всех данных задачи (название, описание, чеклисты, виджеты, комментарии)
2. Генерация структурированного саммари с секциями:
   - Task brief + scope + progress
   - Discussion summary + topics + decisions + concerns
   - Bottom line: open questions, next steps, commitments, waiting_for, blockers
3. Три тона генерации (formal/neutral/informal)
4. Кеширование per-tone
5. Определение устаревания: новые комментарии ИЛИ изменения задачи (title/description/checklist/widgets)
6. Локализация ru/en

### Non-Functional
1. Минимизация расхода токенов
2. Отзывчивый UI при генерации
3. Брендовые цвета

---

## Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TaskDetailModal                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            TaskAISummary.jsx                         │    │
│  │  ┌─────────────────────┐  ┌───────────────────────┐ │    │
│  │  │ useTaskSummary      │  │ useSummaryStaleCheck  │ │    │
│  │  └─────────────────────┘  └───────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Edge Function                     │
│                    summarize-task/index.ts                   │
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │ Service Role Client │  │ OpenAI GPT-5.2 Strict Schema  │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Database                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │            task_summaries table                       │    │
│  │  - UNIQUE(task_id, tone)                             │    │
│  │  - last_comment_id                                    │    │
│  │  - task_updated_at                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `TaskAISummary.jsx` | Основной UI компонент: header с метаданными, переключатель тона, контент саммари |
| `useTaskSummary.js` | React Query hooks: fetch, generate, stale check |
| `summarize-task/index.ts` | Edge Function: GPT integration, RLS bypass, caching |

### Database Schema

```sql
CREATE TABLE task_summaries (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  summary_data JSONB NOT NULL,
  tone TEXT CHECK (tone IN ('formal', 'neutral', 'informal')),
  last_comment_id UUID,
  task_updated_at TIMESTAMPTZ,  -- Added in iteration 2
  model_used TEXT,
  tokens_used INTEGER,
  comments_analyzed INTEGER,
  UNIQUE(task_id, tone)
);
```

### Stale Detection Strategy

```javascript
// Two signals for staleness:
const taskChanged = referenceDate && task.updated_at 
  ? new Date(task.updated_at) > new Date(referenceDate)
  : false

const commentsChanged = latestComment?.id !== lastCommentId

const isStale = commentsChanged || taskChanged
```

---

## Testing

### Manual Testing Performed
- [x] Генерация саммари с разными тонами
- [x] Переключение тона без автогенерации
- [x] Кнопка "Обновить" активируется при новых комментариях
- [x] Кнопка "Обновить" активируется при изменении названия/описания
- [x] Копирование саммари в буфер обмена
- [x] Markdown bold parsing
- [x] Text selection с emerald цветом

### Edge Cases Verified
- Задачи без комментариев (показывается empty state)
- Старые саммари без `task_updated_at` (fallback на `summary.updated_at`)
- Constraint violation при неправильном tone value

---

## Challenges & Solutions

| Challenge | Root Cause | Solution |
|-----------|------------|----------|
| JWT 401 errors | Supabase gateway validation | `--no-verify-jwt` deploy flag |
| Constraint violation | UI sent 'casual', DB expected 'informal' | Fixed tone mapping |
| Circular JSON error | Event object passed to handler | Arrow function wrappers |
| RLS permission denied | fetch with user token | Service role client |
| staleCheck not activating | updateTask called with wrong args | Fixed argument structure |

---

## Lessons Learned

### Technical
1. **Supabase Edge Functions + Service Role** — используй `--no-verify-jwt` если функция авторизована через service key
2. **OpenAI Strict JSON Schema** — все поля в required, union types для optional
3. **React event handlers** — не передавай handler напрямую если ожидаются специфические аргументы
4. **Mutation argument structure** — проверяй что mutation вызывается с правильной структурой

### Process
1. **Hypothesis-driven debugging** — формулируй гипотезу → инструментация → проверка → удаление логов
2. **Итеративный UI дизайн** — быстрые итерации эффективнее долгих обсуждений

### UX
1. **Переключатель не должен автоматически тратить ресурсы** — кнопка действия отдельно
2. **Брендовые цвета** — consistency важна, даже для text selection

---

## Files Created

| File | Purpose |
|------|---------|
| `src/components/tasks/TaskAISummary.jsx` | Основной компонент вкладки |
| `src/hooks/useTaskSummary.js` | React Query hooks |
| `supabase/functions/summarize-task/index.ts` | Edge Function |
| `supabase/migrations/047_task_summaries.sql` | Таблица + RLS + grants |
| `supabase/migrations/048_task_summaries_per_tone.sql` | Per-tone constraint |
| `supabase/migrations/049_task_summaries_track_task_updated.sql` | task_updated_at column |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/tasks/TaskDetailModal.jsx` | Вкладка AI Summary + исправлен updateTask |
| `src/locales/en/tasks.json` | Локализация EN |
| `src/locales/ru/tasks.json` | Локализация RU |
| `src/utils/activityLogger.js` | Activity type для summary |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Files Created | 6 |
| Files Modified | 5 |
| Lines Added | ~1500 |
| Debug Iterations | ~15 |
| UI Iterations | ~8 |
| Migrations | 3 |
| Hypotheses Generated | 6 |

---

## References

- **Reflection:** `memory-bank/reflection/reflection-ai-summary-tab.md`
- **Progress:** `memory-bank/progress.md`

---

## Future Enhancements

1. **Streaming responses** — для длинных генераций показывать прогресс
2. **Token estimation** — показывать примерную стоимость перед генерацией
3. **Model selection** — выбор модели (быстрее/дешевле vs качественнее)
4. **Retry logic** — автоматический retry при rate limits
5. **Batch summarization** — генерация саммари для нескольких задач
6. **Export** — экспорт саммари в PDF/Notion
