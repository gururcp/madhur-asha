import { useGetDashboardStats, useGetMe } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Users, Calculator, TrendingUp, ArrowRight, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: user } = useGetMe();

  if (isLoading || !stats) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Welcome back, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here is today's business overview.</p>
        </div>
        <Link href="/calculator">
          <Button size="lg" className="rounded-xl w-full sm:w-auto">
            <Calculator className="w-5 h-5 mr-2" />
            New Calculation
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg"><Users className="w-4 h-4 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{stats.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calculations (Month)</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Calculator className="w-4 h-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{stats.totalCalculations}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Calculations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold">Recent Calculations</h2>
          {(user?.role === 'admin' || user?.role === 'customer_access') && (
            <Link href="/history" className="text-primary hover:underline font-medium flex items-center text-sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>

        {stats.recentCalculations.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No calculations yet. Start by using the Calculator.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
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
                    {stats.recentCalculations.map((calc) => (
                      <tr key={calc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{format(new Date(calc.date), 'dd MMM, yyyy')}</td>
                        <td className="p-4">{calc.customerName || calc.label || '-'}</td>
                        <td className="p-4 text-muted-foreground text-sm">{calc.billNumber || '-'}</td>
                        <td className="p-4 text-right text-destructive">{formatCurrency(calc.result.purchaseExGst)}</td>
                        <td className="p-4 text-right text-emerald-600">{formatCurrency(calc.result.saleExGst)}</td>
                        <td className="p-4 text-right font-bold text-primary">{formatCurrency(calc.result.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {stats.recentCalculations.map((calc) => (
                <div key={calc.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-foreground">{calc.customerName || calc.label || 'Unnamed'}</p>
                      {calc.billNumber && <p className="text-xs font-mono text-muted-foreground mt-0.5">{calc.billNumber}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(calc.date), 'dd MMM, yy')}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <ArrowDownToLine className="w-3 h-3 text-destructive" /> Buy
                      </div>
                      <p className="text-sm font-semibold text-destructive">{formatCurrency(calc.result.purchaseExGst)}</p>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <ArrowUpToLine className="w-3 h-3 text-emerald-600" /> Sell
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(calc.result.saleExGst)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary font-bold mb-1">Net Profit</p>
                      <p className="text-base font-display font-bold text-primary">{formatCurrency(calc.result.netProfit)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
