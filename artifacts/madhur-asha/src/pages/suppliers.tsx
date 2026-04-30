import { useState } from "react";
import { useListSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, lookupGST } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Truck, Search, Hash, CheckCircle2, AlertCircle, Loader2, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function SuppliersPage() {
  const { data: suppliers, isLoading, refetch } = useListSuppliers();
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pushingId, setPushingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    gstin: "",
    contactPerson: "",
    address: "",
    state: "",
    pincode: "",
    contactInfo: "",
    paymentTerms: "",
    status: "",
    bankAccount: {
      accountNo: "",
      ifsc: "",
      bankName: ""
    }
  });
  
  const [uiState, setUIState] = useState({
    isFetching: false,
    fetchSuccess: false,
    fetchError: "",
    gstinValid: false
  });

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deleteMutation = useDeleteSupplier();

  const filteredSuppliers = suppliers?.filter(s =>
    s.businessName.toLowerCase().includes(search.toLowerCase()) ||
    (s.gstin && s.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  // GSTIN validation
  const validateGSTIN = (gstin: string): boolean => {
    const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;
    return gstinRegex.test(gstin) && gstin.length === 15;
  };

  const handleGSTINChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, gstin: upperValue });
    
    const isValid = validateGSTIN(upperValue);
    setUIState({ ...uiState, gstinValid: isValid, fetchError: "", fetchSuccess: false });
  };

  const handleFetchGST = async () => {
    if (!uiState.gstinValid) return;

    setUIState({ ...uiState, isFetching: true, fetchError: "", fetchSuccess: false });

    try {
      const data = await lookupGST({ gstin: formData.gstin });

      // Populate form with GST data
      setFormData({
        ...formData,
        businessName: data.name || "",
        address: data.address || "",
        state: data.state || "",
        pincode: data.pincode || "",
        status: data.gstStatus || ""
      });

      setUIState({
        ...uiState,
        isFetching: false,
        fetchSuccess: true,
        fetchError: ""
      });

      toast.success("GST details fetched successfully!");

      // Show warning if cancelled
      if (data.gstStatus === "Cancelled") {
        toast.warning("This GSTIN is marked as Cancelled in GST records.");
      }
    } catch (error: any) {
      const errorMessage = error?.body?.error || error?.message || "Failed to fetch GST details";
      setUIState({
        ...uiState,
        isFetching: false,
        fetchError: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      businessName: "",
      gstin: "",
      contactPerson: "",
      address: "",
      state: "",
      pincode: "",
      contactInfo: "",
      paymentTerms: "",
      status: "",
      bankAccount: {
        accountNo: "",
        ifsc: "",
        bankName: ""
      }
    });
    setUIState({
      isFetching: false,
      fetchSuccess: false,
      fetchError: "",
      gstinValid: false
    });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!formData.businessName) return;
    
    // Prepare data - only include bankAccount if at least one field is filled
    const hasBankDetails = formData.bankAccount.accountNo || formData.bankAccount.ifsc || formData.bankAccount.bankName;
    const submitData: any = {
      ...formData,
      bankAccount: hasBankDetails ? formData.bankAccount : null,
      paymentTerms: formData.paymentTerms || undefined
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          refetch();
          toast.success("Supplier updated successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to update supplier");
        }
      });
    } else {
      createMutation.mutate({ data: submitData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          refetch();
          toast.success("Supplier created successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to create supplier");
        }
      });
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setFormData({
      businessName: supplier.businessName || "",
      gstin: supplier.gstin || "",
      contactPerson: supplier.contactPerson || "",
      address: supplier.address || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",
      contactInfo: supplier.contactInfo || "",
      paymentTerms: supplier.paymentTerms || "",
      status: supplier.status || "",
      bankAccount: supplier.bankAccount || {
        accountNo: "",
        ifsc: "",
        bankName: ""
      }
    });
    setUIState({
      isFetching: false,
      fetchSuccess: false,
      fetchError: "",
      gstinValid: supplier.gstin ? validateGSTIN(supplier.gstin) : false
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this supplier? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(id);
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        setDeletingId(null);
        refetch();
        toast.success("Supplier deleted successfully!");
      },
      onError: (error: any) => {
        setDeletingId(null);
        toast.error(error?.response?.data?.error || "Failed to delete supplier");
      }
    });
  };

  const handlePushToZoho = async (id: number) => {
    setPushingId(id);
    try {
      const response = await fetch(`/api/suppliers/${id}/push-zoho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to push to Zoho");
      }

      const result = await response.json();
      toast.success(`Supplier synced to Zoho! ID: ${result.zohoId}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to push supplier to Zoho");
    } finally {
      setPushingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Manage your vendors and their payment details.</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="rounded-xl shadow-lg w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or GSTIN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredSuppliers?.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
          <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
          No suppliers found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-4 font-semibold text-sm text-muted-foreground">Business Name</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">GSTIN</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">Payment Terms</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Added On</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers?.map((supplier) => (
                    <tr key={supplier.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{supplier.businessName}</span>
                            {supplier.contactPerson && (
                              <span className="text-xs text-muted-foreground">{supplier.contactPerson}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono">{supplier.gstin || '-'}</td>
                      <td className="p-4">
                        {supplier.paymentTerms ? (
                          <Badge variant="secondary" className="text-xs">
                            {supplier.paymentTerms}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground">
                        {format(new Date(supplier.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {supplier.zohoSyncStatus === "synced" && supplier.zohoId ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-500"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Synced to Zoho</p>
                                  <p className="text-xs font-mono">ID: {supplier.zohoId}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePushToZoho(supplier.id);
                              }}
                              disabled={pushingId === supplier.id}
                              title="Push to Zoho"
                            >
                              {pushingId === supplier.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              handleEdit(supplier);
                            }}
                          >
                            <Pencil className="w-5 h-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDelete(supplier.id);
                            }}
                            disabled={deletingId === supplier.id}
                          >
                            {deletingId === supplier.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredSuppliers?.map((supplier) => (
              <Card key={supplier.id} className="p-4 hover:border-primary/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{supplier.businessName}</p>
                    {supplier.contactPerson && (
                      <p className="text-xs text-muted-foreground truncate">{supplier.contactPerson}</p>
                    )}
                    {supplier.gstin && (
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Hash className="w-3 h-3 mr-1" />
                        <span className="font-mono">{supplier.gstin}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {supplier.paymentTerms && (
                      <Badge variant="secondary" className="text-xs mb-1">
                        {supplier.paymentTerms}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground">{format(new Date(supplier.createdAt), 'dd MMM yy')}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  {supplier.zohoSyncStatus === "synced" && supplier.zohoId ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 px-2 py-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Synced to Zoho</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePushToZoho(supplier.id)}
                      disabled={pushingId === supplier.id}
                    >
                      {pushingId === supplier.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-1" />
                      )}
                      Push to Zoho
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(supplier.id)}
                    disabled={deletingId === supplier.id}
                  >
                    {deletingId === supplier.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit Supplier Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update supplier details below." : "Enter the GSTIN to auto-fetch details or enter manually."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* GSTIN with Fetch Button */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">GSTIN</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={formData.gstin}
                  onChange={e => handleGSTINChange(e.target.value)}
                  placeholder="27XXXXX0000X1Z5"
                  className="font-mono uppercase pr-8"
                  maxLength={15}
                />
                {formData.gstin && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {uiState.gstinValid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={handleFetchGST}
                disabled={!uiState.gstinValid || uiState.isFetching}
                variant="secondary"
                className="shrink-0"
              >
                {uiState.isFetching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  "Fetch Details"
                )}
              </Button>
            </div>
            {uiState.fetchError && (
              <p className="text-xs text-destructive">{uiState.fetchError}</p>
            )}
            {!uiState.gstinValid && formData.gstin.length > 0 && (
              <p className="text-xs text-muted-foreground">
                GSTIN must be 15 characters (e.g., 27XXXXX0000X1Z5)
              </p>
            )}
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Business Name *</label>
            <Input
              value={formData.businessName}
              onChange={e => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="e.g. ABC Suppliers Pvt Ltd"
            />
          </div>

          {/* Contact Person */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Contact Person</label>
            <Input
              value={formData.contactPerson}
              onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
              placeholder="e.g. Rajesh Kumar"
            />
          </div>

          {/* GST Status Badge */}
          {formData.status && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">GST Status</label>
              <div>
                <Badge
                  variant={formData.status === "Active" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {formData.status}
                </Badge>
              </div>
              {formData.status === "Cancelled" && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This GSTIN is marked as Cancelled in GST records. You can still save this supplier.
                </p>
              )}
            </div>
          )}

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Address</label>
            <Input
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          {/* State and Pincode on same line */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">State</label>
              <Input
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Pincode</label>
              <Input
                value={formData.pincode}
                onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 411007"
                maxLength={6}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Contact Info</label>
            <Input
              value={formData.contactInfo}
              onChange={e => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="Phone or Email"
            />
          </div>

          {/* Payment Terms */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Payment Terms</label>
            <Select
              value={formData.paymentTerms}
              onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Net 7">Net 7</SelectItem>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 45">Net 45</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Account Details */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <label className="text-sm font-semibold">Bank Account Details (Optional)</label>
            
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Account Number</label>
              <Input
                value={formData.bankAccount.accountNo}
                onChange={e => setFormData({ 
                  ...formData, 
                  bankAccount: { ...formData.bankAccount, accountNo: e.target.value }
                })}
                placeholder="e.g. 1234567890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">IFSC Code</label>
              <Input
                value={formData.bankAccount.ifsc}
                onChange={e => setFormData({ 
                  ...formData, 
                  bankAccount: { ...formData.bankAccount, ifsc: e.target.value.toUpperCase() }
                })}
                placeholder="e.g. SBIN0001234"
                className="uppercase"
                maxLength={11}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Bank Name</label>
              <Input
                value={formData.bankAccount.bankName}
                onChange={e => setFormData({ 
                  ...formData, 
                  bankAccount: { ...formData.bankAccount, bankName: e.target.value }
                })}
                placeholder="e.g. State Bank of India"
              />
            </div>
          </div>

          <Button
            onClick={handleCreate}
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.businessName}
            className="w-full mt-2"
          >
            {editingId ? "Update Supplier" : "Create Supplier"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob