# Дизайн-решение: SketchEditor UI/UX

## Дата: 2026-04-01
## Тип: UI/UX

## Требования
- Полноэкранный overlay для рисования с нуля (без фонового изображения)
- Минимальный набор: кисть, ластик, палитра цветов, толщина, undo/redo
- Выбор фона холста (белый / прозрачный / серый / тёмный)
- Адаптивный размер canvas
- Экспорт в PNG blob → addBlobFile → чат
- Консистентность с ImageAnnotationEditor

## Рассмотренные варианты

### Вариант A: Один-в-один с ImageAnnotationEditor
- **Описание:** Та же структура (top bar + left toolbar + canvas)
- **Плюсы:** Максимальная консистентность, минимум нового кода
- **Минусы:** Левый тулбар короткий (2 инструмента), нет места для фона

### Вариант B: Top bar расширенный, без left toolbar
- **Описание:** Всё в одной горизонтальной полосе сверху
- **Плюсы:** Компактно, больше места для canvas
- **Минусы:** Перегруженный top bar, ломает паттерн

### Вариант C: Left toolbar + секция фона (выбран)
- **Описание:** Left toolbar с секциями (инструменты → цвета → толщина → фон)
- **Плюсы:** Консистентность + место для нового элемента, логическое разделение
- **Минусы:** Чуть больше элементов

## Выбранное решение
**Вариант C — Left toolbar + секция фона**

### Обоснование
Сохраняет привычный паттерн из ImageAnnotationEditor (пользователь уже знает этот UI), при этом естественно расширяется секцией выбора фона в нижней части тулбара.

### Layout

**Top bar:**
- Слева: Undo, Redo, | Очистить
- Центр: "Скетч"
- Справа: Отмена, **Отправить** (emerald)

**Left toolbar** (w-14, секции сверху вниз):
1. Кисть, Ластик
2. ---
3. 6 цветов (кружки)
4. ---
5. 3 толщины (thin/medium/thick)
6. ---
7. 4 варианта фона (white/transparent/light/dark)

**Canvas area:**
- `bg-neutral-100` фон страницы
- Canvas по центру с `shadow-lg` + `rounded-lg`
- Адаптивный: ~85% width, ~75% height viewport

### Палитра фона
```javascript
const BACKGROUNDS = [
  { id: 'white', value: '#ffffff', label: 'Белый' },
  { id: 'transparent', value: 'transparent', label: 'Прозрачный' },
  { id: 'light', value: '#f5f5f5', label: 'Светло-серый' },
  { id: 'dark', value: '#1c1c1c', label: 'Тёмный' },
]
```

### Шахматный паттерн (прозрачный фон)
Инлайн стиль на контейнере canvas:
```css
background-image: 
  linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
  linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
  linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
  linear-gradient(-45deg, transparent 75%, #e5e5e5 75%);
background-size: 16px 16px;
background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
```

### Экспорт логика
1. Создать exportCanvas (размер = mainCanvas)
2. Если фон НЕ transparent → fillRect с выбранным цветом
3. drawImage(mainCanvas) поверх
4. toBlob('image/png')
5. filename = `sketch-{timestamp}.png`

### Различия с ImageAnnotationEditor
| Аспект | ImageAnnotationEditor | SketchEditor |
|--------|----------------------|-------------|
| Фон | Фото (img) | Выбираемый цвет/прозрачный |
| Инструменты | pen, arrow, rect, circle, text, eraser | pen, eraser |
| Overlay canvas | Для превью фигур | Не нужен |
| Text input | Есть | Нет |
| Экспорт | img + annotations | Фон + canvas |
| Размер | Подгоняется под фото | Адаптив под viewport |
