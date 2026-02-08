# TASK ARCHIVE: Concept Document — автозадача + сортировка задач по весам

## METADATA
- **Task ID:** concept-doc-task-and-sort-order
- **Date:** 2026-02-08
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Две связанные фичи:
1. Автоматическое создание задачи "Concept Document" при наличии этого пункта в спецификации — шаблон в `task_spec_item_templates` с описанием и чеклистом из 10 пунктов, добавление в `get_item_task_name()`.
2. Система весов (`sort_order`) для управления порядком создания задач из спецификации. Дефолтные веса по расположению items в калькуляторе. Обновлённый триггер сортирует spec items через `LEFT JOIN ... ORDER BY sort_order`.

---

## REQUIREMENTS

1. Автозадача "Concept Document" создаётся при первой оплате, если concept_doc выбран в спецификации
2. Шаблон с описанием и чеклистом (10 пунктов: референсы → мудборд → палитра → ... → финальный PDF)
3. `get_item_task_name('concept_doc')` возвращает "Concept Document" (не сырой id)
4. Система весов (`sort_order`) для всех spec item templates
5. Дефолтные веса: concept_doc=10, symbols=100-120, backgrounds=200-230, popups=300-390, UI=400-530, promo=600-640
6. Триггер создаёт задачи в порядке sort_order
7. UI в админке: поле "Порядок создания (вес)", список отсортирован по весам

---

## IMPLEMENTATION

### Миграция 047: шаблон задачи concept_doc

- Обновлена функция `get_item_task_name()` — добавлен `"concept_doc": "Concept Document"`
- Создан шаблон в `task_spec_item_templates` с:
  - `task_title`: "Concept Document"
  - `task_description`: описание задачи
  - `animation_task_title_template`: NULL (не применимо)
  - `checklist_items`: 10 пунктов от "Сбор референсов" до "Финальный документ (PDF/Figma)"
- Защита: INSERT WHERE NOT EXISTS + UPDATE для случая автосоздания через ensure_spec_item_template_exists

### Миграция 048: sort_order + обновлённый триггер

- Новое поле `sort_order INT DEFAULT 999` в `task_spec_item_templates`
- Дефолтные веса с шагом 10 (удобно вставлять новые items)
- Индекс `idx_task_spec_item_templates_sort_order`
- Обновлена `ensure_spec_item_template_exists()` — новые шаблоны получают sort_order=999
- Обновлена `auto_create_tasks_on_first_payment()`:
  - Вместо `jsonb_each(v_spec_state->'items')` теперь `LEFT JOIN task_spec_item_templates ORDER BY sort_order`
  - Гарантированный детерминированный порядок создания задач

### Frontend

- `useTaskSpecItemTemplates.js` — сортировка `.order('sort_order', { ascending: true })`
- `TaskAutoCreationSettingsPage.jsx`:
  - Список шаблонов отсортирован по `sort_order`
  - Поле "Порядок создания (вес)" в форме редактирования
  - Отображение "Порядок: N" в свёрнутом виде
  - sort_order передаётся при создании/обновлении шаблона

---

## FILES

### Создано (2 файла)
| Файл | Назначение |
|------|-----------|
| `calculator/supabase/migrations/047_concept_document_task_template.sql` | Шаблон задачи + get_item_task_name |
| `calculator/supabase/migrations/048_task_sort_order.sql` | sort_order + веса + триггер |

### Изменено (2 файла)
| Файл | Изменения |
|------|-----------|
| `calculator/src/hooks/useTaskSpecItemTemplates.js` | Сортировка по sort_order |
| `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` | UI sort_order + сортировка списка |

---

## LESSONS LEARNED

1. Указывать точный путь в UI — "Task Settings → Шаблоны задач", а не "в админке"
2. Шаг 10 между весами — удобно для вставки новых items без перенумерации
3. `task_auto_templates` (общие задачи, всегда) vs `task_spec_item_templates` (из spec items, при qty>0) — разные таблицы
4. Существующие задачи не пересортируются — sort_order влияет только на новые проекты

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-concept-doc-task-and-sort-order.md`
- **Связанный архив:** `memory-bank/archive/archive-concept-document.md` (Concept Document в калькуляторе)
