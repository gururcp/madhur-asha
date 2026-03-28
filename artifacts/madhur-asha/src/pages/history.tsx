import { useListCalculations } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, ArrowDownToLine, ArrowUpToLine, Briefcase } from "lucide-react";

export default function HistoryPage() {
  const { data: calculations, isLoading } = useListCalculations();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Calculation History</h1>
        <p className="text-muted-foreground text-sm">All saved GST profit calculations across all customers.</p>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)
        ) : calculations?.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            No calculations saved yet. Go to Calculator to create one.
          </div>
        ) : (
          calculations?.map((calc) => (
            <Card key={calc.id} className="p-0 overflow-hidden hover:border-primary/40 transition-colors">
              <div className="p-4 md:p-6">
                {/* Top row */}
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>{format(new Date(calc.date), 'dd MMM, yyyy')}</span>
                  {calc.billNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono bg-muted px-2 py-0.5 rounded">{calc.billNumber}</span>
                    </>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {calc.label || 'Unnamed Calculation'}
                </h3>
                <div className="flex items-center text-muted-foreground font-medium text-sm mt-1 mb-4">
                  <Briefcase className="w-4 h-4 mr-1.5 shrink-0" />
                  {calc.customerName || 'No Customer Assigned'}
                </div>

                {/* Numbers */}
                <div className="grid grid-cols-3 gap-3 bg-muted/20 p-3 md:p-4 rounded-xl border border-border/50">
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center mb-1">
                      <ArrowDownToLine className="w-3 h-3 mr-1 text-destructive" />
                      <span className="hidden sm:inline">Purchase</span>
                      <span className="sm:hidden">Buy</span>
                    </div>
                    <div className="font-semibold text-destructive text-sm md:text-base">{formatCurrency(calc.result.purchaseExGst)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider flex items-center mb-1">
                      <ArrowUpToLine className="w-3 h-3 mr-1 text-emerald-600" />
                      <span className="hidden sm:inline">Sale</span>
                      <span className="sm:hidden">Sell</span>
                    </div>
                    <div className="font-semibold text-emerald-600 text-sm md:text-base">{formatCurrency(calc.result.saleExGst)}</div>
                  </div>
                  <div className="border-l border-border/50 pl-3 md:pl-6">
                    <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Net Profit</div>
                    <div className="text-xl md:text-2xl font-display font-bold text-foreground">
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
