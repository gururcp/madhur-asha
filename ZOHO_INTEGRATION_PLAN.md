# Zoho Integration - Complete Implementation Plan

## Overview
This plan details the complete implementation of Zoho Books integration with new Suppliers and Items screens, following the existing design patterns and UI/UX of the Customers screen.

---

## Phase 1: Database Schema & Migrations

### 1.1 Update Customers Schema
**File:** `lib/db/src/schema/customers.ts`

Add Zoho-related fields:
```typescript
zohoId: text("zoho_id"),
zohoSyncStatus: text("zoho_sync_status"), // 'pending' | 'syncing' | 'synced' | 'error'
zohoSyncedAt: timestamp("zoho_synced_at"),
zohoErrorMessage: text("zoho_error_message"),
contactPerson: text("contact_person"), // NEW: manual field for contact person
```

### 1.2 Create Suppliers Schema
**File:** `lib/db/src/schema/suppliers.ts`

```typescript
export const suppliersTable = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  gstin: text("gstin").unique(),
  contactPerson: text("contact_person"),
  status: text("status"), // from GST API
  address: text("address"),
  state: text("state"),
  pincode: text("pincode"),
  contactInfo: text("contact_info"),
  paymentTerms: text("payment_terms"), // Net 7, Net 15, Net 30, Net 45, Net 60
  bankAccount: text("bank_account"), // JSON string: {accountNo, ifsc, bankName}
  
  // Zoho fields
  zohoId: text("zoho_id"),
  zohoSyncStatus: text("zoho_sync_status"),
  zohoSyncedAt: timestamp("zoho_synced_at"),
  zohoErrorMessage: text("zoho_error_message"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 1.3 Create Items Schema
**File:** `lib/db/src/schema/items.ts`

```typescript
export const itemsTable = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hsnCode: text("hsn_code").notNull(), // 4-8 digit code
  description: text("description"),
  unit: text("unit").notNull(), // Nos, Kg, Grams, Litre, Metre, Box, Bag, Piece, Set
  purchaseRate: text("purchase_rate").notNull(), // stored as string for precision
  sellingRate: text("selling_rate").notNull(),
  gstRate: text("gst_rate").notNull(), // 0, 5, 12, 18, 28
  itemType: text("item_type").notNull(), // 'goods' | 'service'
  
  // Zoho fields
  zohoId: text("zoho_id"),
  zohoSyncStatus: text("zoho_sync_status"),
  zohoSyncedAt: timestamp("zoho_synced_at"),
  zohoErrorMessage: text("zoho_error_message"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

### 1.4 Update Schema Index
**File:** `lib/db/src/schema/index.ts`

Add exports:
```typescript
export * from "./suppliers";
export * from "./items";
```

---

## Phase 2: Zoho Service Library

### 2.1 Create Zoho Service
**File:** `artifacts/api-server/src/lib/zoho.ts`

**Key Features:**
- Token management with automatic refresh
- Secure token storage (in-memory, never exposed to frontend)
- Three main functions: `pushContact()`, `pushItem()`, `getValidAccessToken()`

**Implementation Details:**

```typescript
interface ZohoTokens {
  accessToken: string;
  expiresAt: number; // timestamp
}

let tokenCache: ZohoTokens | null = null;

// Environment variables needed:
// ZOHO_CLIENT_ID
// ZOHO_CLIENT_SECRET
// ZOHO_REFRESH_TOKEN
// ZOHO_ORGANIZATION_ID
// ZOHO_API_DOMAIN (https://www.zohoapis.in)

async function getValidAccessToken(): Promise<string> {
  // Check if token exists and expires in more than 5 minutes
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }
  
  // Refresh token
  const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000)
  };
  
  return tokenCache.accessToken;
}

async function pushContact(data: any, type: 'customer' | 'vendor'): Promise<any> {
  const token = await getValidAccessToken();
  
  const payload = {
    contact_name: data.contactPerson || data.name,
    company_name: data.name || data.businessName,
    contact_type: type,
    gst_no: data.gstin,
    gst_treatment: data.gstin ? 'business_gst' : 'consumer',
    billing_address: {
      address: data.address,
      state: data.state,
      zip: data.pincode,
      country: 'India'
    },
    phone: data.contactInfo || data.contact,
    ...(type === 'vendor' && data.paymentTerms ? { payment_terms: data.paymentTerms } : {})
  };
  
  const response = await fetch(
    `${process.env.ZOHO_API_DOMAIN}/books/v3/contacts?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  
  return response.json();
}

