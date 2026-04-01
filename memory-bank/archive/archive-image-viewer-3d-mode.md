# Архив задачи: ReTracker — ImageViewer, 3D-режим и прозрачные PNG

## Метаданные
- **Дата начала:** 2026-03-31  
- **Дата завершения:** 2026-03-31  
- **Уровень сложности:** 2  

## Резюме
В полноэкранном просмотрщике изображений с комментариями (`ImageViewer`) добавлен опциональный режим псевдо-3D: перспектива, наклон плоскости по `mousemove` (rotateX/Y, translateZ, scale), сглаживание rAF+lerp. Режим откликается при добавлении комментария и при `prefers-reduced-motion`. Доработаны иконка управления (куб), корректное отображение PNG с прозрачностью и согласованное превью в `FilePreviewOverlay` (`CommentAttachments`).

## Требования
- «Красивый» просмотр по желанию пользователя (изначально — параллакс; финал — псевдо-3D).  
- Не ломать привязку пинов и аннотаций к изображению.  
- Прозрачные PNG без лишнего «белого фона» в просмотрщике и в превью.

## Реализация
- **`ImageViewer.jsx`:** стадия с `perspective`, внутренняя обёртка `preserve-3d`, `parallaxInnerRef` — запись `transform` в DOM; хук `usePrefersReducedMotion`; кнопка с иконкой 3D-куба; тени через `drop-shadow`, `bg-transparent`, без светлых blend-оверлеев на весь кадр.  
- **`CommentAttachments.jsx`:** для изображения в `FilePreviewOverlay` — `bg-transparent`, `drop-shadow` вместо `shadow-2xl`.  
- **`systemPatterns.md`:** зафиксированы паттерны для ImageViewer и альфа-PNG.  
- Память: **REFLECT** — `reflection-image-viewer-3d-mode.md`.

## Изменённые файлы
- `retracker/src/components/comments/ImageViewer.jsx`  
- `retracker/src/components/comments/CommentAttachments.jsx`  
- `memory-bank/systemPatterns.md`  
- `memory-bank/projectbrief.md`  
- `memory-bank/reflection/reflection-image-viewer-3d-mode.md`  
- `memory-bank/progress.md`  
- `memory-bank/activeContext.md`  
- `memory-bank/tasks.md`  

## Тестирование
- `npm run build` (retracker) — успешно  
- `npm run test:permissions:sql` — пройдены  
- Ручная проверка UI (3D, комментарии, PNG с альфой) — рекомендована автором проекта  

## Уроки (из рефлексии)
- Для PNG с альфой не использовать светлые полноэкранные градиенты с `mix-blend` поверх картинки.  
- Для силуэта непрозрачных пикселей предпочтительнее `drop-shadow`, чем `box-shadow`.  
- Для визуальных фич заранее уточнять «tilt / 3D» vs плоский параллакс.  
- Возможный следующий шаг: вынести логику наклона в хук при повторном использовании.  

## Ссылки
- **Рефлексия:** `memory-bank/reflection/reflection-image-viewer-3d-mode.md`  
- **Creative:** не применялось  
