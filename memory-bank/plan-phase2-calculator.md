# Phase 2: Calculator Integration — Детальный план

## Обзор Phase 2

**Цель:** Интегрировать калькулятор с Supabase — сохранение черновиков, создание проектов и спецификаций, управление спецификациями.

**Результат:** Клиент может создать проект, сохранить спецификацию как черновик, просматривать и редактировать спецификации, финализировать спецификацию.

---

## Структура Phase 2

```
Phase 2: Calculator Integration
├── 2.1 State Management
│   ├── 2.1.1 Zustand store for calculator
│   ├── 2.1.2 React Query hooks for data
│   └── 2.1.3 Auto-save mechanism
│
├── 2.2 Projects Flow
│   ├── 2.2.1 Create Project modal/page
│   ├── 2.2.2 Projects list page
│   └── 2.2.3 Project detail page
│
├── 2.3 Specifications Flow
│   ├── 2.3.1 Save specification (draft)
│   ├── 2.3.2 Specification list view
│   ├── 2.3.3 Specification detail view
│   ├── 2.3.4 Edit specification (draft only)
│   ├── 2.3.5 Finalize specification
│   └── 2.3.6 Version indicator
│
└── 2.4 Calculator Enhancement
    ├── 2.4.1 "Save Draft" button
    ├── 2.4.2 "Finalize" button  
    ├── 2.4.3 Project selector
    └── 2.4.4 Draft status indicator
```

---

## 2.1 State Management

### 2.1.1 Zustand Store

**Файл:** `src/stores/calculatorStore.js`

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCalculatorStore = create(
  persist(
    (set, get) => ({
      // Current project/spec context
      currentProjectId: null,
      currentSpecificationId: null,
      isDraft: true,
      lastSaved: null,
      
      // Calculator state (from useCalculator)
      globalStyle: null,
      usageRights: null,
      paymentModel: null,
      revisionRounds: 0,
      appliedPromo: null,
      items: {},
      
      // Actions
      setProject: (projectId) => set({ currentProjectId: projectId }),
      setSpecification: (specId, isDraft) => set({ 
        currentSpecificationId: specId, 
        isDraft 
      }),
      
      // Load state from specification
      loadFromSpecification: (spec) => set({
        currentSpecificationId: spec.id,
        isDraft: spec.status === 'draft',
        ...spec.state_json,
      }),
      
      // Get state for saving
      getStateForSave: () => {
        const state = get();
        return {
          globalStyle: state.globalStyle,
          usageRights: state.usageRights,
          paymentModel: state.paymentModel,
          revisionRounds: state.revisionRounds,
          appliedPromo: state.appliedPromo,
          items: state.items,
        };
      },
      
      // Reset
      reset: () => set({
        currentProjectId: null,
        currentSpecificationId: null,
        isDraft: true,
        lastSaved: null,
      }),
    }),
    {
      name: 'calculator-state',
      partialize: (state) => ({
        currentProjectId: state.currentProjectId,
        currentSpecificationId: state.currentSpecificationId,
      }),
    }
  )
);
```

### 2.1.2 React Query Hooks

**Файл:** `src/hooks/useProjects.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Fetch client's projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, specifications(count)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

// Fetch single project with specifications
export function useProject(projectId) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          specifications (
            id, version, status, created_at, updated_at,
            totals_json
          )
        `)
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('projects')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    },
  });
}
```

**Файл:** `src/hooks/useSpecifications.js`

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Fetch specifications for a project
export function useSpecifications(projectId) {
  return useQuery({
    queryKey: ['specifications', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

// Fetch single specification
export function useSpecification(specId) {
  return useQuery({
    queryKey: ['specifications', 'detail', specId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select('*, project:projects(*)')
        .eq('id', specId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!specId,
  });
}

// Save/update specification (draft)
export function useSaveSpecification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ specId, projectId, stateJson, totalsJson }) => {
      if (specId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('specifications')
          .update({
            state_json: stateJson,
            totals_json: totalsJson,
          })
          .eq('id', specId)
          .eq('status', 'draft') // Only drafts can be updated
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new specification
        const versionNumber = await getNextVersionNumber(projectId);
        
        const { data, error } = await supabase
          .from('specifications')
          .insert({
            project_id: projectId,
            version: `v${versionNumber}.0`,
            version_number: versionNumber,
            status: 'draft',
            state_json: stateJson,
            totals_json: totalsJson,
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['specifications', data.project_id]);
      queryClient.invalidateQueries(['specifications', 'detail', data.id]);
    },
  });
}

// Finalize specification
export function useFinalizeSpecification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (specId) => {
      const { data, error } = await supabase
        .from('specifications')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .eq('id', specId)
        .eq('status', 'draft')
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['specifications', data.project_id]);
      queryClient.invalidateQueries(['specifications', 'detail', data.id]);
    },
  });
}

