# Madhur Asha Enterprises - Implementation Roadmap
## Remaining Work & Completion Guide

**Current Status**: 68% Complete (19/28 tasks)  
**Last Updated**: April 4, 2026

---

## 📊 Progress Overview

```
Phase 1: Database & APIs        ████████████████████ 100% ✅
Phase 2: Orders Module          ██████████░░░░░░░░░░  50% 🔄
Phase 3: Dashboard              ████████████████████ 100% ✅
Phase 4: Generic Expenses       ███████░░░░░░░░░░░░░  33% 🔄
Phase 5: Stage Management       ████████████████████ 100% ✅
Phase 6: Calculator Integration ████████████████████ 100% ✅
Phase 7: Document Management    ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Phase 8: Reports & Analytics    ░░░░░░░░░░░░░░░░░░░░   0% ⏳

Overall Progress: ██████████████░░░░░░ 68%
```

---

## 🎯 Remaining Tasks (9 tasks)

### Priority 1: Complete Phase 2 (CRITICAL) - 2 tasks

#### Task 9: Stage Transitions with Validation ⚠️
**Status**: In Progress  
**Effort**: 4-6 hours  
**Dependencies**: None

**What to Build:**
1. **Stage Transition Dialog** in Order Detail page
   - Show current stage and available next stages
   - Add validation rules (e.g., can't skip stages)
   - Add confirmation message
   - Add notes field for transition reason

2. **API Integration**
   - Connect to `POST /api/orders/:id/transition`
   - Send: `{ toStageId, notes }`
   - Handle success/error responses
   - Refresh order data after transition

3. **Stage History Display**
   - Fetch from `GET /api/orders/:id/history`
   - Show timeline of all transitions
   - Display: stage name, date, user, notes
   - Visual timeline component

**Implementation Steps:**
```typescript
// 1. Add transition dialog state
const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
const [selectedStage, setSelectedStage] = useState<number | null>(null);

// 2. Create transition handler
const handleStageTransition = async () => {
  try {
    await fetch(`/api/orders/${orderId}/transition`, {
      method: 'POST',
      body: JSON.stringify({ toStageId: selectedStage, notes })
    });
    toast.success('Order moved to next stage');
    refetchOrder();
  } catch (error) {
    toast.error('Failed to transition stage');
  }
};

// 3. Add transition button in Overview tab
<Button onClick={() => setTransitionDialogOpen(true)}>
  Move to Next Stage
</Button>
```

**Validation Rules:**
- Can only move to next sequential stage
- Cannot skip stages
- Cannot move backwards (except admin override)
- Must add notes for certain transitions
- Check if required fields are filled

---

#### Task 10: Payment Recording Integration ⚠️
**Status**: In Progress  
**Effort**: 3-4 hours  
**Dependencies**: None

**What to Build:**
1. **Connect Payment Dialog to API**
   - Integrate with `POST /api/orders/:id/payments`
   - Send: `{ type, amount, paymentDate, paymentMethod, referenceNumber, notes }`
   - Update order payment status after recording

2. **Payment Validation**
   - Validate amount doesn't exceed outstanding
   - Validate payment date
   - Validate required fields

3. **Payment History Display**
   - Show all recorded payments
   - Calculate outstanding amounts
   - Show payment status badges

**Implementation Steps:**
```typescript
// 1. Payment recording handler
const handleRecordPayment = async (data: PaymentData) => {
  try {
    await fetch(`/api/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    toast.success('Payment recorded successfully');
    refetchOrder();
    setPaymentDialogOpen(false);
  } catch (error) {
    toast.error('Failed to record payment');
  }
};

// 2. Calculate outstanding
const outstanding = invoiceAmount - receivedAmount;

