# Phase 3: Offers & Invoices — Детальный план

## Обзор Phase 3

**Цель:** Реализовать создание оферт из финализированных спецификаций, процесс акцепта с юридическим логированием, генерацию инвойсов по milestone'ам.

**Результат:** Клиент может получить оферту, принять её (с логированием), увидеть инвойсы для оплаты.

---

## Структура Phase 3

```
Phase 3: Offers & Invoices
├── 3.1 Offers
│   ├── 3.1.1 Generate offer (from finalized spec)
│   ├── 3.1.2 Offer hooks & API
│   ├── 3.1.3 Offer detail page
│   ├── 3.1.4 Acceptance flow (with legal logging)
│   └── 3.1.5 Offers list (client view)
│
├── 3.2 Invoices
│   ├── 3.2.1 Invoice generation (milestone-based)
│   ├── 3.2.2 Invoice hooks & API
│   ├── 3.2.3 Invoice detail page
│   ├── 3.2.4 Payment info display (wallet)
│   └── 3.2.5 Invoices list
│
└── 3.3 Integration
    ├── 3.3.1 Update SpecificationDetailPage (Create Offer button)
    ├── 3.3.2 Update Sidebar navigation
    └── 3.3.3 Add routes
```

---

## 3.1 Offers

### 3.1.1 Generate Offer Function

**Логика создания оферты:**

```javascript
async function generateOffer(specificationId) {
  // 1. Verify specification is finalized
  const spec = await getSpecification(specificationId);
  if (spec.status !== 'finalized') throw new Error('Spec not finalized');
  
  // 2. Check no offer exists
  const existingOffer = await getOfferBySpecId(specificationId);
  if (existingOffer) throw new Error('Offer already exists');
  
  // 3. Generate offer number: OFF-YYYY-NNNNN
  const offerNumber = await generateOfferNumber();
  
  // 4. Create offer with legal text
  const offer = await supabase.from('offers').insert({
    specification_id: specificationId,
    number: offerNumber,
    status: 'pending',
    legal_text: getLegalText(), // Template or custom
    terms_version: '1.0',
    valid_until: addDays(new Date(), 30),
  });
  
  // 5. Generate invoices by milestones
  await generateInvoicesForOffer(offer.id, spec);
  
  return offer;
}
```

### 3.1.2 Offer Hooks

**Файл:** `src/hooks/useOffers.js`

```javascript
// Hooks:
- useOffers() - список оферт клиента
- useOffer(offerId) - детали оферты с invoices
- useOfferBySpec(specId) - оферта по спецификации
- useCreateOffer() - создание оферты
- useAcceptOffer() - акцепт оферты
```

### 3.1.3 Offer Detail Page

**Файл:** `src/pages/offers/OfferDetailPage.jsx`

