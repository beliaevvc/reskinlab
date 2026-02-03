# Phase 5: Materials & Delivery + Admin Role Switch

## Overview

**Цель:** Реализовать файловый менеджмент, доставку материалов и функцию переключения роли для админа.

**Базовая инфраструктура:** Storage buckets уже настроены в `003_storage.sql`:
- `references` — загрузки клиента (референсы)
- `deliverables` — загрузки студии (результаты работы)
- `sources` — исходники
- `proofs` — подтверждения оплаты
- `invoices` — PDF счетов

---

## Sub-phase 5A: Hooks (File & Delivery)

### 5A.1 useFiles.js

```javascript
// Функции:
- useProjectFiles(projectId, bucket) // список файлов проекта
- useUploadFile()                    // загрузка файла
- useDeleteFile()                    // удаление файла
- useFileUrl(path)                   // получение signed URL
- getFileTypeIcon(mimeType)          // утилита для иконок
- formatFileSize(bytes)              // форматирование размера
```

**Buckets mapping:**
- `references` → клиент загружает
- `deliverables` → staff загружает
- `sources` → staff загружает

### 5A.2 useDelivery.js

```javascript
// Функции:
- useDeliveryChecklist(projectId)    // чеклист для сдачи
- useCreateDelivery()                // создать delivery
- useApproveDelivery()               // клиент принимает
- useRequestRevision()               // клиент просит доработку
- useFinalizeProject()               // закрытие проекта
```

---

## Sub-phase 5B: File Components

### 5B.1 FileUploader.jsx
- Drag & drop зона
- Progress bar
- Multiple files
- Bucket selection (references/deliverables)
- Max size validation

### 5B.2 FileCard.jsx
- Thumbnail preview (images)
- File icon (other types)
- Name, size, date
- Download button
- Delete button (if owner)

### 5B.3 FileBrowser.jsx
- Grid/list view toggle
- Filter by type
- Sort by date/name
- Folder navigation (by task/stage)
- Bulk operations

### 5B.4 FilePreviewModal.jsx
- Image preview (zoom, pan)
- PDF preview (embed)
- Video preview
- Download link
- File metadata

---

## Sub-phase 5C: Delivery Components

### 5C.1 DeliveryChecklist.jsx
- [ ] All tasks completed
- [ ] All approvals received  
- [ ] All deliverables uploaded
- [ ] Sources uploaded (if applicable)
- Progress percentage

### 5C.2 DeliveryCard.jsx
- Delivery info (date, files)
- Status (pending/approved/revision)
- Client response area
- Revision history

### 5C.3 FinalApprovalModal.jsx
- Summary of project
- List of deliverables
- Terms acceptance
- Sign-off action
- Feedback textarea

### 5C.4 ProjectClosurePanel.jsx
- Final status display
- Download all files button
- Rating/feedback (optional)
- Archive action

---

## Sub-phase 5D: Admin Role Switch Feature

### 5D.1 Concept: "View As"

Админ может:
1. **Временно** переключить UI на вид клиента или AM
2. Видеть интерфейс как другой пользователь
3. **НЕ выполнять действия** от имени пользователя (только просмотр)

### 5D.2 Implementation

**AuthContext additions:**
```javascript
const [viewAsRole, setViewAsRole] = useState(null); // null = normal, 'client' | 'am'
const effectiveRole = viewAsRole || profile?.role;
const isViewingAs = viewAsRole !== null;

// Computed values use effectiveRole instead of profile.role
isClient: effectiveRole === 'client',
isAM: effectiveRole === 'am',
isAdmin: effectiveRole === 'admin',
```

**UI Components:**

1. **RoleSwitcher.jsx** (header component)
   - Dropdown: "View as: Admin | Client | AM"
   - Visible only for admins
   - Yellow banner when "viewing as"

2. **ViewAsBanner.jsx**
   - Sticky banner at top
   - "You are viewing as [Client]. Click to return to Admin view"
   - Exit button

### 5D.3 Security Considerations

- `viewAsRole` только меняет UI, НЕ меняет auth.uid()
- RLS продолжает работать от реального пользователя
- API calls идут от реального админа
- Логирование "view as" действий в audit log

---

## Sub-phase 5E: Integration

### 5E.1 ProjectWorkspacePage Updates
- Add "Files" tab
- Add FileBrowser component
- Add FileUploader for references

### 5E.2 New Page: ProjectDeliveryPage
- Route: `/projects/:id/delivery`
- Delivery checklist
- File delivery section
- Final approval

### 5E.3 App.jsx Routes
```jsx
<Route path="/projects/:id/files" element={<ProjectFilesPage />} />
<Route path="/projects/:id/delivery" element={<ProjectDeliveryPage />} />
<Route path="/admin/projects/:id/files" element={<ProjectFilesPage />} />
<Route path="/admin/projects/:id/delivery" element={<ProjectDeliveryPage />} />
```

### 5E.4 Header Update
- Add RoleSwitcher for admin
- Add ViewAsBanner when active

---

## Database: New Tables (if needed)

```sql
-- File metadata (optional, for versioning)
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  version INT DEFAULT 1,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(bucket, path)
);

-- Deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES workflow_stages(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision_requested')),
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  client_feedback TEXT,
  revision_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files to Create

| File | Description |
|------|-------------|
| `hooks/useFiles.js` | File management hooks |
| `hooks/useDelivery.js` | Delivery management hooks |
| `components/files/FileUploader.jsx` | Upload component |
| `components/files/FileCard.jsx` | File display card |
| `components/files/FileBrowser.jsx` | File browser grid |
| `components/files/FilePreviewModal.jsx` | Preview modal |
| `components/files/index.js` | Exports |
| `components/delivery/DeliveryChecklist.jsx` | Checklist component |
| `components/delivery/DeliveryCard.jsx` | Delivery item |
| `components/delivery/FinalApprovalModal.jsx` | Final approval |
| `components/delivery/index.js` | Exports |
| `components/admin/RoleSwitcher.jsx` | Role switch dropdown |
| `components/admin/ViewAsBanner.jsx` | "Viewing as" banner |
| `pages/projects/ProjectFilesPage.jsx` | Files page |
| `pages/projects/ProjectDeliveryPage.jsx` | Delivery page |

---

## Implementation Order

1. **5A: Hooks** (useFiles, useDelivery)
2. **5B: File Components** (FileUploader, FileCard, FileBrowser, FilePreviewModal)
3. **5C: Delivery Components** (DeliveryChecklist, DeliveryCard, FinalApprovalModal)
4. **5D: Admin Role Switch** (RoleSwitcher, ViewAsBanner, AuthContext update)
5. **5E: Integration** (Pages, Routes, Header update)

---

## Estimated Effort

| Sub-phase | Components | Complexity |
|-----------|------------|------------|
| 5A | 2 hooks | Medium |
| 5B | 4 components | Medium |
| 5C | 4 components | Medium |
| 5D | 2 components + context | Low |
| 5E | 2 pages + routes | Low |

**Total:** ~15-20 файлов

---

## Dependencies

- Supabase Storage API (already configured)
- React Query (already installed)
- Existing auth context
- Existing project/task hooks

---

## Testing Checklist

- [ ] Client can upload references
- [ ] Staff can upload deliverables
- [ ] Files display correctly in browser
- [ ] Image preview works
- [ ] Download works
- [ ] Delete works (with permissions)
- [ ] Delivery checklist tracks progress
- [ ] Final approval flow works
- [ ] Admin can switch view to client
- [ ] Admin can switch view to AM
- [ ] Banner shows when viewing as other role
- [ ] No security leaks (RLS still enforces real role)
