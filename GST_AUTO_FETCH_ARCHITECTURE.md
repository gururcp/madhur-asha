# 🏗️ GST Auto-Fetch Feature - Detailed Architecture Plan

## 📋 Overview

This feature adds automatic GST information fetching to the Add Customer form and Edit Customer page. When an admin enters a 15-character GSTIN and clicks "Fetch Details", the system will call the RapidAPI GST Insights API through a secure backend route and auto-populate customer information.

---

## 🎯 Key Requirements

1. **Security First**: API key must NEVER be exposed to frontend
2. **User Experience**: Smooth, intuitive flow with clear feedback
3. **Data Integrity**: All auto-filled fields remain editable
4. **Error Handling**: Graceful handling of invalid GSTINs and API failures
5. **Validation**: Client-side GSTIN format validation before API calls
6. **Design Consistency**: Maintain existing UI/UX theme, colors, and fonts
7. **Field Mapping**: Legal Name from GST becomes the Business Name
8. **Status Persistence**: GST Status saved to database
9. **Edit Page Support**: Fetch GST Details available on customer edit page

---

## 🗄️ 1. Database Schema Changes

### File: `lib/db/src/schema/customers.ts`

#### Current Schema
```typescript
{
  id: serial
  name: text (required)          // Business Name
  gstin: text (optional)
  address: text (optional)
  contact: text (optional)
  createdBy: integer (FK to users)
  createdAt: timestamp
}
```

#### New Fields to Add
```typescript
{
  // Existing fields remain...
  
  // New GST-related fields (all optional/nullable)
  gstStatus: text      // "Active" or "Cancelled" - saved to DB
  state: text          // State from GST records
  pincode: text        // Pincode from GST records
}
```

**Note**: `name` field will be populated with Legal Name from GST API

#### Migration Strategy
- Add new columns as nullable to support existing records
- Use Drizzle Kit to generate migration: `pnpm --filter @workspace/db drizzle-kit generate`
- Apply migration: `pnpm --filter @workspace/db drizzle-kit migrate`
- No data migration needed (new fields start as NULL)

#### Updated Schema Code
```typescript
export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),              // Will store Legal Name from GST
  gstin: text("gstin"),
  address: text("address"),
  contact: text("contact"),
  
  // New GST fields
  gstStatus: text("gst_status"),             // Active/Cancelled - persisted
  state: text("state"),
  pincode: text("pincode"),
  
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

---

## 🔌 2. Backend API Implementation

### New Route: `GET /api/gst/lookup`

#### File: `artifacts/api-server/src/routes/customers.ts`

#### Endpoint Details
```
GET /api/gst/lookup?gstin={15-char-gstin}
Authorization: Required (session-based)
```

#### Implementation Code

```typescript
// Add to artifacts/api-server/src/routes/customers.ts

router.get("/gst/lookup", requireApproved, async (req, res, next) => {
  try {
    const { gstin } = req.query;
    
    // 1. Validate GSTIN format
    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
    if (!gstin || typeof gstin !== 'string' || !gstinRegex.test(gstin)) {
      return res.status(400).json({ 
        error: "Invalid GSTIN format. Must be 15 characters matching pattern: 27XXXXX0000X1Z5" 
      });
    }
    
    // 2. Call RapidAPI
    const response = await fetch(
      `https://gst-insights-api.p.rapidapi.com/getGSTDetailsUsingGST/${gstin}`,
      {
        headers: {
          'x-rapidapi-host': 'gst-insights-api.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPID_GST_API || ''
        }
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "GSTIN not found in GST records" });
      }
      throw new Error(`RapidAPI error: ${response.status}`);
    }
    
    const apiData = await response.json();
    
    // 3. Map response - Legal Name becomes Business Name
    const principalAddr = apiData.data?.principalAddress?.address || {};
    const mappedData = {
      name: apiData.data?.legalName || '',           // Legal Name → Business Name
      gstStatus: apiData.data?.status || '',         // Saved to DB
      address: [
        principalAddr.buildingNumber,
        principalAddr.buildingName,
        principalAddr.street,
        principalAddr.location,
        principalAddr.district
      ].filter(Boolean).join(', '),
      state: principalAddr.streetcd || '',
      pincode: principalAddr.pincode || ''
    };
    
    res.json(mappedData);
    
  } catch (err) {
    next(err);
  }
});
```

#### Error Handling Matrix

| Error Type | HTTP Status | Response | User Message |
|------------|-------------|----------|--------------|
| Invalid GSTIN format | 400 | `{ error: "Invalid GSTIN format..." }` | "Please enter a valid 15-character GSTIN" |
| GSTIN not found | 404 | `{ error: "GSTIN not found..." }` | "This GSTIN is not registered in GST records" |
| API unavailable | 503 | `{ error: "Service unavailable" }` | "GST lookup service is temporarily unavailable. Please try again." |
| Rate limit exceeded | 429 | `{ error: "Too many requests" }` | "Too many requests. Please wait a moment and try again." |
| Network error | 500 | `{ error: "Internal server error" }` | "An error occurred. Please try again." |

---

## 📝 3. OpenAPI Specification Update

### File: `lib/api-spec/openapi.yaml`

#### Add New Path
```yaml
paths:
  # ... existing paths ...
  
  /gst/lookup:
    get:
      operationId: lookupGST
      tags: [customers]
      summary: Lookup GST details by GSTIN
      description: Fetches GST registration details from government records via RapidAPI
      parameters:
        - name: gstin
          in: query
          required: true
          description: 15-character GSTIN to lookup
          schema:
            type: string
            pattern: '^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$'
            example: "27AABCI6363G3ZH"
      responses:
        '200':
          description: GST details found successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GSTLookupResponse'
        '400':
          description: Invalid GSTIN format
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: GSTIN not found in records
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '503':
          description: GST API service unavailable
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