// 3. Show payment status
const getPaymentStatus = () => {
  if (receivedAmount === 0) return 'pending';
  if (receivedAmount < invoiceAmount) return 'partial';
  return 'paid';
};
```

---

### Priority 2: Complete Phase 4 - 2 tasks

#### Task 15: Expense Allocation Recalculation Triggers
**Status**: Pending  
**Effort**: 2-3 hours  
**Dependencies**: None

**What to Build:**
1. **Automatic Recalculation on Expense Changes**
   - When expense added: recalculate all active orders
   - When expense updated: recalculate all active orders
   - When expense deleted: recalculate all active orders

2. **Automatic Recalculation on Order Stage Changes**
   - When order moves to COMPLETED: exclude from allocation
   - When order moves from COMPLETED: include in allocation
   - Recalculate all remaining active orders

3. **Update Order Allocated Expenses**
   - Calculate: `totalGenericExpenses / activeOrderCount`
   - Update `allocatedGenericExpenses` field in all active orders
   - Recalculate `netProfit` for each order

**Implementation (Backend):**
```typescript
// In expenses API routes
async function recalculateAllocation() {
  // 1. Get total generic expenses
  const totalExpenses = await db
    .select({ sum: sql`SUM(amount)` })
    .from(genericExpenses);
  
  // 2. Get active orders (not COMPLETED)
  const activeOrders = await db
    .select()
    .from(orders)
    .where(ne(orders.stageId, COMPLETED_STAGE_ID));
  
  // 3. Calculate allocation per order
  const allocationPerOrder = totalExpenses / activeOrders.length;
  
  // 4. Update all active orders
  for (const order of activeOrders) {
    const newNetProfit = 
      order.saleTotalExGst - 
      order.purchaseTotalExGst - 
      order.commission - 
      order.otherExpenses - 
      allocationPerOrder;
    
    await db.update(orders)
      .set({ 
        allocatedGenericExpenses: allocationPerOrder,
        netProfit: newNetProfit 
      })
      .where(eq(orders.id, order.id));
  }
}

