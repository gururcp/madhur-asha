import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, DollarSign, Package, Users, Calendar } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data - Replace with actual API calls
const monthlyRevenueData = [
  { month: "Jan", revenue: 450000, profit: 85000, expenses: 365000 },
  { month: "Feb", revenue: 520000, profit: 95000, expenses: 425000 },
  { month: "Mar", revenue: 480000, profit: 88000, expenses: 392000 },
  { month: "Apr", revenue: 610000, profit: 115000, expenses: 495000 },
  { month: "May", revenue: 580000, profit: 105000, expenses: 475000 },
  { month: "Jun", revenue: 650000, profit: 125000, expenses: 525000 },
];

const ordersByStageData = [
  { stage: "Enquiry", count: 12, value: 450000 },
  { stage: "Quoted", count: 8, value: 320000 },
  { stage: "PO Received", count: 5, value: 280000 },
  { stage: "Dispatched", count: 3, value: 150000 },
  { stage: "Delivered", count: 7, value: 380000 },
  { stage: "Payment Due", count: 4, value: 220000 },
  { stage: "Completed", count: 15, value: 850000 },
];

const topCustomersData = [
  { name: "PWD Maharashtra", orders: 15, revenue: 850000, profit: 125000 },
  { name: "MSEDCL", orders: 12, revenue: 720000, profit: 98000 },
  { name: "Zilla Parishad", orders: 10, revenue: 580000, profit: 85000 },
  { name: "Municipal Corp", orders: 8, revenue: 450000, profit: 65000 },
  { name: "Forest Dept", orders: 6, revenue: 320000, profit: 48000 },
];

const topSuppliersData = [
  { name: "ABC Traders", orders: 18, amount: 650000, onTime: 95 },
  { name: "XYZ Suppliers", orders: 15, amount: 520000, onTime: 88 },
  { name: "PQR Industries", orders: 12, amount: 480000, onTime: 92 },
  { name: "LMN Enterprises", orders: 10, amount: 380000, onTime: 85 },
  { name: "DEF Corporation", orders: 8, amount: 290000, onTime: 90 },
];

const expenseCategoryData = [
  { category: "Petrol", amount: 45000, percentage: 25 },
  { category: "Lunch", amount: 28000, percentage: 15 },
  { category: "Transport", amount: 52000, percentage: 29 },
  { category: "Office", amount: 35000, percentage: 19 },
  { category: "Misc", amount: 22000, percentage: 12 },
];

const paymentTrendData = [
  { month: "Jan", received: 420000, pending: 85000, overdue: 15000 },
  { month: "Feb", received: 480000, pending: 95000, overdue: 22000 },
  { month: "Mar", received: 450000, pending: 88000, overdue: 18000 },
  { month: "Apr", received: 580000, pending: 105000, overdue: 25000 },
  { month: "May", received: 520000, pending: 98000, overdue: 20000 },
  { month: "Jun", received: 610000, pending: 115000, overdue: 28000 },
];

const commissionTrendData = [
  { month: "Jan", commission: 22500, revenue: 450000, grossProfit: 85000, percentage: 5.0 },
  { month: "Feb", commission: 26000, revenue: 520000, grossProfit: 95000, percentage: 5.0 },
  { month: "Mar", commission: 24000, revenue: 480000, grossProfit: 88000, percentage: 5.0 },
  { month: "Apr", commission: 30500, revenue: 610000, grossProfit: 115000, percentage: 5.0 },
  { month: "May", commission: 29000, revenue: 580000, grossProfit: 105000, percentage: 5.0 },
  { month: "Jun", commission: 32500, revenue: 650000, grossProfit: 125000, percentage: 5.0 },
];

