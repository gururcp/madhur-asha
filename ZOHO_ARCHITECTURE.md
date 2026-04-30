# Zoho Integration Architecture

## System Architecture Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        CP[Customers Page]
        SP[Suppliers Page]
        IP[Items Page]
        NAV[Navigation/Layout]
    end
    
    subgraph API["API Server (Express)"]
        CR[Customers Routes]
        SR[Suppliers Routes]
        IR[Items Routes]
        ZS[Zoho Service]
        GST[GST Lookup Service]
    end
    
    subgraph Database["PostgreSQL (Neon)"]
        CT[customers table]
        ST[suppliers table]
        IT[items table]
    end
    
    subgraph External["External Services"]
        ZB[Zoho Books API]
        GA[GST API]
    end
    
    CP --> CR
    SP --> SR
    IP --> IR
    
    CR --> CT
    SR --> ST
    IR --> IT
    
    CR --> ZS
    SR --> ZS
    IR --> ZS
    
    SR --> GST
    CP --> GST
    
    ZS --> ZB
    GST --> GA
    
    style Frontend fill:#e1f5ff
    style API fill:#fff4e1
    style Database fill:#e8f5e9
    style External fill:#fce4ec
```

## Data Flow - Zoho Push Operation

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant ZohoService
    participant Database
    participant ZohoBooks
    
    User->>Frontend: Click "Push to Zoho"
    Frontend->>API: POST /api/customers/:id/push-zoho
    API->>Database: Update status to 'syncing'
    Database-->>API: Status updated
    API->>ZohoService: pushContact(data, type)
    
    ZohoService->>ZohoService: Check token validity
    alt Token expired or expires soon
        ZohoService->>ZohoBooks: POST /oauth/v2/token (refresh)
        ZohoBooks-->>ZohoService: New access token
        ZohoService->>ZohoService: Cache token with expiry
    end
    
    ZohoService->>ZohoBooks: POST /books/v3/contacts
    ZohoBooks-->>ZohoService: Contact created (zohoId)
    ZohoService-->>API: Success response
    
    API->>Database: Update zohoId, status='synced'
    Database-->>API: Updated
    API-->>Frontend: Success response
    Frontend->>Frontend: Update UI to "✓ Synced"
    Frontend-->>User: Show success message
```

## Token Management Flow

```mermaid
stateDiagram-v2
    [*] --> NoToken: Initial State
    NoToken --> Refreshing: First API Call
    Refreshing --> Valid: Token Received
    Valid --> Valid: API Calls (token valid)
    Valid --> Refreshing: Token expires in <5 min
    Refreshing --> Valid: New Token
    Refreshing --> Error: Refresh Failed
    Error --> Refreshing: Retry
    
    note right of Valid
        Token cached in memory
        Expiry tracked
        Never exposed to frontend
    end note
```

## Database Schema Relationships

```mermaid
erDiagram
    users ||--o{ customers : creates
    users ||--o{ suppliers : creates
    users ||--o{ items : creates
    customers ||--o{ calculations : has
    
    users {
        int id PK
        string email
        string name
        string role
        string status
    }
    
    customers {
        int id PK
        string name
        string gstin UK
        string contactPerson
        string zohoId
        string zohoSyncStatus
        timestamp zohoSyncedAt
        int createdBy FK
    }
    
    suppliers {
        int id PK
        string businessName
        string gstin UK
        string contactPerson
        string paymentTerms
        json bankAccount
        string zohoId
        string zohoSyncStatus
        timestamp zohoSyncedAt
        int createdBy FK
    }
    
    items {
        int id PK
        string name
        string hsnCode
        string unit
        string purchaseRate
        string sellingRate
        string gstRate
        string itemType
        string zohoId
        string zohoSyncStatus
        timestamp zohoSyncedAt
        int createdBy FK
    }
```

## Component Hierarchy

