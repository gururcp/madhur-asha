import { useParams } from "wouter";
import { useGetCustomer, useListCalculations } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Hash, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = parseInt(id || "0");
  
  const { data: customer, isLoading: customerLoading } = useGetCustomer(customerId);
  const { data: calculations, isLoading: calcsLoading } = useListCalculations({ customerId });

  if (customerLoading || !customer) return <div className="p-8 animate-pulse text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header Profile */}
      <div className="bg-card rounded-3xl p-8 border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Building2 className="w-12 h-12" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-display font-bold text-foreground mb-2">{customer.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              {customer.gstin && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <Hash className="w-4 h-4 mr-2 text-primary" /> 
                  <span className="font-mono font-medium">{customer.gstin}</span>
                </div>
              )}
              {customer.contact && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <Phone className="w-4 h-4 mr-2 text-primary" /> {customer.contact}
                </div>
              )}
              {customer.address && (
                <div className="flex items-center text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
                  <MapPin className="w-4 h-4 mr-2 text-primary" /> {customer.address}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-display font-bold mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-primary" />
          Calculation History
          <Badge variant="secondary" className="ml-3 text-sm">{calculations?.length || 0}</Badge>
        </h2>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
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
                {calcsLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading calculations...</td></tr>
                ) : calculations?.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No calculations found for this customer.</td></tr>
                ) : (
                  calculations?.map((calc) => (
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