**Секции:**
- Header (номер, статус, дата истечения)
- Specification summary (что включено, итого)
- Legal text (scrollable, must read)
- Invoices list (по milestone'ам)
- Accept button (если pending)

### 3.1.4 Acceptance Flow

**Компонент:** `AcceptOfferModal.jsx`

**Flow:**
1. User scrolls legal text to bottom
2. Checkbox: "I have read and agree..."
3. Click Accept button
4. Log to `offer_acceptance_logs`:
   - user_id
   - action: 'accepted'
   - ip_address (from API)
   - user_agent
   - offer_snapshot (full copy)
5. Update offer status → 'accepted'
6. Update project status → 'pending_payment'
7. Show success & redirect to invoices

### 3.1.5 Offers List Page

**Файл:** `src/pages/offers/OffersPage.jsx`

**Columns:**
- Offer number
- Project name
- Amount
- Status badge
- Valid until
- Actions (View)

---

## 3.2 Invoices

### 3.2.1 Invoice Generation (Milestones)

**Milestone structure (from SpecificationView):**

```javascript
const MILESTONES = [
  { id: 'upfront', name: 'Upfront Payment', percent: 50 },
  { id: 'midpoint', name: 'Midpoint Payment', percent: 25 },
  { id: 'final', name: 'Final Payment', percent: 25 },
];

// Or stage-based for full upfront:
const MILESTONES_STAGES = [
  { id: 'briefing', name: 'Briefing & Moodboard', percent: 25 },
  { id: 'production', name: 'Production', percent: 50 },
  { id: 'delivery', name: 'Final Delivery', percent: 25 },
];
```

**Generation logic:**

```javascript
async function generateInvoicesForOffer(offerId, spec) {
  const total = spec.totals_json.grandTotal;
  const milestones = getMilestones(spec.state_json.paymentModel);
  
  for (let i = 0; i < milestones.length; i++) {
    const milestone = milestones[i];
    const amount = total * (milestone.percent / 100);
    
    await supabase.from('invoices').insert({
      offer_id: offerId,
      project_id: spec.project_id,
      number: await generateInvoiceNumber(),
      milestone_id: milestone.id,
      milestone_name: milestone.name,
      milestone_order: i + 1,
      amount_usd: amount,
      currency: 'USDT',
      status: i === 0 ? 'pending' : 'pending', // First is active
      due_date: addDays(new Date(), 7 * (i + 1)),
    });
  }
}
```

### 3.2.2 Invoice Hooks

**Файл:** `src/hooks/useInvoices.js`

```javascript
// Hooks:
- useInvoices() - все инвойсы клиента
- useInvoicesByOffer(offerId) - инвойсы по оферте
- useInvoice(invoiceId) - детали инвойса
- useUploadPaymentProof() - загрузка proof
```

### 3.2.3 Invoice Detail Page

**Файл:** `src/pages/invoices/InvoiceDetailPage.jsx`

**Секции:**
- Header (номер, статус, due date)
- Milestone info
- Amount (USD / USDT)
- Payment info:
  - Wallet address (TRC20/ERC20)
  - Network selector
  - QR code (optional)
  - Copy button
- Payment proof upload (if unpaid)
- Status timeline

### 3.2.4 Wallet Configuration

**Константы или из price_configs:**

```javascript
const WALLETS = {
  TRC20: 'TxxxxxxxxxxxxxxxxxxxxTRC20',
  ERC20: '0xxxxxxxxxxxxxxxxxERC20',
};
```

### 3.2.5 Invoices List Page

**Файл:** `src/pages/invoices/InvoicesPage.jsx`

**Columns:**
- Invoice number
- Project / Milestone
- Amount
- Status
- Due date
- Paid at
- Actions (View, Upload proof)

---

## 3.3 Legal Text

### Template (placeholder)

```text
ОФЕРТА НА ОКАЗАНИЕ УСЛУГ

1. ПРЕДМЕТ ОФЕРТЫ
Исполнитель (ReSkin Lab) предлагает Заказчику услуги по созданию 
визуальных материалов согласно прилагаемой Спецификации.

2. СТОИМОСТЬ И ПОРЯДОК ОПЛАТЫ
Общая стоимость: ${grandTotal} USD
Оплата производится в USDT (TRC20/ERC20) согласно графику платежей.

3. СРОКИ
Срок выполнения: зависит от объёма работ.
Оферта действительна до: ${validUntil}

4. АКЦЕПТ
Акцепт оферты осуществляется путём нажатия кнопки "Принять оферту"
и подтверждения согласия с условиями.

5. ИНТЕЛЛЕКТУАЛЬНАЯ СОБСТВЕННОСТЬ
Права на созданные материалы переходят к Заказчику после полной оплаты.

[Полный юридический текст будет составлен отдельно]
```

---

## Файловая структура Phase 3

```
src/
├── hooks/
│   ├── useOffers.js                ← NEW
│   └── useInvoices.js              ← NEW
│
├── components/
│   ├── offers/
│   │   ├── OfferCard.jsx           ← NEW
│   │   ├── AcceptOfferModal.jsx    ← NEW
│   │   ├── LegalTextViewer.jsx     ← NEW
│   │   └── index.js
│   │
│   └── invoices/
│       ├── InvoiceCard.jsx         ← NEW
│       ├── PaymentInfo.jsx         ← NEW
│       ├── UploadProofModal.jsx    ← NEW
│       └── index.js
│
├── pages/
│   ├── offers/
│   │   ├── OffersPage.jsx          ← NEW
│   │   └── OfferDetailPage.jsx     ← NEW
│   │
│   └── invoices/
│       ├── InvoicesPage.jsx        ← NEW
│       └── InvoiceDetailPage.jsx   ← NEW
│
├── lib/
│   ├── offerUtils.js               ← NEW (number generation, legal text)
│   └── invoiceUtils.js             ← NEW (milestone logic)
│
└── App.jsx                         (update routes)
```

---

## Implementation Order

### Step 1: Core Utilities
1. `lib/offerUtils.js` — number generation, legal text
2. `lib/invoiceUtils.js` — milestone calculation

### Step 2: Hooks
1. `hooks/useOffers.js` — CRUD + accept
2. `hooks/useInvoices.js` — CRUD + proof upload

### Step 3: Offers UI
1. `OfferCard.jsx`
2. `OffersPage.jsx`
3. `OfferDetailPage.jsx`
4. `AcceptOfferModal.jsx`
5. `LegalTextViewer.jsx`

### Step 4: Invoices UI
1. `InvoiceCard.jsx`
2. `InvoicesPage.jsx`
3. `InvoiceDetailPage.jsx`
4. `PaymentInfo.jsx`
5. `UploadProofModal.jsx`

### Step 5: Integration
1. Add "Create Offer" to SpecificationDetailPage
2. Update routes
3. Update sidebar navigation

---

## Acceptance Criteria

### Offers
- [ ] Из финализированной спецификации можно создать оферту
- [ ] Оферта имеет уникальный номер OFF-YYYY-NNNNN
- [ ] Оферта содержит legal text
- [ ] Клиент видит список своих оферт
- [ ] Клиент может принять оферту (с логированием)
- [ ] При акцепте логируется IP, user agent, snapshot

### Invoices
- [ ] При создании оферты генерируются инвойсы по milestone'ам
- [ ] Инвойс содержит wallet address
- [ ] Клиент видит список инвойсов
- [ ] Клиент видит payment info (wallet, network)
- [ ] Клиент может загрузить proof of payment

### Integration
- [ ] Из страницы спецификации можно создать оферту
- [ ] Navigation обновлён (Offers, Invoices)
- [ ] Routes работают

---

## Notes

### Оставляем на Phase 4+:
- AM: подтверждение оплаты
- AM: управление офертами
- PDF export
- Email notifications
- QR code для оплаты

### Wallet addresses:
- Будут захардкожены или в price_configs
- В будущем — настраиваемые через Admin panel

---

**Document Version:** 1.0  
**Created:** 2026-02-01