const commissionByCustomerData = [
  { customer: "PWD Maharashtra", commission: 42500, orders: 15, avgCommission: 2833, percentage: 5.0 },
  { customer: "MSEDCL", commission: 36000, orders: 12, avgCommission: 3000, percentage: 5.0 },
  { customer: "Zilla Parishad", commission: 29000, orders: 10, avgCommission: 2900, percentage: 5.0 },
  { customer: "Municipal Corp", commission: 22500, orders: 8, avgCommission: 2813, percentage: 5.0 },
  { customer: "Forest Dept", commission: 16000, orders: 6, avgCommission: 2667, percentage: 5.0 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658"];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-IN").format(value);
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6months");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹32,90,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12.5%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹6,13,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+8.2%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">39</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              <span className="text-red-500">-3</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹84,359</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5.1%</span> from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue & Profit</TabsTrigger>
          <TabsTrigger value="orders">Orders Analysis</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
          <TabsTrigger value="payments">Payment Trends</TabsTrigger>
          <TabsTrigger value="commission">Commission Analysis</TabsTrigger>
        </TabsList>

        {/* Revenue & Profit Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Profit Trend</CardTitle>
              <CardDescription>Monthly revenue and profit comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stackId="2"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profit Margin Trend</CardTitle>
                <CardDescription>Monthly profit margin percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={(data) => ((data.profit / data.revenue) * 100).toFixed(1)}
                      stroke="#8884d8"
                      name="Profit Margin %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Ratio</CardTitle>
                <CardDescription>Expenses as percentage of revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={(data) => ((data.expenses / data.revenue) * 100).toFixed(1)}
                      stroke="#ff8042"
                      name="Expense Ratio %"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Analysis Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Orders by Stage</CardTitle>
                <CardDescription>Distribution of orders across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={ordersByStageData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ stage, count }) => `${stage}: ${count}`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {ordersByStageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Value by Stage</CardTitle>
                <CardDescription>Total value of orders in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={ordersByStageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#8884d8" name="Order Value" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Customers by Revenue</CardTitle>
              <CardDescription>Highest revenue generating customers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topCustomersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}K`} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Performance Metrics</CardTitle>
              <CardDescription>Detailed customer statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomersData.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3">
                    <div className="space-y-1">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {customer.orders} orders • Avg: {formatCurrency(customer.revenue / customer.orders)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(customer.revenue)}</p>
                      <p className="text-sm text-green-600">
                        Profit: {formatCurrency(customer.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplier Performance Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Suppliers by Volume</CardTitle>
              <CardDescription>Most frequently used suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topSuppliersData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" tickFormatter={(value) => `₹${value / 1000}K`} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="amount" fill="#8884d8" name="Purchase Amount" />
                  <Bar yAxisId="right" dataKey="orders" fill="#82ca9d" name="Order Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier On-Time Delivery</CardTitle>
              <CardDescription>Delivery performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topSuppliersData.map((supplier, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{supplier.name}</span>
                      <span className="text-sm font-bold">{supplier.onTime}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          supplier.onTime >= 90
                            ? "bg-green-500"
                            : supplier.onTime >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${supplier.onTime}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {supplier.orders} orders • {formatCurrency(supplier.amount)} total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expense Breakdown Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category}: ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category-wise Expenses</CardTitle>
                <CardDescription>Detailed expense breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {expenseCategoryData.map((expense, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{expense.category}</span>
                        <span className="font-bold">{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${expense.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{expense.percentage}% of total</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Trends Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Collection Trend</CardTitle>
              <CardDescription>Monthly payment received, pending, and overdue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={paymentTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="received" stackId="a" fill="#82ca9d" name="Received" />
                  <Bar dataKey="pending" stackId="a" fill="#8884d8" name="Pending" />
                  <Bar dataKey="overdue" stackId="a" fill="#ff8042" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Collection Rate</CardTitle>
                <CardDescription>Average payment collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">92.5%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  On-time payment collection rate
                </p>

        {/* Commission Analysis Tab */}
        <TabsContent value="commission" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission Trend</CardTitle>
              <CardDescription>Monthly commission earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={commissionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Commission"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPerOrder"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    name="Avg per Order"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Commission</CardTitle>
                <CardDescription>Current period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">₹2,45,000</div>
                <p className="text-sm text-muted-foreground mt-2">
                  From 28 completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>As % of Revenue</CardTitle>
                <CardDescription>Commission ratio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">7.45%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Of total sale value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>As % of Gross Profit</CardTitle>
                <CardDescription>Commission efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600">52.3%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Of gross profit margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg per Order</CardTitle>
                <CardDescription>Average commission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">₹8,750</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Per completed order
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission by Customer</CardTitle>
              <CardDescription>Top commission-generating customers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={commissionByCustomerData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${value / 1000}K`} />
                  <YAxis dataKey="customer" type="category" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="commission" fill="#8b5cf6" name="Commission" />
                  <Bar dataKey="orders" fill="#06b6d4" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Commission Efficiency</CardTitle>
                <CardDescription>Commission vs Net Profit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Commission</span>
                    <span className="text-sm font-bold text-purple-600">₹2,45,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Net Profit (after commission)</span>
                    <span className="text-sm font-bold text-green-600">₹2,23,500</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Commission Impact</span>
                    <span className="text-sm font-bold text-orange-600">52.3% of gross</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    💡 Commission is calculated on Sale Price (Ex-GST) to minimize costs
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Breakdown</CardTitle>
                <CardDescription>By order value range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">₹0 - ₹50K</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-sm font-medium">₹61,250</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">₹50K - ₹1L</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '40%' }}></div>
                      </div>
                      <span className="text-sm font-medium">₹98,000</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">₹1L - ₹2L</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm font-medium">₹85,750</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg. Collection Days</CardTitle>
                <CardDescription>Days to receive payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">18 days</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Average time from invoice to payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outstanding Amount</CardTitle>
                <CardDescription>Total pending payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">₹5,86,000</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Across 12 pending invoices
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Made with Bob
