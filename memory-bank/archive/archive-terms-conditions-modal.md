# TASK ARCHIVE: Terms & Conditions Modal Redesign

## METADATA
- **Task ID:** terms-conditions-modal
- **Date:** 2026-02-06
- **Complexity:** Level 2 (UI Enhancement)
- **Status:** ARCHIVED ✅

---

## SUMMARY
Полный редизайн отображения Terms & Conditions в офертах. Инлайн-блок с прокруткой заменён на кнопку, открывающую большую модалку. Текст оферты рендерится как официальный стилизованный документ с секциями, буллетами и подпунктами. Модалка принятия оферты обновлена с тем же стилем. Добавлена печать документа.

---

## REQUIREMENTS
1. Убрать инлайн-блок Terms & Conditions с прокруткой внутри оферты
2. Вместо него — кнопка, открывающая отдельную большую модалку
3. Текст оферты должен выглядеть как официальный документ
4. Модалка принятия оферты тоже должна использовать стильное оформление
5. Кнопка Print для печати текста оферты (как на спецификациях)

---

## IMPLEMENTATION

### Новые компоненты

#### LegalTextModal (`calculator/src/components/offers/LegalTextModal.jsx`)
- **parseLegalText(text)** — парсер структуры текста оферты:
  - Распознаёт заголовок, разделители (━), секции (1. ЗАГОЛОВОК), буллеты (•), подпункты (5.1.), нумерованные списки, лейблы, футер
  - Возвращает `{ title, sections[], footer[] }`
- **LegalDocument** — React-компонент, рендерящий parsed текст:
  - Заголовок: по центру, tracking-widest, линия снизу
  - Секции: чёрные бейджи с номером + uppercase название
  - Буллеты: зелёные точки (emerald-500)
  - Нумерованные списки: серые кружки
  - Подпункты: моноширинный номер, выравнивание
  - Футер: мелкий текст, © выделен
- **LegalTextModal** — модалка просмотра:
  - max-w-4xl, max-h-[90vh]
  - Документ обёрнут в белую карточку на сером фоне
  - Кнопка Print в хедере
  - Крестик закрытия, Escape, клик по backdrop

### Обновлённые компоненты

#### AcceptOfferModal
- Заменён LegalTextViewer на LegalDocument
- Добавлен прогресс-степпер (Read terms → Confirm agreement → Accept)
- Scroll indicator с negative margin overlay
- Авто-детект коротких текстов (не требующих скролла)
- Кнопка Print в хедере
- Крестик закрытия

#### OfferDetailPage
- Блок T&C: иконка + заголовок + описание + кнопка "View Terms"
- LegalTextModal открывается по клику

#### OfferModal
- `<details>` заменён на кнопку-строку (как инвойсы)
- LegalTextModal открывается по клику

#### printUtils.js
- Вынесена общая функция `printElement(elementId, title)`
- Добавлена `printLegalText()` для печати оферты
- `printSpecification()` упрощена через `printElement()`

---

## FILES

### Created
| File | Description |
|------|-------------|
| `calculator/src/components/offers/LegalTextModal.jsx` | Модалка + LegalDocument + parseLegalText |

### Modified
| File | Changes |
|------|---------|
| `calculator/src/components/offers/AcceptOfferModal.jsx` | Полный редизайн: LegalDocument, stepper, Print |
| `calculator/src/pages/offers/OfferDetailPage.jsx` | Кнопка "View Terms" + LegalTextModal |
| `calculator/src/components/project/OfferModal.jsx` | Кнопка вместо `<details>` + LegalTextModal |
| `calculator/src/components/offers/index.js` | Экспорты LegalTextModal, LegalDocument |
| `calculator/src/lib/printUtils.js` | Generic printElement(), printLegalText() |

---

## CHALLENGES & SOLUTIONS

### CSS Layout для скролла в модалке
- **Проблема:** Вложенные flex-контейнеры с overflow-hidden коллапсировали контент
- **Решение:** Простой `flex-1 overflow-y-auto` на прямом потомке flex-колонки модалки

### Scroll indicator
- **Проблема:** sticky/absolute позиционирование создавало отступы или плавающий текст
- **Решение:** Обычный div с `marginTop: '-3.5rem'` после скролл-контейнера

---

## LESSONS LEARNED
1. Не усложнять CSS layout — `flex-1 overflow-y-auto` достаточно для скролла
2. При рефакторе UI — составлять чеклист всех элементов (крестик закрытия)
3. Начинать с простого подхода, усложнять только при необходимости
4. Generic утилиты (printElement) полезнее специализированных

---

## REFERENCES
- **Reflection:** `memory-bank/reflection/reflection-terms-conditions-modal.md`
- **Related:** `calculator/src/lib/offerUtils.js` — getLegalText() генерирует текст оферты
- **Related:** `calculator/src/components/offers/LegalTextViewer.jsx` — старый компонент (сохранён для AcceptOfferModal scroll detection, но больше не используется напрямую)