async function pushItem(data: any): Promise<any> {
  const token = await getValidAccessToken();
  
  const payload = {
    name: data.name,
    description: data.description,
    rate: parseFloat(data.sellingRate),
    purchase_rate: parseFloat(data.purchaseRate),
    unit: data.unit,
    hsn_or_sac: data.hsnCode,
    item_type: data.itemType,
    tax_percentage: parseFloat(data.gstRate)
  };
  
  const response = await fetch(
    `${process.env.ZOHO_API_DOMAIN}/books/v3/items?organization_id=${process.env.ZOHO_ORGANIZATION_ID}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  
  return response.json();
}

export { pushContact, pushItem, getValidAccessToken };
```

---

## Phase 3: Backend API Routes

### 3.1 Update Customers Routes
**File:** `artifacts/api-server/src/routes/customers.ts`

Add new route:
```typescript
router.post("/:id/push-zoho", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }
    
    const id = Number(req.params.id);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
    
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    
    // Update status to syncing
    await db.update(customersTable)
      .set({ zohoSyncStatus: 'syncing' })
      .where(eq(customersTable.id, id));
    
    try {
      const result = await pushContact(customer, 'customer');
      
      if (result.code === 0) {
        await db.update(customersTable)
          .set({ 
            zohoId: result.contact.contact_id,
            zohoSyncStatus: 'synced',
            zohoSyncedAt: new Date(),
            zohoErrorMessage: null
          })
          .where(eq(customersTable.id, id));
        
        res.json({ message: "Synced successfully", zohoId: result.contact.contact_id });
      } else {
        throw new Error(result.message || "Zoho API error");
      }
    } catch (error: any) {
      await db.update(customersTable)
        .set({ 
          zohoSyncStatus: 'error',
          zohoErrorMessage: error.message
        })
        .where(eq(customersTable.id, id));
      
      throw error;
    }
  } catch (err) {
    next(err);
  }
});
```

### 3.2 Create Suppliers Routes
**File:** `artifacts/api-server/src/routes/suppliers.ts`

Full CRUD + Zoho push implementation (mirror customers.ts structure):
- GET `/api/suppliers` - List all suppliers
- POST `/api/suppliers` - Create supplier
- GET `/api/suppliers/:id` - Get single supplier
- PUT `/api/suppliers/:id` - Update supplier
- DELETE `/api/suppliers/:id` - Delete supplier (admin only)
- POST `/api/suppliers/:id/push-zoho` - Push to Zoho (admin only)

### 3.3 Create Items Routes
**File:** `artifacts/api-server/src/routes/items.ts`

Full CRUD + Zoho push + bulk push:
- GET `/api/items` - List all items
- POST `/api/items` - Create item
- GET `/api/items/:id` - Get single item
- PUT `/api/items/:id` - Update item
- DELETE `/api/items/:id` - Delete item (admin only)
- POST `/api/items/:id/push-zoho` - Push single item to Zoho (admin only)
- POST `/api/items/bulk-push-zoho` - Push multiple items to Zoho (admin only)

### 3.4 Update Routes Index
**File:** `artifacts/api-server/src/routes/index.ts`

Add:
```typescript
import suppliersRouter from "./suppliers.js";
import itemsRouter from "./items.js";

router.use("/suppliers", suppliersRouter);
router.use("/items", itemsRouter);
```

---

## Phase 4: API Specification Updates

### 4.1 Update OpenAPI Spec
**File:** `lib/api-spec/openapi.yaml`

Add complete API definitions for:
- Suppliers endpoints (all CRUD + Zoho push)
- Items endpoints (all CRUD + Zoho push + bulk)
- Update Customer schema with Zoho fields
- Add Supplier schema
- Add Item schema

### 4.2 Regenerate API Clients
Run:
```bash
pnpm --filter @workspace/api-client-react generate
pnpm --filter @workspace/api-zod generate
```

---

## Phase 5: Frontend - Suppliers Page

### 5.1 Create Suppliers Page
**File:** `artifacts/madhur-asha/src/pages/suppliers.tsx`

**Design Requirements:**
- Mirror customers.tsx exactly in structure and styling
- Use same color scheme, fonts, spacing, button styles
- Reuse same UI components (Card, Button, Input, Badge, Dialog, etc.)
- Same responsive behavior (desktop table + mobile cards)

**Key Features:**
- GST auto-fetch with same UI/UX as customers
- Contact Person field (manual entry)
- Payment Terms dropdown (Net 7, 15, 30, 45, 60)
- Bank Account Details section (Account No, IFSC, Bank Name)
- "Push to Zoho" button with same state management:
  - Initial: "Push to Zoho"
  - Loading: "Syncing..." with spinner
  - Success: "✓ Synced" (green badge)
  - Error: "⚠ Retry" (red badge)
- Hover on "✓ Synced" shows Zoho contact ID in tooltip

**Form Structure:**
```typescript
const [formData, setFormData] = useState({
  businessName: "",
  gstin: "",
  contactPerson: "",
  status: "",
  address: "",
  state: "",
  pincode: "",
  contactInfo: "",
  paymentTerms: "",
  bankAccount: {
    accountNo: "",
    ifsc: "",
    bankName: ""
  }
});
```

---

## Phase 6: Frontend - Items Page

### 6.1 Create Items Page
**File:** `artifacts/madhur-asha/src/pages/items.tsx`

**Design Requirements:**
- Match existing design system completely
- Inline editing capability for quick rate updates
- Bulk selection with checkboxes
- Bulk push to Zoho button

**Key Features:**
- List view with filters:
  - Search by name or HSN code
  - Filter by item type (Goods/Service)
  - Filter by GST rate
- Table columns:
  - Item Name
  - HSN/SAC Code
  - Unit
  - Purchase Rate | Selling Rate (side by side)
  - GST Rate
  - Type badge
  - Zoho sync status
  - Actions (Edit, Delete, Push to Zoho)
- Inline editing for rates (click to edit, save on blur)
- Bulk operations:
  - Select multiple items with checkboxes
  - "Push Selected to Zoho" button
  - Shows progress for each item during bulk push

**Form Fields:**
```typescript
const [formData, setFormData] = useState({
  name: "",
  hsnCode: "",
  description: "",
  unit: "Nos",
  purchaseRate: "",
  sellingRate: "",
  gstRate: "18",
  itemType: "goods"
});
```

**Dropdowns:**
- Unit: Nos, Kg, Grams, Litre, Metre, Box, Bag, Piece, Set
- GST Rate: 0%, 5%, 12%, 18%, 28%
- Item Type: Goods, Service

---

## Phase 7: Navigation Updates

### 7.1 Update Layout Component
**File:** `artifacts/madhur-asha/src/components/layout.tsx`

Add to navItems array:
```typescript
{ 
  href: "/suppliers", 
  label: "Suppliers", 
  icon: Truck, // or Building2
  show: user.role === "admin" || user.role === "customer_access" 
},
{ 
  href: "/items", 
  label: "Items", 
  icon: Package, // or Box
  show: user.role === "admin" || user.role === "customer_access" 
},
```

Import icons:
```typescript
import { Truck, Package } from "lucide-react";
```

---

## Phase 8: Environment Configuration

### 8.1 Update .env.example
Add:
```
# Zoho Books Configuration
ZOHO_CLIENT_ID=1000.31DRN6FRDMQMQV2OJIKUNZO53WCFEK
ZOHO_CLIENT_SECRET=a283feb902506457109bb053f35dec93cdce7e6467
ZOHO_REFRESH_TOKEN=1000.2c0154c180035aea3a08eccdc06814a6.db5c232721cea1c09815775785e0e96a
ZOHO_ORGANIZATION_ID=60068787013
ZOHO_API_DOMAIN=https://www.zohoapis.in
```

### 8.2 Update .env
Add actual values from task description.

---

## Phase 9: Testing Strategy

### 9.1 Database Testing
- [ ] Run migrations successfully
- [ ] Verify all tables created with correct schema
- [ ] Test unique constraints (GSTIN for suppliers)
- [ ] Test foreign key relationships

### 9.2 Backend API Testing
- [ ] Test all CRUD operations for suppliers
- [ ] Test all CRUD operations for items
- [ ] Test Zoho push for customers
- [ ] Test Zoho push for suppliers
- [ ] Test Zoho push for items (single and bulk)
- [ ] Test token refresh mechanism
- [ ] Test error handling and status updates

### 9.3 Frontend Testing
- [ ] Test suppliers page matches customers design
- [ ] Test items page functionality
- [ ] Test GST auto-fetch on suppliers
- [ ] Test Zoho push button states
- [ ] Test inline editing on items
- [ ] Test bulk selection and push
- [ ] Test responsive design on mobile
- [ ] Test navigation updates

### 9.4 Integration Testing
- [ ] End-to-end: Create supplier → Push to Zoho → Verify in Zoho Books
- [ ] End-to-end: Create item → Push to Zoho → Verify in Zoho Books
- [ ] Test error scenarios and recovery
- [ ] Test concurrent operations

---

## Implementation Order

1. **Database Layer** (Phase 1)
   - Update customers schema
   - Create suppliers schema
   - Create items schema
   - Run migrations

2. **Backend Services** (Phase 2)
   - Create Zoho service library
   - Test token refresh mechanism

3. **Backend Routes** (Phase 3)
   - Update customers routes
   - Create suppliers routes
   - Create items routes
   - Update routes index

4. **API Specification** (Phase 4)
   - Update OpenAPI spec
   - Regenerate API clients

5. **Frontend - Suppliers** (Phase 5)
   - Create suppliers page
   - Test GST integration
   - Test Zoho push

6. **Frontend - Items** (Phase 6)
   - Create items page
   - Implement inline editing
   - Implement bulk operations

7. **Navigation** (Phase 7)
   - Update layout component
   - Test navigation flow

8. **Configuration** (Phase 8)
   - Update environment files
   - Deploy configuration

9. **Testing** (Phase 9)
   - Execute test plan
   - Fix issues
   - Final verification

---

## Design Preservation Checklist

✅ **Colors & Theme**
- Reuse existing color variables from index.css
- Match primary, secondary, accent colors exactly
- Use same background and card colors

✅ **Typography**
- Use same font-display for headings
- Match font sizes and weights
- Preserve text hierarchy

✅ **Spacing & Layout**
- Use same padding/margin values
- Match card border-radius (rounded-2xl, rounded-xl)
- Preserve responsive breakpoints

✅ **Components**
- Reuse all UI components from components/ui/
- Match button variants and sizes
- Use same badge styles
- Preserve dialog/modal styling

✅ **Icons**
- Use lucide-react icons consistently
- Match icon sizes (w-4 h-4, w-5 h-5, etc.)
- Preserve icon positioning

✅ **Interactions**
- Match hover states
- Use same transition durations
- Preserve loading states and animations

✅ **Responsive Design**
- Desktop: Table view
- Mobile: Card view with bottom navigation
- Match breakpoint behavior exactly

---

## Success Criteria

- [ ] All three screens (Customers, Suppliers, Items) have identical UI/UX
- [ ] Zoho integration works end-to-end for all entity types
- [ ] Token refresh happens automatically without user intervention
- [ ] Error handling provides clear feedback to users
- [ ] All existing functionality remains intact
- [ ] No visual regressions in design
- [ ] Mobile responsive design works perfectly
- [ ] Admin-only features are properly protected
- [ ] Database migrations run without issues
- [ ] API documentation is complete and accurate

---

## Risk Mitigation

**Risk:** Breaking existing customers functionality
**Mitigation:** Test customers page thoroughly after schema changes

**Risk:** Zoho API rate limits
**Mitigation:** Implement exponential backoff and queue for bulk operations

**Risk:** Token expiry during long operations
**Mitigation:** Check token validity before each API call

**Risk:** Design inconsistencies
**Mitigation:** Use exact same components and styling patterns

**Risk:** Data loss during migration
**Mitigation:** Backup database before running migrations

---

## Notes

- All Zoho operations are admin-only for security
- Token management is server-side only, never exposed to frontend
- GST API integration is reused from existing customers implementation
- Bank account details stored as JSON string for flexibility
- Payment terms are predefined dropdown values
- HSN codes validated for 4-8 digit format
- Rates stored as strings to preserve decimal precision
- Bulk operations show individual progress for each item