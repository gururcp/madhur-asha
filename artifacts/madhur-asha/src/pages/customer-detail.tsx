import { useParams } from "wouter";
import { useGetCustomer, useListCalculations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Hash, FileText, ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = parseInt(id || "0");

  const { data: customer, isLoading: customerLoading } = useGetCustomer(customerId);
  const { data: calculations, isLoading: calcsLoading } = useListCalculations({ customerId });

  if (customerLoading || !customer) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-3xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-5 items-start relative z-10">
          <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20 shrink-0">
            <Building2 className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-3 break-words">{customer.name}</h1>
            <div className="flex flex-wrap gap-2">
              {customer.gstin && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 text-sm">
                  <Hash className="w-3.5 h-3.5 mr-2 text-primary" />
                  <span className="font-mono font-medium">{customer.gstin}</span>
                </div>
              )}
              {customer.contact && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 text-sm">
                  <Phone className="w-3.5 h-3.5 mr-2 text-primary" /> {customer.contact}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 text-sm">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-primary" /> {customer.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculations */}
      <div>
        <h2 className="text-xl font-display font-bold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary" />
          Calculation History
          <Badge variant="secondary" className="ml-3 text-sm">{calculations?.length || 0}</Badge>
        </h2>

        {calcsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : calculations?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No calculations for this customer yet.
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
                      <th className="p-4 font-semibold text-sm text-muted-foreground">Label / Ref</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Purchase (Ex GST)</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Sale (Ex GST)</th>
                      <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.map((calc) => (
                      <tr key={calc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{format(new Date(calc.date), 'dd MMM, yyyy')}</td>
                        <td className="p-4">
                          <div className="font-bold">{calc.label || 'Unnamed'}</div>
                          <div className="text-xs text-muted-foreground font-mono">{calc.billNumber}</div>
                        </td>
                        <td className="p-4 text-right text-destructive">{formatCurrency(calc.result.purchaseExGst)}</td>
                        <td className="p-4 text-right text-emerald-600">{formatCurrency(calc.result.saleExGst)}</td>
                        <td className="p-4 text-right font-bold text-primary text-lg">{formatCurrency(calc.result.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {calculations.map((calc) => (
                <div key={calc.id} className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-foreground">{calc.label || 'Unnamed'}</p>
                      {calc.billNumber && <p className="text-xs font-mono text-muted-foreground mt-0.5">{calc.billNumber}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(calc.date), 'dd MMM, yy')}</p>
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
                      <p className="text-xs text-primary font-bold mb-1">Profit</p>
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