// Helper: get next version number
async function getNextVersionNumber(projectId) {
  const { data } = await supabase
    .from('specifications')
    .select('version_number')
    .eq('project_id', projectId)
    .eq('is_addon', false)
    .order('version_number', { ascending: false })
    .limit(1);
  
  return (data?.[0]?.version_number || 0) + 1;
}
```

### 2.1.3 Auto-save Mechanism

**Файл:** `src/hooks/useAutoSave.js`

```javascript
import { useEffect, useRef, useCallback } from 'react';
import { debounce } from '../lib/utils';
import { useSaveSpecification } from './useSpecifications';

export function useAutoSave({ 
  specId, 
  projectId, 
  stateJson, 
  totalsJson,
  enabled = true,
  debounceMs = 3000 
}) {
  const saveSpec = useSaveSpecification();
  const lastSavedRef = useRef(null);
  
  const save = useCallback(
    debounce(async () => {
      if (!enabled || !projectId) return;
      
      const stateStr = JSON.stringify(stateJson);
      if (stateStr === lastSavedRef.current) return;
      
      try {
        await saveSpec.mutateAsync({ specId, projectId, stateJson, totalsJson });
        lastSavedRef.current = stateStr;
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, debounceMs),
    [specId, projectId, stateJson, totalsJson, enabled, saveSpec]
  );
  
  useEffect(() => {
    if (enabled && projectId) {
      save();
    }
  }, [stateJson, save, enabled, projectId]);
  
  return {
    isSaving: saveSpec.isPending,
    lastSaved: lastSavedRef.current ? new Date() : null,
    saveNow: save.flush,
  };
}
```

---

## 2.2 Projects Flow

### 2.2.1 Create Project Modal

**Файл:** `src/components/projects/CreateProjectModal.jsx`

Модальное окно для создания нового проекта с полями:
- Project name (required)
- Description (optional)

После создания — redirect на калькулятор с project context.

### 2.2.2 Projects List Page

**Файл:** `src/pages/projects/ProjectsPage.jsx`

Компоненты:
- Список проектов с карточками
- Статус (draft, active, completed)
- Количество спецификаций
- Последняя активность
- Кнопка "New Project"

### 2.2.3 Project Detail Page

**Файл:** `src/pages/projects/ProjectDetailPage.jsx`

Секции:
- Project header (name, status, dates)
- Specifications list
- Actions (Add specification, View offers)

---

## 2.3 Specifications Flow

### 2.3.1 Save Specification

**Логика:**
1. При нажатии "Save Draft" или auto-save
2. Если нет проекта — показать "Create Project" modal
3. Если есть проект но нет spec — создать новую
4. Если есть spec в статусе draft — обновить
5. Сохранить полный state калькулятора в `state_json`
6. Сохранить calculated totals в `totals_json`

### 2.3.2 Specification List View

**Файл:** `src/pages/specifications/SpecificationsPage.jsx`

Таблица/карточки:
- Version (v1.0, v2.0, etc.)
- Status badge (Draft/Finalized)
- Total amount
- Created/Updated date
- Actions (View, Edit, Finalize)

### 2.3.3 Specification Detail View

**Файл:** `src/pages/specifications/SpecificationDetailPage.jsx`

Read-only view спецификации:
- Project info
- Version info
- Status
- Line items (как в SpecificationView)
- Totals breakdown
- Actions (Edit if draft, Finalize, Create Offer if finalized)

### 2.3.4 Edit Specification

При клике "Edit" на draft specification:
1. Load state_json в калькулятор
2. Открыть Calculator page
3. Enable auto-save для этой спецификации

### 2.3.5 Finalize Specification

**Компонент:** `FinalizeConfirmModal`

1. Показать confirmation dialog
2. Warning: "После финализации спецификацию нельзя редактировать"
3. При подтверждении:
   - Update status → 'finalized'
   - Set finalized_at, finalized_by
4. После финализации — redirect на detail page

### 2.3.6 Version Indicator

В header калькулятора показывать:
- Project name
- Specification version
- Status (Draft/Finalized)
- Last saved time

---

## 2.4 Calculator Enhancement

### 2.4.1 Save Draft Button

Добавить в Sidebar и MobileFooter:
- Button "Save Draft" (если есть проект)
- Button "Create Project" (если нет проекта)
- Saving indicator

### 2.4.2 Finalize Button

В SpecificationView или Sidebar:
- Button "Finalize & Continue"
- Opens FinalizeConfirmModal

### 2.4.3 Project Selector

В Header калькулятора:
- Dropdown для выбора проекта
- "New Project" option
- Current project indicator

### 2.4.4 Draft Status Indicator

Badge или chip показывающий:
- "New" (не сохранено)
- "Draft - Saved at HH:MM"
- "Finalized"

---

## Файловая структура Phase 2

```
src/
├── stores/
│   └── calculatorStore.js          ← NEW
│
├── hooks/
│   ├── useCalculator.js            (existing)
│   ├── useProjects.js              ← NEW
│   ├── useSpecifications.js        ← NEW
│   └── useAutoSave.js              ← NEW
│
├── components/
│   ├── projects/
│   │   ├── CreateProjectModal.jsx  ← NEW
│   │   ├── ProjectCard.jsx         ← NEW
│   │   └── index.js                ← NEW
│   │
│   ├── specifications/
│   │   ├── SpecificationCard.jsx   ← NEW
│   │   ├── FinalizeConfirmModal.jsx ← NEW
│   │   ├── SpecificationLineItems.jsx ← NEW
│   │   └── index.js                ← NEW
│   │
│   └── calculator/
│       ├── ProjectSelector.jsx     ← NEW
│       ├── DraftStatusBadge.jsx    ← NEW
│       └── SaveDraftButton.jsx     ← NEW
│
├── pages/
│   ├── projects/
│   │   ├── ProjectsPage.jsx        ← NEW
│   │   └── ProjectDetailPage.jsx   ← NEW
│   │
│   └── specifications/
│       ├── SpecificationDetailPage.jsx ← NEW
│       └── index.js                ← NEW
│
└── App.jsx                         (update routes)
```

---

## Implementation Order

### Step 1: Core Hooks (Foundation)
1. `useProjects.js` — CRUD для проектов
2. `useSpecifications.js` — CRUD для спецификаций
3. `calculatorStore.js` — Zustand store

### Step 2: Projects Flow
1. `CreateProjectModal.jsx`
2. `ProjectsPage.jsx`
3. `ProjectDetailPage.jsx`
4. Update router

### Step 3: Specifications Integration
1. `SpecificationCard.jsx`
2. `SpecificationDetailPage.jsx`
3. `FinalizeConfirmModal.jsx`

### Step 4: Calculator Enhancement
1. `ProjectSelector.jsx`
2. `SaveDraftButton.jsx`
3. `DraftStatusBadge.jsx`
4. `useAutoSave.js`
5. Update CalculatorPage

### Step 5: Testing & Polish
1. Test full flow
2. Error handling
3. Loading states
4. Edge cases

---

## Acceptance Criteria

### Projects
- [ ] Клиент может создать новый проект
- [ ] Клиент видит список своих проектов
- [ ] Клиент может открыть детали проекта

### Specifications
- [ ] Из калькулятора можно создать спецификацию
- [ ] Спецификация сохраняется в Supabase
- [ ] Черновик можно редактировать
- [ ] Можно финализировать спецификацию
- [ ] Финализированную нельзя редактировать

### Calculator
- [ ] Показывает текущий проект/версию
- [ ] Auto-save работает для draft
- [ ] Можно переключаться между проектами
- [ ] Можно загрузить существующую спецификацию

### Data Integrity
- [ ] state_json содержит полное состояние калькулятора
- [ ] totals_json содержит рассчитанные суммы
- [ ] Версии нумеруются корректно (v1.0, v2.0...)

---

## Notes

### Оставляем на Phase 3:
- Создание оферты из финализированной спецификации
- PDF export
- Acceptance flow

### Не меняем:
- Логику расчёта калькулятора
- UI компоненты калькулятора (кроме добавления кнопок)
- Data files (categories.js, etc.)

---

**Document Version:** 1.0  
**Created:** 2026-02-01
