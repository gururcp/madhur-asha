# Zoho Integration - Quick Reference Guide

## 🎯 Project Overview

**Goal**: Add Zoho Books integration to Madhur Asha Ledger with new Suppliers and Items screens

**Key Requirements**:
- ✅ Preserve existing UI/UX design completely
- ✅ Add Zoho sync for Customers, Suppliers, and Items
- ✅ Reuse GST auto-fetch for Suppliers
- ✅ Implement bulk operations for Items
- ✅ Admin-only Zoho operations

---

## 📋 Implementation Checklist

### Phase 1: Database (5 tasks)
- [ ] Update customers schema
- [ ] Create suppliers schema  
- [ ] Create items schema
- [ ] Update schema exports
- [ ] Run migrations

### Phase 2: Zoho Service (4 tasks)
- [ ] Create zoho.ts library
- [ ] Implement pushContact()
- [ ] Implement pushItem()
- [ ] Test token refresh

### Phase 3: Backend Routes (4 tasks)
- [ ] Add customers Zoho route
- [ ] Create suppliers routes
- [ ] Create items routes
- [ ] Update routes index

### Phase 4: API Spec (3 tasks)
- [ ] Update OpenAPI spec
- [ ] Add new schemas
- [ ] Regenerate clients

### Phase 5: Suppliers Frontend (4 tasks)
- [ ] Create suppliers page
- [ ] Add GST auto-fetch
- [ ] Add payment/bank fields
- [ ] Add Zoho push button

### Phase 6: Items Frontend (4 tasks)
- [ ] Create items page
- [ ] Add inline editing
- [ ] Add bulk selection
- [ ] Add bulk Zoho push

### Phase 7: Navigation (2 tasks)
- [ ] Update layout menu
- [ ] Add menu icons

### Phase 8: Configuration (2 tasks)
- [ ] Update .env.example
- [ ] Update .env

### Phase 9: Testing (4 tasks)
- [ ] Test database
- [ ] Test backend APIs
- [ ] Test frontend
- [ ] Test Zoho integration

---

## 🔑 Zoho Credentials

```env
ZOHO_CLIENT_ID=1000.31DRN6FRDMQMQV2OJIKUNZO53WCFEK
ZOHO_CLIENT_SECRET=a283feb902506457109bb053f35dec93cdce7e6467
ZOHO_REFRESH_TOKEN=1000.2c0154c180035aea3a08eccdc06814a6.db5c232721cea1c09815775785e0e96a
ZOHO_ORGANIZATION_ID=60068787013
ZOHO_API_DOMAIN=https://www.zohoapis.in
```

---

## 📊 Database Schema Quick Reference

### Customers (Updated)
```typescript
{
  // Existing fields...
  contactPerson: text("contact_person"),      // NEW
  zohoId: text("zoho_id"),                    // NEW
  zohoSyncStatus: text("zoho_sync_status"),   // NEW
  zohoSyncedAt: timestamp("zoho_synced_at"),  // NEW
  zohoErrorMessage: text("zoho_error_message") // NEW
}
```

### Suppliers (New Table)
```typescript
{
  id, businessName, gstin, contactPerson,
  status, address, state, pincode,
  contactInfo, paymentTerms, bankAccount,
  zohoId, zohoSyncStatus, zohoSyncedAt, zohoErrorMessage,
  createdBy, createdAt, updatedAt
}
```

### Items (New Table)
```typescript
{
  id, name, hsnCode, description,
  unit, purchaseRate, sellingRate,
  gstRate, itemType,
  zohoId, zohoSyncStatus, zohoSyncedAt, zohoErrorMessage,
  createdBy, createdAt, updatedAt
}
```

---

## 🛣️ API Routes Quick Reference

### Customers
```
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
POST   /api/customers/:id/push-zoho  ⭐ NEW
```

### Suppliers (All New)
```
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
POST   /api/suppliers/:id/push-zoho
```

### Items (All New)
```
GET    /api/items
POST   /api/items
GET    /api/items/:id
PUT    /api/items/:id
DELETE /api/items/:id
POST   /api/items/:id/push-zoho
POST   /api/items/bulk-push-zoho  ⭐ BULK
```

---

## 🎨 UI/UX Design Patterns to Preserve

### Colors
```css
Primary: hsl(var(--primary))
Secondary: hsl(var(--secondary))
Accent: hsl(var(--accent))
Background: hsl(var(--background))
Card: hsl(var(--card))
```

### Border Radius
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Inputs: `rounded-lg`

### Spacing
- Page padding: `p-4 md:p-8`
- Card padding: `p-4` or `p-6`
- Gap between elements: `gap-3` or `gap-4`

### Typography
- Page title: `text-2xl md:text-3xl font-display font-bold`
- Subtitle: `text-muted-foreground text-sm`
- Body: Default font with appropriate weights

### Components to Reuse
- `Button` from `@/components/ui/button`
- `Input` from `@/components/ui/input`
- `Card` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Dialog` from `@/components/ui/dialog`
- All other shadcn/ui components

---

## 🔄 Zoho Push Button States

```typescript
// State progression
"Push to Zoho" → "Syncing..." → "✓ Synced" / "⚠ Retry"