```mermaid
graph TD
    App[App.tsx]
    Layout[Layout Component]
    
    App --> Layout
    
    Layout --> Dashboard[Dashboard Page]
    Layout --> Calculator[Calculator Page]
    Layout --> Customers[Customers Page]
    Layout --> Suppliers[Suppliers Page]
    Layout --> Items[Items Page]
    Layout --> History[History Page]
    Layout --> Admin[Admin Page]
    
    Customers --> CustomerForm[Customer Form Dialog]
    Customers --> CustomerList[Customer List/Table]
    Customers --> ZohoPushBtn1[Zoho Push Button]
    
    Suppliers --> SupplierForm[Supplier Form Dialog]
    Suppliers --> SupplierList[Supplier List/Table]
    Suppliers --> ZohoPushBtn2[Zoho Push Button]
    
    Items --> ItemForm[Item Form Dialog]
    Items --> ItemList[Item List/Table]
    Items --> InlineEdit[Inline Edit Component]
    Items --> BulkActions[Bulk Actions Bar]
    Items --> ZohoPushBtn3[Zoho Push Button]
    
    style Customers fill:#bbdefb
    style Suppliers fill:#c8e6c9
    style Items fill:#fff9c4
```

## API Endpoint Structure

```
/api
├── /auth
│   ├── GET  /me
│   └── POST /logout
├── /users
│   ├── GET  /
│   └── POST /:id/approve
├── /gst
│   └── GET  /lookup?gstin=xxx
├── /customers
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── POST   /:id/push-zoho ⭐ NEW
├── /suppliers ⭐ NEW
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   └── POST   /:id/push-zoho
├── /items ⭐ NEW
│   ├── GET    /
│   ├── POST   /
│   ├── GET    /:id
│   ├── PUT    /:id
│   ├── DELETE /:id
│   ├── POST   /:id/push-zoho
│   └── POST   /bulk-push-zoho
├── /calculations
│   ├── GET  /
│   ├── POST /
│   └── GET  /:id
└── /dashboard
    └── GET  /stats
```

## Zoho Service Internal Architecture

```mermaid
graph LR
    subgraph ZohoService["Zoho Service (zoho.ts)"]
        TM[Token Manager]
        PC[pushContact]
        PI[pushItem]
        GVT[getValidAccessToken]
        
        PC --> GVT
        PI --> GVT
        GVT --> TM
    end
    
    subgraph TokenCache["In-Memory Token Cache"]
        AT[accessToken]
        EA[expiresAt]
    end
    
    TM --> TokenCache
    
    subgraph ZohoAPI["Zoho APIs"]
        OAuth[OAuth Token Endpoint]
        Contacts[Contacts API]
        Items[Items API]
    end
    
    GVT --> OAuth
    PC --> Contacts
    PI --> Items
    
    style ZohoService fill:#e3f2fd
    style TokenCache fill:#fff3e0
    style ZohoAPI fill:#f3e5f5
```

## Security & Access Control

```mermaid
graph TD
    Request[Incoming Request]
    Auth{Authenticated?}
    Approved{Status = approved?}
    Role{Role Check}
    
    Request --> Auth
    Auth -->|No| Reject1[401 Unauthorized]
    Auth -->|Yes| Approved
    Approved -->|No| Reject2[403 Pending/Rejected]
    Approved -->|Yes| Role
    
    Role -->|Admin| AllowAll[Full Access]
    Role -->|Customer Access| AllowLimited[Limited Access]
    Role -->|Calculator Only| AllowCalc[Calculator Only]
    
    AllowAll --> Customers[Customers CRUD]
    AllowAll --> Suppliers[Suppliers CRUD]
    AllowAll --> Items[Items CRUD]
    AllowAll --> ZohoPush[Zoho Push Operations]
    
    AllowLimited --> Customers
    AllowLimited --> ReadOnly[Read-Only Access]
    
    AllowCalc --> Calculator[Calculator Only]
    
    style AllowAll fill:#c8e6c9
    style AllowLimited fill:#fff9c4
    style AllowCalc fill:#ffccbc
```

## Frontend State Management

