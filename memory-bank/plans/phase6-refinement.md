# Phase 6 Refinement Plan

**Status:** Planning Complete  
**Created:** 2026-02-02  
**Based on:** User Survey (20 questions)

---

## Summary of Requirements

### Users Management
- **Structure:** Unified Users page with optional Company link
- **Columns:** Email, Name, Role, Company, Created, Last Login, Projects, Revenue
- **Details:** Profile, Company, Projects list, Finance stats, Activity history
- **Features:** Manual user creation, Bulk actions (role change, delete)

### Pricing / Calculator
- **Presets:** Single "Default" configuration
- **Editable:** Base prices, Complexity, Urgency, Volume discounts, Style multipliers, Min/Max
- **Grouping:** By categories (Characters, Animations, Backgrounds, etc.)
- **History:** Log all price changes
- **Integration:** Calculator reads from DB (requires migration)

### Promo Codes
- **Auto-generate:** Prefix format (RESKIN-XXXXXXXX)
- **Length:** 8 characters
- **Stats:** Detailed usage tracking (who, when, amount)

### Audit Logs
- **Actions:** Login/Logout, Role changes, Projects, Specs, Offers, Payments, Price changes
- **Detail level:** Full diff (before/after)
- **Retention:** Forever

### UX / Navigation
- **Sidebar:** Dashboard, Users, Projects, Offers, Invoices, Calculator Settings, Promo Codes, Audit
- **Dashboard widgets:** Users count, Active projects, Revenue, Pending approvals, Recent activity, Charts
- **Filters:** Role, Status, Date, Search, AM filter

---

## Implementation Tasks

### 1. Fix Current Issues

#### 1.1 Users Page - Show All Users
**Problem:** Only shows current admin  
**Root cause:** Likely RLS policy issue  
**Fix:**
- [ ] Check `profiles` RLS for admin SELECT
- [ ] Verify `useUsers` query doesn't filter by current user
- [ ] Test with multiple users

#### 1.2 Merge Users + Clients
**Current:** Two separate pages  
**Target:** One "Users" page with Company info  
**Tasks:**
- [ ] Remove `/admin/clients` route
- [ ] Update sidebar - single "Users" entry
- [ ] Modify `UsersTable` to include Company column
- [ ] Update `useUsers` to join with `clients` table
- [ ] Update user details modal to show company info

---

### 2. Users Page Redesign

#### 2.1 Table Columns
```
| Avatar | Name | Email | Role | Company | Projects | Revenue | Created | Last Login | Actions |
```

**Tasks:**
- [ ] Add Company column (from linked client)
- [ ] Add Projects count column
- [ ] Add Revenue column (sum of paid invoices)
- [ ] Add Last Login column (needs tracking)
- [ ] Fix column order (Email before Role)

#### 2.2 User Details Modal
Sections:
1. **Profile:** Avatar, Name, Email, Role badge
2. **Company:** Company name, contact info (if linked)
3. **Projects:** List with status badges, links
4. **Finance:** Total revenue, paid/pending invoices
5. **Activity:** Recent actions from audit_logs

**Tasks:**
- [ ] Redesign `UserDetailModal` with tabs/sections
- [ ] Add finance stats aggregation
- [ ] Add activity feed from audit_logs
- [ ] Add "View all projects" link

#### 2.3 Create User Modal
**Fields:**
- Email (required)
- Full Name
- Role (dropdown)
- Company (optional, select or create new)
- Send welcome email (checkbox)

**Tasks:**
- [ ] Create `CreateUserModal` component
- [ ] Add Supabase admin user creation (needs service role)
- [ ] Add company selection/creation
- [ ] Add welcome email option

#### 2.4 Bulk Actions
- [ ] Add checkbox column to table
- [ ] Add "Select All" header checkbox
- [ ] Add bulk action dropdown (Change Role, Delete)
- [ ] Add confirmation modal for bulk delete

---

### 3. Calculator Pricing Redesign

#### 3.1 Data Migration
**Current:** Prices hardcoded in calculator store  
**Target:** Prices from `price_configs` table

**Tasks:**
- [ ] Audit current calculator pricing structure
- [ ] Create SQL migration to populate `price_configs` with defaults
- [ ] Update calculator store to fetch from DB
- [ ] Add fallback to defaults if DB unavailable

#### 3.2 Pricing Page Structure
```
Categories:
├── Characters
│   ├── Base price
│   ├── Complexity coefficients (simple, medium, complex)
│   └── Style multipliers
├── Animations
│   ├── Base price per second
│   ├── Complexity coefficients
│   └── ...
├── Backgrounds
│   └── ...
├── Global Settings
│   ├── Urgency coefficients
│   ├── Volume discounts
│   └── Min/Max values
```

**Tasks:**
- [ ] Create category grouping in `price_configs` table
- [ ] Redesign `PricingPage` with collapsible categories
- [ ] Add inline editing for values
- [ ] Add validation (min/max, numeric)

