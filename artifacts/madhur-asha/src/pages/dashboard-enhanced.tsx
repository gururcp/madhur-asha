import { useState } from "react";
import { useGetDashboardStats, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
  Users, 
  Calculator, 
  TrendingUp, 
  ArrowRight, 
  ShoppingCart,
  AlertCircle,
  Clock,
  CheckCircle2,
  Package,
  IndianRupee,
  TrendingDown,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

// Mock data for orders pipeline and alerts - will be replaced with API calls
const mockPipeline = [
  { stage: "ENQUIRY", count: 2, value: "125000", color: "#94a3b8" },
  { stage: "SUPPLIER_FOUND", count: 1, value: "177000", color: "#60a5fa" },
  { stage: "QUOTED", count: 3, value: "450000", color: "#a78bfa" },
  { stage: "PO_RECEIVED", count: 1, value: "590000", color: "#34d399" },
  { stage: "DISPATCHED", count: 2, value: "380000", color: "#fbbf24" },
  { stage: "DELIVERED", count: 1, value: "295000", color: "#10b981" },
  { stage: "PAYMENT_DUE", count: 4, value: "1250000", color: "#f59e0b" },
  { stage: "PAYMENT_RECEIVED", count: 2, value: "680000", color: "#22c55e" },
  { stage: "SUPPLIER_PAID", count: 1, value: "295000", color: "#3b82f6" },
  { stage: "COMPLETED", count: 8, value: "2450000", color: "#059669" },
];

const mockAlerts = {
  overduePayments: [
    { id: 1, orderNumber: "MAE-2026-002", customer: "DEF Department", amount: "295000", daysOverdue: 15 },
    { id: 2, orderNumber: "MAE-2026-005", customer: "GHI Office", amount: "180000", daysOverdue: 8 },
  ],
  dueSoon: [
    { id: 3, orderNumber: "MAE-2026-001", customer: "ABC Government", amount: "590000", daysUntilDue: 3 },
  ],
  supplierDue: [
    { id: 4, orderNumber: "MAE-2026-003", supplier: "XYZ Traders", amount: "431000", daysUntilDue: 2 },
  ],
};

const mockRecentOrders = [
  {
    id: 1,
    orderNumber: "MAE-2026-001",
    itemDescription: "Laptop Dell Inspiron 15",
    customerName: "ABC Government Office",
    stage: "PO_RECEIVED",
    stageColor: "#34d399",
    saleTotalIncGst: "590000",
    netProfit: "45000",
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: 2,
    orderNumber: "MAE-2026-002",
    itemDescription: "Office Chairs Executive",
    customerName: "DEF Department",
    stage: "PAYMENT_DUE",
    stageColor: "#f59e0b",
    saleTotalIncGst: "295000",
    netProfit: "22000",
    createdAt: "2026-03-28T14:30:00Z",
  },
  {
    id: 3,
    orderNumber: "MAE-2026-003",
    itemDescription: "Printers HP LaserJet",
    customerName: "GHI Office",
    stage: "SUPPLIER_FOUND",
    stageColor: "#60a5fa",
    saleTotalIncGst: "177000",
    netProfit: "15000",
    createdAt: "2026-04-03T09:15:00Z",
  },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: user } = useGetMe();
  const [showAllPipeline, setShowAllPipeline] = useState(false);

  // Helper to format currency from string
  const formatAmount = (amount: string) => formatCurrency(parseFloat(amount));

  if (isLoading || !stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const visiblePipeline = showAllPipeline ? mockPipeline : mockPipeline.slice(0, 5);
  const totalAlerts = mockAlerts.overduePayments.length + mockAlerts.dueSoon.length + mockAlerts.supplierDue.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's your business overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders/new">
            <Button size="lg" className="rounded-xl">
              <ShoppingCart className="w-5 h-5 mr-2" />
              New Order
            </Button>
          </Link>
          <Link href="/calculator">
            <Button size="lg" variant="outline" className="rounded-xl">
              <Calculator className="w-5 h-5 mr-2" />
              Calculator
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Orders</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg"><ShoppingCart className="w-4 h-4 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">
              {mockPipeline.reduce((sum, stage) => sum + stage.count, 0) - mockPipeline[mockPipeline.length - 1].count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockPipeline[mockPipeline.length - 1].count} completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Profit (MTD)</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.netProfitMtd)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              After expense allocation
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Due</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg"><Clock className="w-4 h-4 text-orange-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-orange-600">
              {formatAmount("1250000")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              4 orders awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-4 h-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Alerts */}
      {totalAlerts > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Payment Alerts
                <Badge variant="destructive">{totalAlerts}</Badge>
              </CardTitle>
              <Link href="/orders?filter=payment-alerts">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overdue Payments */}
            {mockAlerts.overduePayments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Overdue Payments ({mockAlerts.overduePayments.length})
                </h4>
                <div className="space-y-2">
                  {mockAlerts.overduePayments.map(alert => (
                    <Link key={alert.id} href={`/orders/${alert.id}`}>
                      <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors cursor-pointer">
                        <div>
                          <p className="font-semibold">{alert.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{alert.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive">{formatAmount(alert.amount)}</p>
                          <p className="text-xs text-muted-foreground">{alert.daysOverdue} days overdue</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Due Soon */}
            {mockAlerts.dueSoon.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Due Soon ({mockAlerts.dueSoon.length})
                </h4>
                <div className="space-y-2">
                  {mockAlerts.dueSoon.map(alert => (
                    <Link key={alert.id} href={`/orders/${alert.id}`}>
                      <div className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg hover:bg-orange-500/20 transition-colors cursor-pointer">
                        <div>
                          <p className="font-semibold">{alert.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{alert.customer}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{formatAmount(alert.amount)}</p>
                          <p className="text-xs text-muted-foreground">Due in {alert.daysUntilDue} days</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Supplier Payments Due */}
            {mockAlerts.supplierDue.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-600 mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Supplier Payments Due ({mockAlerts.supplierDue.length})
                </h4>
                <div className="space-y-2">
                  {mockAlerts.supplierDue.map(alert => (
                    <Link key={alert.id} href={`/orders/${alert.id}`}>
                      <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors cursor-pointer">
                        <div>
                          <p className="font-semibold">{alert.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{alert.supplier}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatAmount(alert.amount)}</p>
                          <p className="text-xs text-muted-foreground">Due in {alert.daysUntilDue} days</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Orders Pipeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders Pipeline</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">
                View All Orders <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {visiblePipeline.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stage.color }}
                      />
                      <span className="font-medium text-sm">{stage.stage.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{stage.count}</Badge>
                    </div>
                    <span className="text-sm font-semibold">{formatAmount(stage.value)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${(stage.count / mockPipeline.reduce((sum, s) => sum + s.count, 0)) * 100}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!showAllPipeline && mockPipeline.length > 5 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => setShowAllPipeline(true)}
            >
              Show All Stages ({mockPipeline.length - 5} more)
            </Button>
          )}
          {showAllPipeline && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => setShowAllPipeline(false)}
            >
              Show Less
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Recent Orders</h2>
          {(user?.role === 'admin' || user?.role === 'customer_access') && (
            <Link href="/orders" className="text-primary hover:underline font-medium flex items-center text-sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {mockRecentOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No orders yet. Create your first order to get started.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/50">
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Order #</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Item</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Customer</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Stage</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Sale Value</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Net Profit</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <Link href={`/orders/${order.id}`}>
                            <span className="font-semibold hover:text-primary cursor-pointer">{order.orderNumber}</span>
                          </Link>
                        </td>
                        <td className="p-4 text-sm">{order.itemDescription}</td>
                        <td className="p-4">{order.customerName}</td>
                        <td className="p-4">
                          <Badge style={{ backgroundColor: order.stageColor }} className="text-white">
                            {order.stage.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-4 text-right text-emerald-600 font-semibold">{formatAmount(order.saleTotalIncGst)}</td>
                        <td className="p-4 text-right font-bold text-primary">{formatAmount(order.netProfit)}</td>
                        <td className="p-4 text-muted-foreground text-sm">{format(new Date(order.createdAt), 'dd MMM, yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {mockRecentOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-foreground">{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{order.itemDescription}</p>
                      </div>
                      <Badge style={{ backgroundColor: order.stageColor }} className="text-white text-xs">
                        {order.stage.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{order.customerName}</p>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sale Value</p>
                        <p className="text-sm font-semibold text-emerald-600">{formatAmount(order.saleTotalIncGst)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-primary font-bold mb-1">Net Profit</p>
                        <p className="text-base font-display font-bold text-primary">{formatAmount(order.netProfit)}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Made with Bob
