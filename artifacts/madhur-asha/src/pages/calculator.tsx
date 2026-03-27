import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2, Save, FileText, CheckCircle2 } from "lucide-react";
import { useGetMe, useListCustomers, useCreateCalculation } from "@workspace/api-client-react";
import { format } from "date-fns";

type FormValues = {
  purchaseAmount: number;
  purchaseInclGst: boolean;
  purchaseGstRate: number;
  saleAmount: number;
  saleInclGst: boolean;
  saleGstRate: number;
  expenses: { label: string; amount: number; hasGst: boolean; gstRate: number }[];
  commission: number;
};

export default function CalculatorPage() {
  const { data: user } = useGetMe();
  const canSave = user?.role === 'admin' || user?.role === 'customer_access';

  const { register, control, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      purchaseAmount: 0,
      purchaseInclGst: true,
      purchaseGstRate: 18,
      saleAmount: 0,
      saleInclGst: true,
      saleGstRate: 18,
      expenses: [{ label: "Installation / Transport", amount: 0, hasGst: false, gstRate: 18 }],
      commission: 0,
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "expenses" });
  const formValues = watch();

  const [result, setResult] = useState({
    purchaseExGst: 0, purchaseGstAmount: 0,
    saleExGst: 0, saleGstAmount: 0,
    netGstPayable: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0
  });

  useEffect(() => {
    // Math Logic based strictly on EX-GST numbers for profit
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
    formValues.expenses.forEach(exp => {
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
  }, [formValues]);

  // Save Dialog State
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const { data: customers } = useListCustomers({ query: { enabled: saveDialogOpen } });
  const saveMutation = useCreateCalculation();
  const [saveForm, setSaveForm] = useState({
    customerId: "", label: "", billNumber: "", notes: "", date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSave = () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">GST Profit Calculator</h1>
          <p className="text-muted-foreground">Work entirely in ex-GST numbers for accurate actual profit margins.</p>
        </div>
        {canSave && (
          <Button size="lg" onClick={() => setSaveDialogOpen(true)} className="shadow-lg">
            <Save className="w-5 h-5 mr-2" />
            Save Calculation
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          {/* Purchase Section */}
          <Card className="border-t-4 border-t-destructive/80">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center text-lg"><span className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mr-3 text-sm">1</span>Purchase (You Pay)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Amount (₹)</label>
                <Input type="number" {...register("purchaseAmount")} className="text-lg font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">GST Rate (%)</label>
                <select {...register("purchaseGstRate")} className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" {...register("purchaseInclGst")} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                  <span className="font-medium">Amount includes GST</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1 ml-8">If checked, we will extract the GST portion. If unchecked, GST will be added on top.</p>
              </div>
            </CardContent>
          </Card>

          {/* Sale Section */}
          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="flex items-center text-lg"><span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mr-3 text-sm">2</span>Sale (You Receive)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Amount (₹)</label>
                <Input type="number" {...register("saleAmount")} className="text-lg font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">GST Rate (%)</label>
                <select {...register("saleGstRate")} className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10">
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
              <div className="sm:col-span-2 pt-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" {...register("saleInclGst")} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                  <span className="font-medium">Amount includes GST</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Section */}
          <Card className="border-t-4 border-t-amber-500">
            <CardHeader className="bg-muted/30 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center text-lg"><span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mr-3 text-sm">3</span>Direct Expenses</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", amount: 0, hasGst: false, gstRate: 18 })}>
                <Plus className="w-4 h-4 mr-1" /> Add Row
              </Button>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-end p-4 border border-border/50 rounded-xl bg-card hover:border-primary/30 transition-colors">
                  <div className="w-full sm:flex-1 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Label</label>
                    <Input {...register(`expenses.${index}.label`)} placeholder="e.g. Installation" />
                  </div>
                  <div className="w-full sm:w-32 space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Amount (₹)</label>
                    <Input type="number" {...register(`expenses.${index}.amount`)} />
                  </div>
                  <div className="w-full sm:w-auto flex items-center gap-3">
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" {...register(`expenses.${index}.hasGst`)} className="rounded" />
                      <span>Has GST?</span>
                    </label>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-4 items-center">
                 <div className="w-full space-y-2">
                  <label className="text-sm font-semibold">Additional Commission (No GST) (₹)</label>
                  <Input type="number" {...register("commission")} className="text-lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            <Card className="bg-gradient-to-b from-primary/10 to-transparent border-primary/30 shadow-xl overflow-hidden">
              <div className="bg-primary p-6 text-primary-foreground text-center">
                <h3 className="text-lg font-medium opacity-90 uppercase tracking-widest mb-2">Net Profit</h3>
                <div className="text-6xl font-display font-bold tracking-tight">
                  {formatCurrency(result.netProfit)}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm bg-black/20 py-2 px-4 rounded-full max-w-max mx-auto backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Calculated exclusively on ex-GST margins
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Breakdown Rows */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground font-medium">Sale Revenue (Ex-GST)</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(result.saleExGst)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground font-medium">Purchase Cost (Ex-GST)</span>
                    <span className="font-bold text-destructive">-{formatCurrency(result.purchaseExGst)}</span>
                  </div>
                  <div className="w-full h-px bg-border my-2" />
                  <div className="flex justify-between items-center text-xl">
                    <span className="font-bold">Gross Profit</span>
                    <span className="font-bold">{formatCurrency(result.grossProfit)}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between items-center text-lg">
                    <span className="text-muted-foreground font-medium">Total Expenses (Ex-GST)</span>
                    <span className="font-bold text-amber-600">-{formatCurrency(result.totalExpenses)}</span>
                  </div>
                </div>

                {/* GST Info Box */}
                <div className="bg-card border border-border rounded-xl p-4 mt-6">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2" /> GST Settlement Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>GST Collected (Sale)</span>
                      <span>{formatCurrency(result.saleGstAmount)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Less: ITC from Purchase</span>
                      <span>-{formatCurrency(result.purchaseGstAmount)}</span>
                    </div>
                    <div className="w-full h-px bg-border" />
                    <div className="flex justify-between font-bold text-primary pt-1">
                      <span>Net GST to Government</span>
                      <span>{formatCurrency(result.netGstPayable)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* SAVE DIALOG */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogHeader>
          <DialogTitle>Save Calculation</DialogTitle>
          <DialogDescription>Store this calculation for future reference and billing.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Select Customer (Optional)</label>
            <select 
              value={saveForm.customerId} 
              onChange={e => setSaveForm({...saveForm, customerId: e.target.value})}
              className="flex h-11 w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
            >
              <option value="">-- No Customer --</option>
              {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Date</label>
              <Input type="date" value={saveForm.date} onChange={e => setSaveForm({...saveForm, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Reference / Bill #</label>
              <Input value={saveForm.billNumber} onChange={e => setSaveForm({...saveForm, billNumber: e.target.value})} placeholder="e.g. INV-001" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Label / Title</label>
            <Input value={saveForm.label} onChange={e => setSaveForm({...saveForm, label: e.target.value})} placeholder="e.g. XYZ Project Phase 1" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Notes</label>
            <textarea 
              value={saveForm.notes} 
              onChange={e => setSaveForm({...saveForm, notes: e.target.value})}
              className="flex min-h-[80px] w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
              placeholder="Any extra details..."
            />
          </div>
          <Button onClick={handleSave} isLoading={saveMutation.isPending} className="w-full mt-4">
            Confirm Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