#### 3.3 Price History
- [ ] Create `price_config_history` table
- [ ] Log changes with: user_id, config_id, old_value, new_value, changed_at
- [ ] Add "History" button per config
- [ ] Add history modal with timeline

---

### 4. Promo Codes Enhancement

#### 4.1 Auto-Generation
**Format:** `RESKIN-XXXXXXXX` (8 chars after prefix)  
**Characters:** A-Z, 0-9 (no confusing chars like O/0, I/1)

**Tasks:**
- [ ] Add "Generate" button next to code input
- [ ] Implement `generatePromoCode()` function
- [ ] Allow custom prefix input

#### 4.2 Usage Statistics
**Track:**
- Who used (user_id, user email)
- When (timestamp)
- Order amount before discount
- Discount amount applied

**Tasks:**
- [ ] Create `promo_code_usage` table
- [ ] Log usage when promo applied
- [ ] Add "Usage" tab in promo detail modal
- [ ] Show usage list with user, date, amount

---

### 5. Audit Logs Enhancement

#### 5.1 Populate Logs
**Currently:** audit_logs table likely empty  
**Need to add logging for:**
- Login/Logout events
- Role changes
- Project create/update
- Specification finalization
- Offer acceptance
- Payment confirmation
- Price config changes

**Tasks:**
- [ ] Create `logAuditEvent()` utility function
- [ ] Add auth event logging (in AuthContext)
- [ ] Add role change logging (in useUpdateUserRole)
- [ ] Add project event logging (in useProjects)
- [ ] Add spec event logging
- [ ] Add offer event logging
- [ ] Add payment event logging
- [ ] Add price change logging

#### 5.2 Full Diff Storage
**Structure:**
```json
{
  "action": "update_role",
  "entity_type": "profile",
  "entity_id": "uuid",
  "changes": {
    "role": { "from": "client", "to": "am" }
  },
  "user_id": "uuid",
  "ip_address": "x.x.x.x",
  "created_at": "timestamp"
}
```

**Tasks:**
- [ ] Update audit_logs schema for diff storage
- [ ] Implement diff calculation in logAuditEvent
- [ ] Update AuditLogsPage to display diffs

---

### 6. Admin Dashboard

#### 6.1 Widgets
1. **Users Count:** Total, by role (pie chart)
2. **Active Projects:** Count, trend
3. **Revenue:** This month, total, chart
4. **Pending Approvals:** Count, quick links
5. **Recent Activity:** Last 10 audit events
6. **Charts:** Revenue over time, projects over time

**Tasks:**
- [ ] Create dashboard stats hooks
- [ ] Create stat card components
- [ ] Create charts (use recharts or similar)
- [ ] Create recent activity feed component
- [ ] Replace placeholder DashboardPage

---

### 7. Sidebar Update

**Admin Sidebar:**
```
Dashboard
Users
Projects
Offers
Invoices
──────────
Calculator Settings
Promo Codes
Audit Logs
```

**Tasks:**
- [ ] Update AppSidebar admin menu items
- [ ] Remove "Clients" menu item
- [ ] Add divider before settings section
- [ ] Ensure proper active states

---

### 8. Filters Enhancement

#### All pages need:
- [ ] Role filter (Users)
- [ ] Status filter (Projects, Offers, Invoices)
- [ ] Date range filter
- [ ] Search (name, email)
- [ ] AM filter (Projects)

---

## Database Changes Required

```sql
-- 1. Last login tracking
ALTER TABLE profiles ADD COLUMN last_login_at TIMESTAMPTZ;

-- 2. Price config history
CREATE TABLE price_config_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_id UUID REFERENCES price_configs(id),
  old_value NUMERIC,
  new_value NUMERIC,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Promo code usage
CREATE TABLE promo_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID REFERENCES promo_codes(id),
  user_id UUID REFERENCES profiles(id),
  order_amount NUMERIC,
  discount_amount NUMERIC,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Migrate calculator prices to price_configs
-- (detailed migration script needed after auditing calculator)
```

---

## Implementation Order

| Priority | Task | Effort | Dependencies |
|----------|------|--------|--------------|
| 1 | Fix Users RLS / show all | Low | - |
| 2 | Merge Users + Clients | Medium | #1 |
| 3 | Calculator price migration | High | - |
| 4 | Pricing page redesign | Medium | #3 |
| 5 | Add audit logging | Medium | - |
| 6 | Audit page enhancements | Low | #5 |
| 7 | Promo code auto-gen | Low | - |
| 8 | Promo usage tracking | Medium | - |
| 9 | Admin dashboard | High | - |
| 10 | Sidebar update | Low | #2 |
| 11 | Filters enhancement | Medium | - |

---

## Estimated Total Effort

- **High priority fixes:** 2-3 hours
- **Users redesign:** 3-4 hours
- **Pricing integration:** 4-5 hours
- **Audit logging:** 2-3 hours
- **Dashboard:** 3-4 hours
- **Other enhancements:** 2-3 hours

**Total:** ~16-22 hours
