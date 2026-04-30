import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Save, FileText, CheckCircle2, ChevronRight, ShoppingCart, ArrowRight } from "lucide-react";
import { useGetMe, useListCustomers, useCreateCalculation } from "@workspace/api-client-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

type FormValues = {
  purchaseAmount: number;
  purchaseInclGst: boolean;
  purchaseGstRate: number;
  saleAmount: number;
  saleInclGst: boolean;
  saleGstRate: number;
  expenses: { label: string; amount: number; hasGst: boolean; gstRate: number }[];
  commission: number;
  commissionPercentage: number;
};

const GST_RATES = ["0", "5", "12", "18", "28"];

function GstSelect({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10", className)}
    >
      {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
    </select>
  );
}

// Move these components outside to prevent re-creation on every render
const ResultsPanel = ({ result, canSave, onSaveClick, onCreateOrderClick }: {
  result: { purchaseExGst: number; purchaseGstAmount: number; saleExGst: number; saleGstAmount: number; netGstPayable: number; grossProfit: number; totalExpenses: number; netProfit: number };
  canSave: boolean;
  onSaveClick: () => void;
  onCreateOrderClick: () => void;
}) => (
  <Card className="bg-gradient-to-b from-primary/10 to-transparent border-primary/30 shadow-xl overflow-hidden">
    <div className="bg-primary p-5 text-primary-foreground text-center">
      <h3 className="text-sm font-medium opacity-90 uppercase tracking-widest mb-1">Net Profit</h3>
      <div className="text-5xl font-display font-bold tracking-tight">
        {formatCurrency(result.netProfit)}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs bg-black/20 py-1.5 px-3 rounded-full max-w-max mx-auto">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Based on ex-GST margins
      </div>
    </div>

    <div className="p-5 space-y-4">
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium text-sm">Sale Revenue (Ex-GST)</span>
          <span className="font-bold text-emerald-600">{formatCurrency(result.saleExGst)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium text-sm">Purchase Cost (Ex-GST)</span>
          <span className="font-bold text-destructive">-{formatCurrency(result.purchaseExGst)}</span>
        </div>
        <div className="w-full h-px bg-border my-1" />
        <div className="flex justify-between items-center">
          <span className="font-bold">Gross Profit</span>
          <span className="font-bold text-lg">{formatCurrency(result.grossProfit)}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-border/50">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-medium text-sm">Total Expenses (Ex-GST)</span>
          <span className="font-bold text-amber-600">-{formatCurrency(result.totalExpenses)}</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
          <FileText className="w-3.5 h-3.5 mr-2" /> GST Settlement
        </h4>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST Collected (Sale)</span>
            <span>{formatCurrency(result.saleGstAmount)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Less: ITC from Purchase</span>
            <span>-{formatCurrency(result.purchaseGstAmount)}</span>
          </div>
          <div className="w-full h-px bg-border" />
          <div className="flex justify-between font-bold text-primary pt-0.5">
            <span>Net GST to Govt</span>
            <span>{formatCurrency(result.netGstPayable)}</span>
          </div>
        </div>
      </div>

      {canSave && (
        <div className="space-y-2">
          <Button size="lg" onClick={onCreateOrderClick} className="w-full shadow-lg">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Create Order
          </Button>
          <Button size="lg" onClick={onSaveClick} variant="outline" className="w-full">
            <Save className="w-5 h-5 mr-2" />
            Save Calculation Only
          </Button>
        </div>
      )}
    </div>
  </Card>
);

const InputsPanel = ({ register, fields, append, remove }: {
  register: any;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
}) => (
  <div className="space-y-4">
    {/* Purchase */}
    <Card className="border-t-4 border-t-destructive/80">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center text-base">
          <span className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mr-3 text-xs font-bold">1</span>
          Purchase (You Pay)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Amount (₹)</label>
          <Input type="number" inputMode="decimal" {...register("purchaseAmount", { valueAsNumber: true })} className="text-base font-bold" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">GST Rate</label>
          <GstSelect {...register("purchaseGstRate", { valueAsNumber: true })} />
        </div>
        <div className="col-span-2 pt-1">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input type="checkbox" {...register("purchaseInclGst")} className="w-5 h-5 rounded text-primary focus:ring-primary" />
            <span className="font-medium text-sm">Amount includes GST</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-7">If checked, GST portion will be extracted automatically.</p>
        </div>
      </CardContent>
    </Card>

    {/* Sale */}
    <Card className="border-t-4 border-t-emerald-500">
      <CardHeader className="bg-muted/30 pb-3">
        <CardTitle className="flex items-center text-base">
          <span className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mr-3 text-xs font-bold">2</span>
          Sale (You Receive)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">Amount (₹)</label>
          <Input type="number" inputMode="decimal" {...register("saleAmount", { valueAsNumber: true })} className="text-base font-bold" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold">GST Rate</label>
          <GstSelect {...register("saleGstRate", { valueAsNumber: true })} />
        </div>
        <div className="col-span-2 pt-1">
          <label className="flex items-center space-x-2.5 cursor-pointer">
            <input type="checkbox" {...register("saleInclGst")} className="w-5 h-5 rounded text-primary focus:ring-primary" />
            <span className="font-medium text-sm">Amount includes GST</span>
          </label>
        </div>
      </CardContent>
    </Card>

    {/* Expenses */}
    <Card className="border-t-4 border-t-amber-500">
      <CardHeader className="bg-muted/30 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-base">
          <span className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mr-3 text-xs font-bold">3</span>
          Direct Expenses
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", amount: 0, hasGst: false, gstRate: 18 })}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="p-3 border border-border/50 rounded-xl bg-card/50 space-y-2">
            <div className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Label</label>
                <Input {...register(`expenses.${index}.label`)} placeholder="e.g. Installation" />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10 mt-5 shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Amount (₹)</label>
                <Input type="number" inputMode="decimal" {...register(`expenses.${index}.amount`, { valueAsNumber: true })} />
              </div>
              <div className="flex items-center pb-2">
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register(`expenses.${index}.hasGst`)} className="rounded" />
                  <span>Has GST?</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-border/50 space-y-3">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission (No GST)</label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Percentage (%)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                {...register("commissionPercentage", { valueAsNumber: true })}
                className="text-base"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Amount (₹)</label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                {...register("commission", { valueAsNumber: true })}
                className="text-base"
                placeholder="0.00"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">
            💡 Enter either percentage or amount - calculated on Sale Price (Ex-GST)
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function CalculatorPage() {
  const { data: user } = useGetMe();
  const canSave = user?.role === 'admin' || user?.role === 'customer_access';
  const [, setLocation] = useLocation();

  const { register, control, watch, setValue, getValues } = useForm<FormValues>({
    defaultValues: {
      purchaseAmount: 0,
      purchaseInclGst: true,
      purchaseGstRate: 18,
      saleAmount: 0,
      saleInclGst: true,
      saleGstRate: 18,
      expenses: [{ label: "Installation / Transport", amount: 0, hasGst: false, gstRate: 18 }],
      commission: 0,
      commissionPercentage: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "expenses" });

  const [result, setResult] = useState({
    purchaseExGst: 0, purchaseGstAmount: 0,
    saleExGst: 0, saleGstAmount: 0,
    netGstPayable: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0
  });

  // Use ref to prevent circular updates
  const isUpdatingCommission = useRef(false);

  // Separate effect for commission percentage/amount sync
  useEffect(() => {
    const subscription = watch((formValues, { name }) => {
      // Prevent circular updates
      if (isUpdatingCommission.current) {
        return;
      }

      // Calculate sale price ex-GST (base for commission calculation)
      const sAmt = Number(formValues.saleAmount) || 0;
      const sRate = Number(formValues.saleGstRate) || 0;
      const sExGst = formValues.saleInclGst ? sAmt / (1 + sRate / 100) : sAmt;

      // Handle commission sync based on sale price ex-GST
      if (name === 'commissionPercentage' && sExGst > 0) {
        const percentage = Number(formValues.commissionPercentage) || 0;
        const amount = (sExGst * percentage) / 100;
        isUpdatingCommission.current = true;
        setValue('commission', Number(amount.toFixed(2)), { shouldValidate: false });
        setTimeout(() => { isUpdatingCommission.current = false; }, 0);
      } else if (name === 'commission' && sExGst > 0) {
        const amount = Number(formValues.commission) || 0;
        const percentage = (amount / sExGst) * 100;
        isUpdatingCommission.current = true;
        setValue('commissionPercentage', Number(percentage.toFixed(2)), { shouldValidate: false });
        setTimeout(() => { isUpdatingCommission.current = false; }, 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Main calculation effect
  useEffect(() => {
    const subscription = watch((formValues) => {
      const pAmt = Number(formValues.purchaseAmount) || 0;
      const pRate = Number(formValues.purchaseGstRate) || 0;
      const pExGst = formValues.purchaseInclGst ? pAmt / (1 + pRate / 100) : pAmt;
      const pGst = formValues.purchaseInclGst ? pAmt - pExGst : pAmt * (pRate / 100);

      const sAmt = Number(formValues.saleAmount) || 0;
      const sRate = Number(formValues.saleGstRate) || 0;
      const sExGst = formValues.saleInclGst ? sAmt / (1 + sRate / 100) : sAmt;
      const sGst = formValues.saleInclGst ? sAmt - sExGst : sAmt * (sRate / 100);

      let expTotalExGst = 0;
      let expTotalGst = 0;
      (formValues.expenses || []).forEach(exp => {
        const amt = Number(exp.amount) || 0;
        const rate = Number(exp.gstRate) || 0;
        if (exp.hasGst) {
          const ex = amt / (1 + rate / 100);
          expTotalExGst += ex;
          expTotalGst += (amt - ex);
        } else {
          expTotalExGst += amt;
        }
      });

      const comm = Number(formValues.commission) || 0;
      const totalExp = expTotalExGst + comm;
      const gross = sExGst - pExGst;
      const net = gross - totalExp;
      const netGst = sGst - pGst - expTotalGst;

      setResult({
        purchaseExGst: pExGst, purchaseGstAmount: pGst,
        saleExGst: sExGst, saleGstAmount: sGst,
        netGstPayable: netGst, grossProfit: gross, totalExpenses: totalExp, netProfit: net
      });
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const [mobileTab, setMobileTab] = useState<'inputs' | 'results'>('inputs');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  
  const { data: customers } = useListCustomers({
    query: {
      enabled: saveDialogOpen || createOrderDialogOpen,
      queryKey: ['customers'] as const
    }
  });
  
  const saveMutation = useCreateCalculation();
  const [saveForm, setSaveForm] = useState({
    customerId: "", label: "", billNumber: "", notes: "", date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSave = () => {
    const formValues = getValues();
    saveMutation.mutate({
      data: {
        customerId: saveForm.customerId ? parseInt(saveForm.customerId) : null,
        label: saveForm.label,
        billNumber: saveForm.billNumber,
        notes: saveForm.notes,
        date: new Date(saveForm.date).toISOString(),
        inputs: formValues as any,
        result: result
      }
    }, {
      onSuccess: () => {
        setSaveDialogOpen(false);
        alert("Calculation saved successfully!");
      }
    });
  };

  const handleCreateOrder = () => {
    // Get current form values
    const formValues = getValues();
    
    // Build URL with calculation data as query parameters
    const params = new URLSearchParams({
      // Purchase data
      purchaseAmount: String(formValues.purchaseAmount || 0),
      purchaseInclGst: String(formValues.purchaseInclGst),
      purchaseGstRate: String(formValues.purchaseGstRate || 0),
      // Sale data
      saleAmount: String(formValues.saleAmount || 0),
      saleInclGst: String(formValues.saleInclGst),
      saleGstRate: String(formValues.saleGstRate || 0),
      // Calculated values
      supplierRate: String(result.purchaseExGst || 0),
      purchaseGstPct: String(formValues.purchaseGstRate || 0),
      sellingRate: String(result.saleExGst || 0),
      saleGstPct: String(formValues.saleGstRate || 0),
      // Commission
      commission: String(formValues.commission || 0),
      // Expenses (serialize as JSON)
      expenses: JSON.stringify(formValues.expenses || []),
      // Results
      grossProfit: String(result.grossProfit || 0),
      netProfit: String(result.netProfit || 0),
      totalExpenses: String(result.totalExpenses || 0),
    });
    
    setCreateOrderDialogOpen(false);
    setLocation(`/orders/create?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">GST Profit Calculator</h1>
          <p className="text-muted-foreground text-sm">Calculates profit exclusively on ex-GST margins.</p>
        </div>
      </div>

      {/* Mobile Quick Result Banner */}
      <div
        className="md:hidden bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-between cursor-pointer active:opacity-80"
        onClick={() => setMobileTab(mobileTab === 'results' ? 'inputs' : 'results')}
      >
        <div>
          <p className="text-xs opacity-80 uppercase tracking-widest">Net Profit</p>
          <p className="text-3xl font-display font-bold">{formatCurrency(result.netProfit)}</p>
        </div>
        <div className="flex items-center gap-1 text-sm opacity-80">
          {mobileTab === 'inputs' ? 'See Breakdown' : 'Edit Inputs'}
          <ChevronRight className={cn("w-4 h-4 transition-transform", mobileTab === 'results' && "rotate-180")} />
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex bg-muted rounded-xl p-1">
        <button
          onClick={() => setMobileTab('inputs')}
          className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", mobileTab === 'inputs' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
        >
          Inputs
        </button>
        <button
          onClick={() => setMobileTab('results')}
          className={cn("flex-1 py-2 text-sm font-semibold rounded-lg transition-all", mobileTab === 'results' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}
        >
          Results
        </button>
      </div>

      {/* Desktop: two columns. Mobile: tab-driven */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Inputs — always visible on desktop, tab-conditional on mobile */}
        <div className={cn("lg:col-span-7", "md:block", mobileTab === 'inputs' ? 'block' : 'hidden md:block')}>
          <InputsPanel register={register} fields={fields} append={append} remove={remove} />
        </div>

        {/* Results */}
        <div className={cn("lg:col-span-5", "md:block", mobileTab === 'results' ? 'block' : 'hidden md:block')}>
          <div className="lg:sticky lg:top-8">
            <ResultsPanel
              result={result}
              canSave={canSave}
              onSaveClick={() => setSaveDialogOpen(true)}
              onCreateOrderClick={() => setCreateOrderDialogOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>Store this for future reference and billing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Customer (Optional)</label>
            <select
              value={saveForm.customerId}
              onChange={e => setSaveForm({ ...saveForm, customerId: e.target.value })}
              className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
            >
              <option value="">-- No Customer --</option>
              {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Date</label>
              <Input type="date" value={saveForm.date} onChange={e => setSaveForm({ ...saveForm, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Reference / Bill #</label>
              <Input value={saveForm.billNumber} onChange={e => setSaveForm({ ...saveForm, billNumber: e.target.value })} placeholder="INV-001" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Label / Title</label>
            <Input value={saveForm.label} onChange={e => setSaveForm({ ...saveForm, label: e.target.value })} placeholder="e.g. XYZ Project Phase 1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Notes</label>
            <textarea
              value={saveForm.notes}
              onChange={e => setSaveForm({ ...saveForm, notes: e.target.value })}
              className="flex min-h-[80px] w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary"
              placeholder="Any extra details..."
            />
          </div>
          <Button onClick={handleSave} isLoading={saveMutation.isPending} className="w-full">
            Confirm Save
          </Button>
        </div>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={createOrderDialogOpen} onOpenChange={setCreateOrderDialogOpen}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create Order from Calculation
          </DialogTitle>
          <DialogDescription>
            Convert this calculation into a full order with all financial details pre-filled
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase (Ex-GST)</span>
                  <span className="font-semibold">{formatCurrency(result.purchaseExGst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale (Ex-GST)</span>
                  <span className="font-semibold">{formatCurrency(result.saleExGst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expenses</span>
                  <span className="font-semibold">{formatCurrency(result.totalExpenses)}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-base">
                  <span className="font-bold">Net Profit</span>
                  <span className="font-bold text-primary">{formatCurrency(result.netProfit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Banner */}
          <div className="flex gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <ArrowRight className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">What happens next?</p>
              <p className="text-muted-foreground">
                This will create a new order at <Badge variant="secondary" className="mx-1">ENQUIRY</Badge> stage with all financial calculations pre-filled. You can then add customer, supplier, and item details.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCreateOrderDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
