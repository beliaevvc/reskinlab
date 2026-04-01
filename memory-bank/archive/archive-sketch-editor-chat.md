# Архив задачи: Скетч (рисование) в чате задачи

## Метаданные
- Дата начала: 2026-04-01
- Дата завершения: 2026-04-01
- Уровень сложности: 3

## Резюме
Новая функция "Скетч" в чате задачи ReTracker. Кнопка в меню вложений (AttachmentMenu) открывает полноэкранный canvas-редактор для рисования с нуля. Рисунок экспортируется как PNG и отправляется в чат через существующий механизм `addBlobFile`. Ноль миграций БД — полное переиспользование инфраструктуры вложений.

## Требования
- Кнопка "Скетч" в AttachmentMenu (рядом с "Файл" и "Опрос")
- Полноэкранный overlay с canvas для рисования
- Инструменты: кисть, ластик, палитра 6 цветов, 3 толщины, undo/redo, очистка
- Выбор фона холста: белый, прозрачный (шахматный паттерн), светло-серый, тёмный
- Адаптивный размер canvas под viewport
- Экспорт в PNG → отправка как вложение в чат
- Консистентность UI с существующим ImageAnnotationEditor

## Реализация

### Подход
Форк `ImageAnnotationEditor.jsx` с упрощением (убраны фигуры, текст, стрелки, overlay canvas) и добавлением нового функционала (выбор фона холста).

### Creative-решение
Вариант C: Left toolbar + секция фона — сохраняет паттерн ImageAnnotationEditor, расширяя тулбар секцией выбора фона. Layout: top bar (undo/redo/clear + title + cancel/save) + left toolbar (tools → colors → thickness → backgrounds) + canvas area.

### Ключевые решения
- **Фон холста** — CSS-фон контейнера (не рисуется на canvas), при экспорте compositing через отдельный exportCanvas
- **Прозрачный фон** — шахматный CSS-паттерн (linear-gradient 45deg), экспорт PNG с alpha
- **Паттерн blob → addBlobFile → chat** — универсальный, без изменений backend
- **Один canvas** (вместо двух у ImageAnnotationEditor) — overlay не нужен без фигур

### Данные в потоке
`SketchEditor.handleSave()` → `canvas.toBlob('image/png')` → `CommentInput.addBlobFile(blob, filename)` → `uploadSingleFile` (Supabase Storage `task-files`) → `comments.attachments[]`

## Изменённые файлы
- **Новый:** `retracker/src/components/comments/SketchEditor.jsx` (~280 строк) — полноэкранный canvas-редактор
- `retracker/src/components/comments/AttachmentMenu.jsx` — добавлен пункт "Скетч" + SketchIcon + prop `onSelectSketch`
- `retracker/src/components/comments/CommentInput.jsx` — state `showSketchEditor`, import SketchEditor, рендер + интеграция с addBlobFile

## Тестирование
- Линтер: ошибок нет
- Миграции БД: не требуются (подтверждено — используется существующая инфраструктура task_files)

## Уроки
- Паттерн "blob → addBlobFile → chat" универсален для любых клиентски-генерируемых медиа
- Canvas-компоненты эффективно создавать как форки с упрощением, а не через shared абстракции (при 2 компонентах)
- Фон холста лучше делать через CSS контейнера + compositing при экспорте, чем рисовать на canvas

## Потенциальные улучшения
- Добавить фигуры/текст (код есть в ImageAnnotationEditor)
- Вынести общий canvas-движок в `useCanvasDrawing` хук при появлении третьего canvas-компонента
- Выбор размера/пропорций холста
- Загрузка фонового изображения (merge sketch + annotation)

## Ссылки
- Рефлексия: `memory-bank/reflection/reflection-sketch-editor.md`
- Creative: `memory-bank/creative/creative-sketch-editor.md`
- Паттерн в systemPatterns: секция "ReTracker: SketchEditor — рисование в чате"