// Implementation
zohoSyncStatus: 'pending' | 'syncing' | 'synced' | 'error'

// UI mapping
pending  → "Push to Zoho" (primary button)
syncing  → "Syncing..." (disabled, with spinner)
synced   → "✓ Synced" (success badge, show zohoId on hover)
error    → "⚠ Retry" (destructive badge, show error on hover)
```

---

## 📝 Form Field Reference

### Suppliers Form
```typescript
{
  businessName: string (required),
  gstin: string (with validation),
  contactPerson: string (auto-filled from GST),
  status: string (auto-filled, read-only),
  address: string (auto-filled, editable),
  state: string (auto-filled, editable),
  pincode: string (auto-filled, editable),
  contactInfo: string (manual),
  paymentTerms: dropdown (Net 7/15/30/45/60),
  bankAccount: {
    accountNo: string,
    ifsc: string,
    bankName: string
  }
}
```

### Items Form
```typescript
{
  name: string (required),
  hsnCode: string (required, 4-8 digits),
  description: string (optional),
  unit: dropdown (Nos/Kg/Grams/Litre/Metre/Box/Bag/Piece/Set),
  purchaseRate: string (required),
  sellingRate: string (required),
  gstRate: dropdown (0%/5%/12%/18%/28%),
  itemType: dropdown (Goods/Service)
}
```

---

## 🔐 Access Control

### Role Permissions
```typescript
Admin:
  - Full CRUD on all entities
  - Zoho push operations
  - User management

Customer Access:
  - Read/Write customers
  - Read-only suppliers/items
  - No Zoho operations

Calculator Only:
  - Calculator access only
  - No entity management
```

### Middleware Usage
```typescript
requireApproved  // All entity routes
requireAdmin     // Zoho push routes, delete operations
```

---

## 🧪 Testing Checklist

### Database Tests
- [ ] Migrations run without errors
- [ ] All tables created correctly
- [ ] Unique constraints work (GSTIN)
- [ ] Foreign keys enforced

### Backend Tests
- [ ] All CRUD operations work
- [ ] Zoho token refresh works
- [ ] Zoho push succeeds
- [ ] Error handling works
- [ ] Access control enforced

### Frontend Tests
- [ ] Pages match design exactly
- [ ] Forms validate correctly
- [ ] GST auto-fetch works
- [ ] Zoho push button states work
- [ ] Responsive design works
- [ ] Navigation works

### Integration Tests
- [ ] Create → Push → Verify in Zoho
- [ ] Update → Re-push → Verify
- [ ] Bulk push → Verify all items
- [ ] Error scenarios handled

---

## 🚀 Deployment Steps

1. **Database Migration**
   ```bash
   pnpm --filter @workspace/db exec drizzle-kit push
   ```

2. **Environment Variables**
   - Add Zoho credentials to Render
   - Verify all variables set

3. **API Deployment**
   - Push to main branch
   - Render auto-deploys
   - Verify health check

4. **Frontend Deployment**
   - Push to main branch
   - Vercel auto-deploys
   - Test all features

5. **Verification**
   - Test Zoho integration end-to-end
   - Verify all pages work
   - Check mobile responsiveness

---

## 📞 Support & Resources

### Documentation
- [ZOHO_INTEGRATION_PLAN.md](./ZOHO_INTEGRATION_PLAN.md) - Full implementation plan
- [ZOHO_ARCHITECTURE.md](./ZOHO_ARCHITECTURE.md) - Architecture diagrams
- [GST_AUTO_FETCH_ARCHITECTURE.md](./GST_AUTO_FETCH_ARCHITECTURE.md) - GST integration

### External APIs
- Zoho Books API: https://www.zoho.com/books/api/v3/
- GST API: Via RapidAPI

### Key Files
- Database schemas: `lib/db/src/schema/`
- API routes: `artifacts/api-server/src/routes/`
- Frontend pages: `artifacts/madhur-asha/src/pages/`
- Zoho service: `artifacts/api-server/src/lib/zoho.ts`

---

## ⚠️ Important Notes

1. **Design Preservation**: Every pixel must match existing design
2. **Token Security**: Never expose Zoho tokens to frontend
3. **Error Handling**: Always update sync status on errors
4. **Testing**: Test each phase before moving to next
5. **Backup**: Backup database before migrations
6. **Documentation**: Update docs as you implement

---

## 🎯 Success Criteria

✅ All 32 TODO items completed
✅ Design matches existing pages exactly
✅ Zoho integration works end-to-end
✅ All tests pass
✅ No regressions in existing features
✅ Mobile responsive design works
✅ Admin controls enforced
✅ Documentation complete

---

## 📊 Progress Tracking

Use the TODO list to track progress:
- 32 total tasks
- 9 phases
- Estimated time: 2-3 days for full implementation

Current Status: **Planning Complete** ✅

Next Step: **Switch to Code mode to begin implementation**