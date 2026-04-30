import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { 
  FileText, 
  ArrowDownToLine, 
  ArrowUpToLine, 
  Briefcase, 
  Search,
  Filter,
  Calendar,
  TrendingUp,
  Package,
  Eye,
  Download
} from "lucide-react";
import { useLocation } from "wouter";

// Mock data - will be replaced with API calls
const mockOrders = [
  {
    id: 1,
    orderNumber: "MAE-2026-001",
    stage: "COMPLETED",
    stageColor: "#6366f1",
    itemDescription: "Office Furniture Set",
    quantity: 10,
    unit: "Sets",
    customerName: "ABC Government Office",
    supplierName: "XYZ Furniture Ltd",
    purchaseExGst: 450000,
    saleExGst: 520000,
    commission: 15000,
    otherExpenses: 8000,
    netProfit: 47000,
    createdAt: "2026-03-15T10:00:00Z",
    completedAt: "2026-04-01T16:30:00Z",
  },
  {
    id: 2,
    orderNumber: "MAE-2026-002",
    stage: "PAYMENT_RECEIVED",
    stageColor: "#22c55e",
    itemDescription: "Computer Systems",
    quantity: 25,
    unit: "Units",
    customerName: "DEF Department",
    supplierName: "Tech Solutions Inc",
    purchaseExGst: 1250000,
    saleExGst: 1420000,
    commission: 45000,
    otherExpenses: 12000,
    netProfit: 113000,
    createdAt: "2026-03-20T09:15:00Z",
    completedAt: null,
  },
  {
    id: 3,
    orderNumber: "MAE-2026-003",
    stage: "COMPLETED",
    stageColor: "#6366f1",
    itemDescription: "Air Conditioners",
    quantity: 15,
    unit: "Units",
    customerName: "GHI Office Complex",
    supplierName: "Cool Air Systems",
    purchaseExGst: 675000,
    saleExGst: 780000,
    commission: 28000,
    otherExpenses: 15000,
    netProfit: 62000,
    createdAt: "2026-02-28T14:20:00Z",
    completedAt: "2026-03-25T11:45:00Z",
  },
];

const stageColors: Record<string, string> = {
  ENQUIRY: "#3b82f6",
  SUPPLIER_FOUND: "#8b5cf6",
  QUOTED: "#06b6d4",
  PO_RECEIVED: "#10b981",
  DISPATCHED: "#f59e0b",
  DELIVERED: "#14b8a6",
  PAYMENT_DUE: "#f97316",
  PAYMENT_RECEIVED: "#22c55e",
  SUPPLIER_PAID: "#84cc16",
  COMPLETED: "#6366f1",
};

export default function HistoryPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStage = stageFilter === "all" || order.stage === stageFilter;
    
    // Date filter logic (simplified for now)
    const matchesDate = dateFilter === "all" || true; // Implement date range logic
    
    return matchesSearch && matchesStage && matchesDate;
  });

  const totalProfit = filteredOrders.reduce((sum, order) => sum + order.netProfit, 0);
  const totalOrders = filteredOrders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order History</h1>
          <p className="text-muted-foreground mt-1">
            Complete record of all orders and their financial performance
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold mt-1">{totalOrders}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalProfit)}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Profit/Order</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(totalProfit / (totalOrders || 1))}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, item, customer, or supplier..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Stage Filter */}
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PAYMENT_RECEIVED">Payment Received</SelectItem>
                <SelectItem value="SUPPLIER_PAID">Supplier Paid</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_quarter">This Quarter</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {search || stageFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Orders will appear here once they are completed"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setLocation(`/orders/${order.id}`)}>
              <CardContent className="p-6">
                {/* Top row */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge 
                    variant="secondary" 
                    className="font-mono text-xs"
                    style={{ 
                      backgroundColor: `${order.stageColor}20`,
                      color: order.stageColor,
                      borderColor: `${order.stageColor}40`
                    }}
                  >
                    {order.orderNumber}
                  </Badge>
                  <Badge variant="outline">
                    {order.stage.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.createdAt), 'dd MMM, yyyy')}
                  </span>
                  {order.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      → Completed {format(new Date(order.completedAt), 'dd MMM, yyyy')}
                    </span>
                  )}
                </div>

                {/* Item & Parties */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {order.itemDescription}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({order.quantity} {order.unit})
                    </span>
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      <span className="font-medium">Customer:</span>
                      <span>{order.customerName}</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5">
                      <ArrowDownToLine className="h-4 w-4" />
                      <span className="font-medium">Supplier:</span>
                      <span>{order.supplierName}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      Purchase
                    </div>
                    <div className="font-semibold text-destructive">
                      {formatCurrency(order.purchaseExGst)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      Sale
                    </div>
                    <div className="font-semibold text-emerald-600">
                      {formatCurrency(order.saleExGst)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      Commission
                    </div>
                    <div className="font-semibold text-amber-600">
                      {formatCurrency(order.commission)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                      Expenses
                    </div>
                    <div className="font-semibold text-orange-600">
                      {formatCurrency(order.otherExpenses)}
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-3">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">
                      Net Profit
                    </div>
                    <div className="text-xl font-display font-bold text-foreground">
                      {formatCurrency(order.netProfit)}
                    </div>
                  </div>
                </div>

                {/* View Button */}
                <div className="mt-4 flex justify-end">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Made with Bob
