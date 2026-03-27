import { useGetDashboardStats, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, Calculator, TrendingUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: user } = useGetMe();

  if (isLoading || !stats) return <div className="p-8"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here is the overview of your business today.</p>
        </div>
        <Link href="/calculator">
          <Button size="lg" className="rounded-xl">
            <Calculator className="w-5 h-5 mr-2" />
            New Calculation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-5 h-5 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calculations (This Month)</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Calculator className="w-5 h-5 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{stats.totalCalculations}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Profit (MTD)</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.netProfitMtd)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">Recent Calculations</h2>
          {(user?.role === 'admin' || user?.role === 'customer_access') && (
            <Link href="/history" className="text-primary hover:underline font-medium flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
        
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Date</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Customer</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground">Reference</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Purchase (Ex GST)</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Sale (Ex GST)</th>
                  <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCalculations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No recent calculations</td>
                  </tr>
                ) : (
                  stats.recentCalculations.map((calc) => (
                    <tr key={calc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{format(new Date(calc.date), 'dd MMM, yyyy')}</td>
                      <td className="p-4">{calc.customerName || calc.label || '-'}</td>
                      <td className="p-4 text-muted-foreground text-sm">{calc.billNumber || '-'}</td>
                      <td className="p-4 text-right text-destructive">{formatCurrency(calc.result.purchaseExGst)}</td>
                      <td className="p-4 text-right text-emerald-600">{formatCurrency(calc.result.saleExGst)}</td>
                      <td className="p-4 text-right font-bold text-primary">{formatCurrency(calc.result.netProfit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