```mermaid
stateDiagram-v2
    [*] --> Idle: Page Load
    Idle --> Loading: Fetch Data
    Loading --> Success: Data Received
    Loading --> Error: Fetch Failed
    Success --> Idle: User Action
    Error --> Idle: Retry
    
    Success --> FormOpen: Click Add/Edit
    FormOpen --> Submitting: Submit Form
    Submitting --> Success: Save Success
    Submitting --> FormError: Save Failed
    FormError --> FormOpen: Fix & Retry
    
    Success --> Syncing: Click Push to Zoho
    Syncing --> Synced: Zoho Success
    Syncing --> SyncError: Zoho Failed
    Synced --> Success: Continue
    SyncError --> Success: Retry Available
    
    note right of Synced
        Show ✓ Synced badge
        Display Zoho ID on hover
    end note
    
    note right of SyncError
        Show ⚠ Retry badge
        Display error message
    end note
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Vercel["Vercel (Frontend)"]
        FE[React SPA]
    end
    
    subgraph Render["Render (Backend)"]
        API[Express API Server]
    end
    
    subgraph Neon["Neon (Database)"]
        DB[(PostgreSQL)]
    end
    
    subgraph Zoho["Zoho Cloud"]
        ZB[Zoho Books API]
    end
    
    subgraph RapidAPI["RapidAPI"]
        GST[GST Lookup API]
    end
    
    User[End User] --> FE
    FE --> API
    API --> DB
    API --> ZB
    API --> GST
    
    style Vercel fill:#000000,color:#ffffff
    style Render fill:#46e3b7
    style Neon fill:#00e699
    style Zoho fill:#e42527,color:#ffffff
    style RapidAPI fill:#0055da,color:#ffffff
```

## Error Handling Flow

```mermaid
graph TD
    Operation[Zoho Push Operation]
    Try{Try Push}
    
    Operation --> Try
    
    Try -->|Success| UpdateSuccess[Update DB: status=synced]
    Try -->|Network Error| UpdateError1[Update DB: status=error]
    Try -->|API Error| UpdateError2[Update DB: status=error]
    Try -->|Token Error| RefreshToken[Refresh Token]
    
    RefreshToken -->|Success| Retry[Retry Operation]
    RefreshToken -->|Failed| UpdateError3[Update DB: status=error]
    
    Retry --> Try
    
    UpdateSuccess --> NotifyUser1[Show Success Toast]
    UpdateError1 --> NotifyUser2[Show Error Toast]
    UpdateError2 --> NotifyUser2
    UpdateError3 --> NotifyUser2
    
    NotifyUser2 --> AllowRetry[Enable Retry Button]
    
    style UpdateSuccess fill:#c8e6c9
    style UpdateError1 fill:#ffcdd2
    style UpdateError2 fill:#ffcdd2
    style UpdateError3 fill:#ffcdd2
```

## Key Design Decisions

### 1. Token Management
- **In-memory cache**: Tokens stored in server memory, never in database
- **Automatic refresh**: Check expiry before each API call
- **5-minute buffer**: Refresh if token expires within 5 minutes
- **Security**: Tokens never exposed to frontend

### 2. Database Design
- **Separate tables**: Customers, Suppliers, Items are distinct entities
- **Zoho fields**: Consistent across all tables (zohoId, zohoSyncStatus, etc.)
- **JSON storage**: Bank account details stored as JSON for flexibility
- **Audit trail**: createdBy, createdAt, updatedAt for all entities

### 3. Frontend Architecture
- **Component reuse**: Same UI components across all pages
- **Design consistency**: Exact match of colors, fonts, spacing
- **Responsive design**: Desktop table + mobile cards pattern
- **State management**: React Query for server state, useState for UI state

### 4. API Design
- **RESTful**: Standard CRUD operations
- **Consistent patterns**: Same structure for all entity routes
- **Role-based access**: Admin-only for Zoho operations
- **Error handling**: Consistent error responses

### 5. Bulk Operations
- **Sequential processing**: Items pushed one at a time
- **Progress tracking**: Individual status for each item
- **Partial success**: Continue on error, report all results
- **User feedback**: Real-time progress updates

## Performance Considerations

1. **Token Caching**: Reduces OAuth calls by ~99%
2. **Database Indexing**: GSTIN fields indexed for fast lookups
3. **Lazy Loading**: Frontend loads data on demand
4. **Optimistic Updates**: UI updates before server confirmation
5. **Debounced Search**: Reduces API calls during typing

## Security Measures

1. **Server-side tokens**: Zoho credentials never exposed
2. **Role-based access**: Admin-only for sensitive operations
3. **Input validation**: Both frontend and backend validation
4. **SQL injection prevention**: Parameterized queries via Drizzle ORM
5. **CORS protection**: Strict origin checking
6. **Session security**: HTTP-only cookies, secure in production