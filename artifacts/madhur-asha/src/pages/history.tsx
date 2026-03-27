import { useListCalculations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, ArrowDownToLine, ArrowUpToLine, Briefcase } from "lucide-react";

export default function HistoryPage() {
  const { data: calculations, isLoading } = useListCalculations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Calculation History</h1>
        <p className="text-muted-foreground">All saved GST profit calculations across all customers.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading history...</div>
        ) : calculations?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No calculations saved yet. Go to Calculator to create one.
          </div>
        ) : (
          calculations?.map((calc) => (
            <Card key={calc.id} className="p-0 overflow-hidden hover:border-primary/50 transition-colors group">
              <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                
                {/* Left: Info */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>{format(new Date(calc.date), 'dd MMM, yyyy')}</span>
                    {calc.billNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono bg-muted px-2 py-0.5 rounded">{calc.billNumber}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground leading-tight">
                    {calc.label || 'Unnamed Calculation'}
                  </h3>
                  <div className="flex items-center text-muted-foreground font-medium text-sm mt-1">
                    <Briefcase className="w-4 h-4 mr-1.5" />
                    {calc.customerName || 'No Customer Assigned'}
                  </div>
                </div>

                {/* Right: Numbers Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 w-full md:w-auto bg-muted/20 p-4 rounded-xl border border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center mb-1">
                      <ArrowDownToLine className="w-3 h-3 mr-1 text-destructive" /> Purchase
                    </div>
                    <div className="font-medium text-destructive">{formatCurrency(calc.result.purchaseExGst)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center mb-1">
                      <ArrowUpToLine className="w-3 h-3 mr-1 text-emerald-600" /> Sale
                    </div>
                    <div className="font-medium text-emerald-600">{formatCurrency(calc.result.saleExGst)}</div>
                  </div>
                  <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-border/50 pt-3 md:pt-0 md:pl-6">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Net Profit</div>
                    <div className="text-2xl font-display font-bold text-foreground">
                      {formatCurrency(calc.result.netProfit)}
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