#### Add New Schema
```yaml
components:
  schemas:
    # ... existing schemas ...
    
    GSTLookupResponse:
      type: object
      properties:
        name:
          type: string
          description: Legal name (becomes Business Name)
          example: "Reliance Jio Infocomm Limited"
        gstStatus:
          type: string
          enum: [Active, Cancelled]
          description: Current GST registration status
          example: "Active"
        address:
          type: string
          description: Complete principal business address
          example: "WEST END MALL - II, S.No.169/1, Sector - II, H.No.1 Village Aundh, Tal.Haveli, Pune"
        state:
          type: string
          description: State of registration
          example: "Maharashtra"
        pincode:
          type: string
          description: Pincode of principal address
          example: "411007"
```

#### Update Customer Schema
```yaml
    Customer:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
          description: Business Name (Legal Name from GST)
        gstin:
          type: string
          nullable: true
        address:
          type: string
          nullable: true
        contact:
          type: string
          nullable: true
        # Add new fields
        gstStatus:
          type: string
          nullable: true
          description: GST registration status (Active/Cancelled)
        state:
          type: string
          nullable: true
        pincode:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        calculationCount:
          type: integer
```

---

## 🎨 4. Frontend Implementation

### 4.1 Add Customer Form

**File**: `artifacts/madhur-asha/src/pages/customers.tsx`

#### New Form Layout

```
┌─────────────────────────────────────────────┐
│  Add New Customer                           │
├─────────────────────────────────────────────┤
│                                             │
│  GSTIN *                      [Fetch]       │
│  ┌──────────────────────┐   ┌──────────┐   │
│  │ 27XXXXX0000X1Z5      │   │  Fetch   │   │
│  └──────────────────────┘   └──────────┘   │
│  ✓ Valid format                             │
│                                             │
│  Business Name (Legal Name)                 │
│  ┌─────────────────────────────────────┐   │
│  │ Reliance Jio Infocomm Limited       │   │  ← Editable
│  └─────────────────────────────────────┘   │
│                                             │
│  Status                                     │
│  ┌─────────────────────────────────────┐   │
│  │ ● Active                            │   │  ← Badge (saved to DB)
│  └─────────────────────────────────────┘   │
│                                             │
│  Address                                    │
│  ┌─────────────────────────────────────┐   │
│  │ WEST END MALL - II, S.No.169/1...   │   │  ← Editable
│  └─────────────────────────────────────┘   │
│                                             │
│  State                    Pincode           │
│  ┌──────────────────┐   ┌──────────────┐   │
│  │ Maharashtra      │   │ 411007       │   │  ← Both editable
│  └──────────────────┘   └──────────────┘   │
│                                             │
│  Contact Info                               │
│  ┌─────────────────────────────────────┐   │
│  │ Phone or Email                      │   │  ← Manual entry
│  └─────────────────────────────────────┘   │
│                                             │
│  ⚠️ Warning: This GSTIN is Cancelled        │  ← Conditional
│                                             │
│  [Create Customer]                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Edit Customer Page

**File**: `artifacts/madhur-asha/src/pages/customer-detail.tsx`

#### Add Fetch GST Details Button

```
┌─────────────────────────────────────────────┐
│  Customer Details                           │
│  [Edit] [Delete] [Fetch GST Details]        │  ← New button
├─────────────────────────────────────────────┤
│                                             │
│  When "Fetch GST Details" is clicked:       │
│  1. Show confirmation dialog                │
│  2. Fetch latest GST data                   │
│  3. Update fields (user can review)         │
│  4. Save changes                            │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔐 5. Environment Variables

### Files to Update

#### `.env` (local development)
```bash
# Add this line
RAPID_GST_API=8952a7fc86msh62cd7015a82401fp1e201bjsn37fb448a4f83
```

