# Reflection: Voice Messages with Transcription

## Task Summary
**Date:** 2026-02-17/18
**Complexity:** Level 3-4
**Commit:** `7cb2688`

Реализация записи голосовых сообщений в чате задач с транскрипцией через OpenAI Whisper API, word-level timestamps, цитирование фрагментов.

---

## What Went Well

### 1. Переиспользование существующей инфраструктуры
- `wavesurfer.js` уже был интегрирован для обычных аудио — расширили для голосовых
- `AudioWavePlayer` адаптирован под два режима (filename / voiceMessage)
- `useFiles` хук использован для загрузки в Storage

### 2. Чёткое разделение фаз
- MVP (запись/воспроизведение) → работало сразу
- Транскрипция (Edge Function) → отдельный этап
- Word timestamps → отдельный компонент `TranscriptDisplay`
- Цитирование → `VoiceQuoteSelector` + `VoiceQuote`

### 3. Решение сложных permission-проблем
- RLS policies для `voice_transcripts` — несколько итераций
- Edge Function с `service_role_key` — обход RLS через direct REST API
- Передача metadata из frontend вместо query внутри Edge Function

### 4. UX-улучшения по ходу
- Фокус на input при reply/quote/voice-quote
- Клик на цитату → скролл к оригиналу
- Унифицированный визуал голосовых и обычных аудио

---

## Challenges Encountered

### 1. MediaRecorder timeslice bug
**Проблема:** `mediaRecorder.start(1000)` создавал фрагментированный WebM, который глючил при воспроизведении (куски циклились).  
**Решение:** Убрали timeslice — записываем единым блобом.

### 2. Edge Function RLS permissions
**Проблема:** Даже с `service_role_key`, Supabase JS client внутри Edge Function не мог читать `task_files`.  
**Решение:** Рефакторинг — frontend передаёт `path`, `bucket`, `filename` напрямую, Edge Function использует REST API для Storage и DB.

### 3. 406 Not Acceptable на пустых результатах
**Проблема:** `.single()` бросал 406 когда transcript не существовал.  
**Решение:** Заменили на `.maybeSingle()`.

### 4. DOM nesting warnings
**Проблема:** `TaskCard` с `<h4>` рендерился внутри `<p>` в `formatText.jsx`.  
**Решение:** Заменили `<p>` на `<div>` для блоков текста.

### 5. Цитирование не работало
**Проблема:** `onVoiceQuote` не передавался по цепочке `TaskDetailModal → CommentThread → CommentItem`.  
**Решение:** Добавили проброс пропа + состояние `voiceQuotingData` в TaskDetailModal.

---

## Lessons Learned

### 1. Supabase Edge Functions + RLS = сложно
- `supabase-js` client внутри Edge Function не всегда корректно работает с RLS
- Direct REST API calls с `service_role_key` — надёжнее для server-side операций
- Передавать данные из frontend, если это не компрометирует безопасность

### 2. MediaRecorder API тонкости
- `timeslice` полезен для стриминга, но ломает single-file playback
- WebM container требует proper структуры для seek
- Для простых случаев — записывать без timeslice

### 3. React Query `.single()` vs `.maybeSingle()`
- `.single()` — строго 1 результат, иначе ошибка
- `.maybeSingle()` — 0 или 1, возвращает null если нет данных

### 4. Prop drilling в глубоких компонентах
- Голосовые сообщения потребовали проброса callback через 4 уровня
- Context API был бы оверкилом для одного callback
- Документировать цепочку передачи props

---

## Technical Debt

1. **VoiceQuoteSelector regions plugin** — используем ручной `timeupdate` listener вместо native `region.play()` который глючил
2. **Отсутствие удаления голосовых** — нет UI для удаления записи до отправки
3. **Нет прогресса загрузки** — большие аудио загружаются без индикатора
4. **ThreadView не поддерживает voice quote** — только основной чат

---

## Process Improvements

1. **Миграции через SQL Editor** — пользователь предпочитает вручную применять, не через CLI
2. **Инкрементальное тестирование** — после каждого этапа проверять в UI
3. **Screenshots для debug** — пользователь присылает скриншоты ошибок — очень помогает

---

## Files Created

### Components
- `VoiceRecorder.jsx` — UI записи с таймером и cancel
- `VoiceMessagePlayer.jsx` — плеер с transcript display
- `TranscriptDisplay.jsx` — кликабельные слова с подсветкой
- `VoiceQuoteSelector.jsx` — модалка выбора фрагмента
- `VoiceQuote.jsx` — отображение цитаты в комментарии

### Hooks
- `useVoiceRecorder.js` — MediaRecorder API wrapper
- `useVoiceTranscripts.js` — CRUD для транскриптов

### Backend
- `supabase/functions/transcribe-audio/index.ts` — Edge Function для Whisper API

### Database
- `030_voice_messages.sql` — `voice_transcripts` table, `file_category` column, `voice_quote` column

---

## Files Modified

- `CommentInput.jsx` — voice recorder integration, voice quote preview
- `CommentAttachments.jsx` — VoiceMessageAttachment component
- `CommentItem.jsx` — VoiceQuote display, voice quote callback
- `CommentThread.jsx` — onVoiceQuote prop pass-through
- `TaskDetailModal.jsx` — voiceQuotingData state, handlers, focus on reply
- `AudioWavePlayer.jsx` — voiceMessage prop for header
- `useComments.js` — voice_quote in addComment
- `formatText.jsx` — DOM nesting fix

---

## Metrics

| Metric | Value |
|--------|-------|
| Files Created | 8 |
| Files Modified | 10 |
| Debug Iterations | ~15 |
| User Interactions | 30+ |
| Commits | 1 (+ follow-up fixes) |

---

## Next Steps

1. Добавить поддержку voice quote в ThreadView
2. UI для удаления голосового до отправки
3. Прогресс-бар загрузки больших аудио
4. Кнопка "Ответить на фрагмент" доступна без расшифровки (опционально)