// Call after expense CRUD operations
await recalculateAllocation();
```

---

#### Task 16: Expense Summary Reports
**Status**: Pending  
**Effort**: 4-5 hours  
**Dependencies**: Task 15

**What to Build:**
1. **Monthly Expense Summary**
   - Total expenses by month
   - Category-wise breakdown
   - Comparison with previous months

2. **Allocation Visualization**
   - Pie chart: Expenses by category
   - Bar chart: Monthly trend
   - Table: Allocation per order

3. **Export Functionality**
   - Export to Excel
   - Export to PDF
   - Include charts and tables

**Implementation:**
```typescript
// Add to expenses page
<Card>
  <CardHeader>
    <CardTitle>Monthly Summary</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Pie Chart - Category Breakdown */}
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={categoryData} dataKey="value" nameKey="name" />
      </PieChart>
    </ResponsiveContainer>
    
    {/* Bar Chart - Monthly Trend */}
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={monthlyData}>
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
    
    {/* Allocation Table */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Allocated Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(order => (
          <TableRow key={order.id}>
            <TableCell>{order.orderNumber}</TableCell>
            <TableCell>{formatCurrency(order.allocatedGenericExpenses)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

### Priority 3: Phase 7 - Document Management - 3 tasks

#### Task 22: Document Upload System
**Status**: Pending  
**Effort**: 6-8 hours  
**Dependencies**: File storage setup (S3/Cloudinary)

**What to Build:**
1. **File Upload Component**
   - Drag-and-drop interface
   - File type validation (PDF, images, docs)
   - File size validation (max 10MB)
   - Progress indicator
   - Multiple file upload

2. **Document Storage**
   - Upload to cloud storage (S3/Cloudinary)
   - Store metadata in `order_documents` table
   - Generate secure URLs

3. **Document List**
   - Show all uploaded documents
   - Document type badges
   - Upload date and user
   - Download button
   - Delete button (with confirmation)

**Implementation:**
```typescript
// 1. Upload component
<div className="border-2 border-dashed rounded-lg p-8">
  <input
    type="file"
    multiple
    accept=".pdf,.jpg,.png,.doc,.docx"
    onChange={handleFileSelect}
  />
  <p>Drag and drop files here or click to browse</p>
</div>

// 2. Upload handler
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  
  await fetch(`/api/orders/${orderId}/documents`, {
    method: 'POST',
    body: formData
  });
};

// 3. Document list
{documents.map(doc => (
  <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
    <div>
      <Badge>{doc.documentType}</Badge>
      <span>{doc.fileName}</span>
    </div>
    <div>
      <Button onClick={() => downloadDocument(doc.fileUrl)}>
        <Download />
      </Button>
      <Button onClick={() => deleteDocument(doc.id)}>
        <Trash2 />
      </Button>
    </div>
  </div>
))}
```

---

#### Task 23: Document Preview & Validation
**Status**: Pending  
**Effort**: 3-4 hours  
**Dependencies**: Task 22

**What to Build:**
1. **Document Preview**
   - PDF preview in modal
   - Image preview in modal
   - Document viewer component

2. **Validation**
   - File type checking
   - File size limits
   - Virus scanning (optional)
   - Duplicate detection

3. **Document Management**
   - Rename documents
   - Add descriptions
   - Tag documents
   - Search documents

---

#### Task 24: UI Polish & Error Handling
**Status**: Pending  
**Effort**: 4-6 hours  
**Dependencies**: All previous tasks

**What to Build:**
1. **Loading States**
   - Skeleton loaders for all pages
   - Spinner for async operations
   - Progress bars for uploads

2. **Error Handling**
   - Error boundaries
   - Toast notifications
   - Retry mechanisms
   - Fallback UI

3. **Form Validation**
   - Client-side validation
   - Error messages
   - Field highlighting
   - Validation feedback

4. **Performance**
   - Lazy loading
   - Code splitting
   - Image optimization
   - Caching strategies

---

### Priority 4: Phase 8 - Reports & Analytics - 2 tasks

#### Task 26: Reports Page
**Status**: Pending  
**Effort**: 8-10 hours  
**Dependencies**: All data collection complete

**What to Build:**
1. **Profit Analysis Report**
   - Total profit by period (daily/weekly/monthly/yearly)
   - Profit trend chart
   - Profit by customer
   - Profit by supplier
   - Profit by item category

2. **Performance Metrics**
   - Average order value
   - Average profit margin
   - Order completion rate
   - Payment collection rate
   - Supplier payment rate

3. **Stage Analysis**
   - Time spent in each stage
   - Bottleneck identification
   - SLA compliance rate
   - Stage-wise conversion rate

4. **Customer Analysis**
   - Top customers by revenue
   - Top customers by profit
   - Customer payment behavior
   - Repeat customer rate

5. **Supplier Analysis**
   - Top suppliers by volume
   - Supplier reliability score
   - Supplier payment terms
   - Supplier performance

**Page Structure:**
```typescript
<div className="space-y-6">
  {/* Report Filters */}
  <Card>
    <CardContent>
      <div className="flex gap-4">
        <DateRangePicker />
        <Select>Customer Filter</Select>
        <Select>Supplier Filter</Select>
        <Select>Stage Filter</Select>
      </div>
    </CardContent>
  </Card>
  
  {/* Summary Cards */}
  <div className="grid grid-cols-4 gap-4">
    <StatCard title="Total Revenue" value={totalRevenue} />
    <StatCard title="Total Profit" value={totalProfit} />
    <StatCard title="Avg Margin" value={avgMargin} />
    <StatCard title="Orders" value={orderCount} />
  </div>
  
  {/* Charts */}
  <Card>
    <CardHeader><CardTitle>Profit Trend</CardTitle></CardHeader>
    <CardContent>
      <LineChart data={profitTrend} />
    </CardContent>
  </Card>
  
  <div className="grid grid-cols-2 gap-4">
    <Card>
      <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
      <CardContent>
        <BarChart data={topCustomers} />
      </CardContent>
    </Card>
    
    <Card>
      <CardHeader><CardTitle>Stage Distribution</CardTitle></CardHeader>
      <CardContent>
        <PieChart data={stageDistribution} />
      </CardContent>
    </Card>
  </div>
  
  {/* Detailed Tables */}
  <Card>
    <CardHeader><CardTitle>Detailed Report</CardTitle></CardHeader>
    <CardContent>
      <DataTable data={detailedData} />
    </CardContent>
  </Card>
</div>
```

---

#### Task 27: Export Functionality
**Status**: Pending  
**Effort**: 4-5 hours  
**Dependencies**: Task 26

**What to Build:**
1. **Excel Export**
   - Export reports to Excel
   - Multiple sheets for different reports
   - Formatted cells
   - Charts included

2. **PDF Export**
   - Export reports to PDF
   - Professional formatting
   - Charts and tables
   - Company branding

3. **CSV Export**
   - Export raw data to CSV
   - For further analysis
   - Bulk data export

**Implementation:**
```typescript
// Excel export using xlsx library
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Total Revenue', totalRevenue],
    ['Total Profit', totalProfit],
    ['Avg Margin', avgMargin]
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
  
  // Detailed data sheet
  const ws2 = XLSX.utils.json_to_sheet(detailedData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Details');
  
  XLSX.writeFile(wb, 'report.xlsx');
};

// PDF export using jsPDF
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const exportToPDF = () => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Profit Analysis Report', 14, 20);
  
  // Add summary
  doc.setFontSize(12);
  doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 40);
  doc.text(`Total Profit: ${formatCurrency(totalProfit)}`, 14, 50);
  
  // Add table
  doc.autoTable({
    head: [['Order', 'Customer', 'Profit']],
    body: detailedData.map(row => [row.order, row.customer, row.profit])
  });
  
  doc.save('report.pdf');
};
```

---

## 🗓️ Suggested Timeline

### Week 1: Complete Phase 2 (Critical)
- **Days 1-2**: Stage transitions (Task 9)
- **Days 3-4**: Payment recording (Task 10)
- **Day 5**: Testing and bug fixes

### Week 2: Complete Phase 4
- **Days 1-2**: Expense allocation triggers (Task 15)
- **Days 3-5**: Expense summary reports (Task 16)

### Week 3: Phase 7 - Document Management
- **Days 1-3**: Document upload system (Task 22)
- **Days 4-5**: Document preview & validation (Task 23)

### Week 4: UI Polish & Phase 8 Start
- **Days 1-2**: UI polish & error handling (Task 24)
- **Days 3-5**: Start reports page (Task 26)

### Week 5: Complete Phase 8
- **Days 1-3**: Complete reports page (Task 26)
- **Days 4-5**: Export functionality (Task 27)

**Total Estimated Time**: 4-5 weeks

---

## 🔧 Technical Requirements

### Libraries to Add
```json
{
  "recharts": "^2.10.0",           // For charts
  "xlsx": "^0.18.5",               // Excel export
  "jspdf": "^2.5.1",               // PDF export
  "jspdf-autotable": "^3.8.0",    // PDF tables
  "react-dropzone": "^14.2.3",     // File upload
  "@aws-sdk/client-s3": "^3.0.0"   // S3 upload (if using AWS)
}
```

### Environment Variables
```bash
# File storage
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-1

# Or Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## ✅ Testing Checklist

### Phase 2 Testing
- [ ] Can transition order through all stages
- [ ] Stage history is recorded correctly
- [ ] Cannot skip stages
- [ ] Can record receivable payments
- [ ] Can record payable payments
- [ ] Payment status updates correctly
- [ ] Outstanding amounts calculate correctly

### Phase 4 Testing
- [ ] Expense allocation recalculates on expense add
- [ ] Expense allocation recalculates on expense update
- [ ] Expense allocation recalculates on expense delete
- [ ] Expense allocation recalculates on stage change
- [ ] Net profit updates correctly
- [ ] Reports show correct data
- [ ] Charts render correctly
- [ ] Export works for all formats

### Phase 7 Testing
- [ ] Can upload documents
- [ ] File validation works
- [ ] Documents display correctly
- [ ] Can preview PDFs
- [ ] Can preview images
- [ ] Can download documents
- [ ] Can delete documents
- [ ] Document search works

### Phase 8 Testing
- [ ] All reports show correct data
- [ ] Charts render correctly
- [ ] Filters work properly
- [ ] Excel export works
- [ ] PDF export works
- [ ] CSV export works
- [ ] Reports are performant

---

## 📝 Notes

- All API endpoints are already created and functional
- Database schema is complete
- Focus is on UI integration and polish
- Most work is frontend development
- Backend work is minimal (triggers, file upload)

---

**Ready to implement!** Start with Priority 1 tasks for immediate business value. 🚀