#### `.env.example` (template)
```bash
# Add this line with placeholder
RAPID_GST_API=your_rapidapi_key_here
```

---

## 🚀 6. Implementation Order

### Phase 1: Backend Foundation
1. ✅ Add environment variable `RAPID_GST_API` to `.env`
2. ✅ Update database schema with new fields (gstStatus, state, pincode)
3. ✅ Generate and apply database migration
4. ✅ Implement `/api/gst/lookup` route
5. ✅ Test route with Postman/curl

### Phase 2: API Specification
6. ✅ Update OpenAPI spec with new endpoint
7. ✅ Update Customer schema with new fields
8. ✅ Regenerate TypeScript types
9. ✅ Verify generated hooks in frontend

### Phase 3: Frontend - Add Customer Form
10. ✅ Update form state to include new fields
11. ✅ Implement GSTIN input with validation
12. ✅ Add Fetch button with loading state
13. ✅ Implement GST lookup API call
14. ✅ Add auto-population logic (Legal Name → Business Name)
15. ✅ Add status badge (saved to DB)
16. ✅ Add cancelled warning banner
17. ✅ Create State/Pincode row layout
18. ✅ Update create customer logic

### Phase 4: Frontend - Edit Customer Page
19. ✅ Add "Fetch GST Details" button to customer detail page
20. ✅ Implement fetch and update logic for existing customers
21. ✅ Add confirmation dialog before updating
22. ✅ Show success/error feedback

### Phase 5: Testing & Polish
23. ✅ Test complete flow end-to-end
24. ✅ Handle all error scenarios
25. ✅ Test mobile responsiveness
26. ✅ Verify design consistency
27. ✅ Update documentation

---

## 🎯 7. Success Criteria

### Functional Requirements
- ✅ Admin can enter GSTIN and fetch details
- ✅ Legal Name auto-populates as Business Name
- ✅ Status, Address, State, Pincode auto-populate
- ✅ All auto-filled fields remain editable
- ✅ Status shows as badge and is saved to database
- ✅ Warning appears for cancelled GSTINs
- ✅ State and Pincode on same line
- ✅ Contact info remains manual entry
- ✅ Customer creation works with all fields
- ✅ Data persists correctly in database
- ✅ Fetch GST Details available on edit page

### Non-Functional Requirements
- ✅ API key never exposed to frontend
- ✅ GSTIN validation before API call
- ✅ Graceful error handling
- ✅ Loading states for better UX
- ✅ Mobile responsive design
- ✅ Fast response time (<2 seconds)
- ✅ Clear user feedback at each step
- ✅ Existing UI/UX design maintained

---

## 📚 8. API Response Example

### RapidAPI Response (Raw)
```json
{
  "success": true,
  "data": {
    "legalName": "Reliance Jio Infocomm Limited",
    "status": "Active",
    "principalAddress": {
      "address": {
        "buildingNumber": "WEST END MALL - II",
        "buildingName": "S.No.169/1, Sector - II",
        "street": "H.No.1 Village Aundh",
        "location": "Tal.Haveli",
        "district": "Pune",
        "pincode": "411007",
        "streetcd": "Maharashtra"
      }
    }
  }
}
```

### Our Backend Response (Mapped)
```json
{
  "name": "Reliance Jio Infocomm Limited",
  "gstStatus": "Active",
  "address": "WEST END MALL - II, S.No.169/1, Sector - II, H.No.1 Village Aundh, Tal.Haveli, Pune",
  "state": "Maharashtra",
  "pincode": "411007"
}
```

---

## ✅ Implementation Checklist

- [ ] Database schema updated with new fields (gstStatus, state, pincode)
- [ ] Database migration generated and applied
- [ ] Backend route `/api/gst/lookup` implemented
- [ ] RapidAPI integration working
- [ ] Error handling implemented
- [ ] OpenAPI spec updated
- [ ] TypeScript types regenerated
- [ ] Add Customer form redesigned with existing styling
- [ ] GSTIN validation implemented
- [ ] Fetch button with loading state
- [ ] Auto-population logic working (Legal Name → Business Name)
- [ ] Status badge component added (saved to DB)
- [ ] Cancelled warning banner added
- [ ] State and Pincode on same line
- [ ] Edit Customer page - Fetch GST Details button added
- [ ] Edit Customer page - Update logic implemented
- [ ] Environment variables configured
- [ ] End-to-end testing completed
- [ ] Mobile responsiveness verified
- [ ] Design consistency verified
- [ ] Documentation updated

---

**Last Updated**: 2026-04-03
**Version**: 3.0 (Final)
**Status**: Ready for Implementation

**Key Decisions**:
- ✅ Legal Name from GST → Business Name field
- ✅ All auto-filled fields are editable
- ✅ GST Status saved to database
- ✅ Fetch GST Details available on edit page