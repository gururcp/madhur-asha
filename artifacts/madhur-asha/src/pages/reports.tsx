import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  IndianRupee,
  Package,
  Users,
  Building2,
  PieChart,
  BarChart3,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format } from "date-fns";

// Mock data - will be replaced with API calls
const mockReportData = {
  summary: {
    totalRevenue: 4850000,
    totalCost: 3920000,
    totalProfit: 930000,
    profitMargin: 19.2,
    activeOrders: 17,
    completedOrders: 23,
    totalOrders: 40,
  },
  monthlyTrend: [
    { month: "Oct 2025", revenue: 1200000, cost: 980000, profit: 220000 },
    { month: "Nov 2025", revenue: 1450000, cost: 1180000, profit: 270000 },
    { month: "Dec 2025", revenue: 1380000, cost: 1120000, profit: 260000 },
    { month: "Jan 2026", revenue: 1620000, cost: 1310000, profit: 310000 },
    { month: "Feb 2026", revenue: 1580000, cost: 1280000, profit: 300000 },
    { month: "Mar 2026", revenue: 1720000, cost: 1390000, profit: 330000 },
  ],
  topCustomers: [
    { name: "ABC Government Office", orders: 8, revenue: 1250000, profit: 245000 },
    { name: "XYZ Department", orders: 6, revenue: 980000, profit: 192000 },
    { name: "DEF Ministry", orders: 5, revenue: 850000, profit: 168000 },
    { name: "GHI Corporation", orders: 4, revenue: 720000, profit: 142000 },
  ],
  topSuppliers: [
    { name: "Tech Suppliers Ltd", orders: 12, cost: 1450000, savings: 85000 },
    { name: "Office Mart", orders: 9, cost: 1120000, savings: 62000 },
    { name: "Electronics Hub", orders: 8, cost: 980000, savings: 54000 },
    { name: "Stationery World", orders: 6, cost: 720000, savings: 38000 },
  ],
  profitByCategory: [
    { category: "Electronics", orders: 15, profit: 425000, margin: 21.5 },
    { category: "Office Supplies", orders: 12, profit: 285000, margin: 18.2 },
    { category: "Furniture", orders: 8, profit: 220000, margin: 16.8 },
    { category: "IT Equipment", orders: 5, profit: 180000, margin: 19.4 },
  ],
  expenseAllocation: {
    totalGenericExpenses: 145000,
    activeOrders: 17,
    allocationPerOrder: 8529,
    breakdown: [
      { category: "Travel", amount: 45000, percentage: 31 },
      { category: "Food", amount: 28000, percentage: 19 },
      { category: "Office", amount: 38000, percentage: 26 },
      { category: "Utilities", amount: 34000, percentage: 24 },
    ],
  },
};

export default function ReportsPage() {
  const [period, setPeriod] = useState("last-6-months");
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    // TODO: Implement export functionality
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive business insights and profit analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('excel')}>
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockReportData.summary.totalRevenue)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.5% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mockReportData.summary.totalCost)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8.3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(mockReportData.summary.totalProfit)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+18.2% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(mockReportData.summary.profitMargin)}</div>
            <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+2.1% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-analysis">Profit Analysis</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Top Suppliers</TabsTrigger>
          <TabsTrigger value="expenses">Expense Allocation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Performance Trend
              </CardTitle>
              <CardDescription>Revenue, cost, and profit over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.monthlyTrend.map((month, index) => {
                  const profitMargin = (month.profit / month.revenue) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{month.month}</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Revenue: </span>
                            <span className="font-semibold">{formatCurrency(month.revenue)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cost: </span>
                            <span className="font-semibold">{formatCurrency(month.cost)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Profit: </span>
                            <span className="font-semibold text-primary">{formatCurrency(month.profit)}</span>
                          </div>
                          <Badge variant="secondary">{formatPercentage(profitMargin)}</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${profitMargin}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Order Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{mockReportData.summary.totalOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{mockReportData.summary.activeOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{mockReportData.summary.completedOrders}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully delivered</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit Analysis Tab */}
        <TabsContent value="profit-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profit by Category</CardTitle>
              <CardDescription>Performance breakdown by product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReportData.profitByCategory.map((cat, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{cat.category}</h4>
                          <p className="text-sm text-muted-foreground">{cat.orders} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{formatCurrency(cat.profit)}</p>
                          <Badge variant="secondary">{formatPercentage(cat.margin)} margin</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${cat.margin}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Performing Customers
              </CardTitle>
              <CardDescription>Customers generating the highest revenue and profit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockReportData.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{customer.name}</h4>
                      <p className="text-sm text-muted-foreground">{customer.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(customer.revenue)}</p>
                      <p className="text-sm text-primary">Profit: {formatCurrency(customer.profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Top Suppliers
              </CardTitle>
              <CardDescription>Most reliable suppliers with best pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockReportData.topSuppliers.map((supplier, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 font-bold">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{supplier.name}</h4>
                      <p className="text-sm text-muted-foreground">{supplier.orders} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(supplier.cost)}</p>
                      <p className="text-sm text-green-600">Saved: {formatCurrency(supplier.savings)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Allocation Tab */}
        <TabsContent value="expenses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generic Expense Allocation Impact</CardTitle>
              <CardDescription>How generic expenses affect order profitability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Allocation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Generic Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(mockReportData.expenseAllocation.totalGenericExpenses)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold">{mockReportData.expenseAllocation.activeOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allocation Per Order</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(mockReportData.expenseAllocation.allocationPerOrder)}</p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h4 className="font-semibold mb-3">Expense Category Breakdown</h4>
                <div className="space-y-3">
                  {mockReportData.expenseAllocation.breakdown.map((cat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.category}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">{formatCurrency(cat.amount)}</span>
                          <Badge variant="secondary">{cat.percentage}%</Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Impact on Net Profit</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Each active order's net profit is reduced by {formatCurrency(mockReportData.expenseAllocation.allocationPerOrder)} 
                  due to generic expense allocation. This ensures accurate profitability tracking across all orders.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Made with Bob