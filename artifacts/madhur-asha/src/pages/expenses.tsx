import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Pencil,
  Trash2,
  Receipt,
  TrendingUp,
  Calendar,
  IndianRupee,
  Car,
  Coffee,
  Building2,
  Zap,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Mock data - will be replaced with API calls
const mockExpenses = [
  {
    id: 1,
    description: "Petrol for delivery",
    amount: "2500",
    category: "Travel",
    expenseDate: "2026-04-03",
    paymentMethod: "Cash",
    receiptUrl: null,
    notes: "Delivery to ABC Office",
    createdAt: "2026-04-03T10:00:00Z",
  },
  {
    id: 2,
    description: "Team lunch meeting",
    amount: "1800",
    category: "Food",
    expenseDate: "2026-04-02",
    paymentMethod: "UPI",
    receiptUrl: null,
    notes: "Discussion with suppliers",
    createdAt: "2026-04-02T14:30:00Z",
  },
  {
    id: 3,
    description: "Office supplies",
    amount: "3200",
    category: "Office",
    expenseDate: "2026-04-01",
    paymentMethod: "Bank Transfer",
    receiptUrl: null,
    notes: "Stationery and printer ink",
    createdAt: "2026-04-01T09:15:00Z",
  },
  {
    id: 4,
    description: "Electricity bill",
    amount: "4500",
    category: "Utilities",
    expenseDate: "2026-03-31",
    paymentMethod: "Bank Transfer",
    receiptUrl: null,
    notes: "March 2026",
    createdAt: "2026-03-31T16:00:00Z",
  },
];

const mockSummary = {
  totalExpenses: 12000,
  activeOrderCount: 17,
  allocationPerOrder: 706,
  byCategory: [
    { category: "Travel", total: 2500, count: 1 },
    { category: "Food", total: 1800, count: 1 },
    { category: "Office", total: 3200, count: 1 },
    { category: "Utilities", total: 4500, count: 1 },
  ],
};

const categories = [
  { value: "Travel", label: "Travel", icon: Car, color: "bg-blue-500" },
  { value: "Food", label: "Food", icon: Coffee, color: "bg-orange-500" },
  { value: "Office", label: "Office", icon: Building2, color: "bg-purple-500" },
  { value: "Utilities", label: "Utilities", icon: Zap, color: "bg-yellow-500" },
  { value: "Misc", label: "Miscellaneous", icon: MoreHorizontal, color: "bg-gray-500" },
];

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    paymentMethod: "",
    receiptUrl: "",
    notes: "",
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : Receipt;
  };

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : "bg-gray-500";
  };

  const filteredExpenses = mockExpenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(search.toLowerCase()) ||
      expense.notes?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = () => {
    if (!formData.description || !formData.amount || !formData.category || !formData.expenseDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      toast.success("Expense updated successfully");
    } else {
      toast.success("Expense added successfully");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      expenseDate: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "",
      receiptUrl: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleEdit = (expense: typeof mockExpenses[0]) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
      paymentMethod: expense.paymentMethod || "",
      receiptUrl: expense.receiptUrl || "",
      notes: expense.notes || "",
    });
    setEditingId(expense.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      toast.success("Expense deleted successfully");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Generic Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track business expenses and see allocation across orders
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-5 w-5" />
          Add Expense
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses (MTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockSummary.totalExpenses.toString())}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSummary.activeOrderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Receiving allocation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Per Order Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockSummary.allocationPerOrder.toString())}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Auto-calculated
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSummary.byCategory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown by Category</CardTitle>
          <CardDescription>See how expenses are distributed across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSummary.byCategory.map((cat) => {
              const Icon = getCategoryIcon(cat.category);
              const percentage = (cat.total / mockSummary.totalExpenses) * 100;
              
              return (
                <div key={cat.category} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(cat.category)}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{cat.category}</span>
                        <Badge variant="secondary">{cat.count}</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatCurrency(cat.total.toString())}</span>
                        <span className="text-xs text-muted-foreground ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getCategoryColor(cat.category)} transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Allocation Details */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Allocation to Active Orders</CardTitle>
          <CardDescription>
            Generic expenses are equally distributed across {mockSummary.activeOrderCount} active orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Allocation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Generic Expenses</p>
                <p className="text-2xl font-bold">{formatCurrency(mockSummary.totalExpenses.toString())}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{mockSummary.activeOrderCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allocation Per Order</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(mockSummary.allocationPerOrder.toString())}</p>
              </div>
            </div>

            {/* Allocation Formula */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">How Allocation Works</h4>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                All generic expenses are divided equally among active orders (excluding COMPLETED stage).
                Each order's net profit is automatically adjusted when expenses change or orders complete.
              </p>
              <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-800">
                <code className="text-xs font-mono">
                  Allocation Per Order = Total Generic Expenses ÷ Active Order Count
                  <br />
                  Net Profit = Sale - Purchase - Commission - Other Expenses - Allocated Generic Expenses
                </code>
              </div>
            </div>

            {/* Sample Orders Receiving Allocation */}
            <div>
              <h4 className="font-semibold mb-3">Sample Orders Receiving Allocation</h4>
              <div className="space-y-2">
                {[
                  { orderNumber: "MAE-2026-001", customer: "ABC Govt Office", stage: "PO Received" },
                  { orderNumber: "MAE-2026-002", customer: "XYZ Department", stage: "Dispatched" },
                  { orderNumber: "MAE-2026-003", customer: "DEF Ministry", stage: "Payment Due" },
                ].map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{order.stage}</Badge>
                      <p className="text-sm font-semibold mt-1">{formatCurrency(mockSummary.allocationPerOrder.toString())}</p>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <p className="text-sm text-muted-foreground">
                    + {mockSummary.activeOrderCount - 3} more orders receiving allocation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {search || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Add your first expense to get started"}
              </p>
              {!search && categoryFilter === "all" && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const Icon = getCategoryIcon(expense.category);
                
                return (
                  <div key={expense.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-3 rounded-lg ${getCategoryColor(expense.category)}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{expense.description}</h4>
                          <p className="text-sm text-muted-foreground truncate">{expense.notes}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(expense.expenseDate), "MMM dd, yyyy")}
                            </span>
                            {expense.paymentMethod && (
                              <span>• {expense.paymentMethod}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(expense.amount)}</div>
                          <Badge variant="secondary" className="mt-1">
                            {expense.category}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(expense.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update expense details" : "Add a new business expense"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Description *</Label>
            <Input
              placeholder="e.g., Petrol for delivery"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Amount *</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional details (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? "Update" : "Add"} Expense
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob
