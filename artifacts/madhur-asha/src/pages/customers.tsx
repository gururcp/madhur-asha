import { useState } from "react";
import { Link } from "wouter";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer, lookupGST } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Building2, Search, ArrowRight, Hash, FileText, CheckCircle2, AlertCircle, Loader2, Pencil, Trash2, Upload, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CustomersPage() {
  const { data: customers, isLoading, refetch } = useListCustomers();
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pushingId, setPushingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    address: "",
    contact: "",
    gstStatus: "",
    state: "",
    pincode: ""
  });
  
  const [uiState, setUIState] = useState({
    isFetching: false,
    fetchSuccess: false,
    fetchError: "",
    gstinValid: false
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const filteredCustomers = customers?.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
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
        name: data.name || "",
        address: data.address || "",
        state: data.state || "",
        pincode: data.pincode || "",
        gstStatus: data.gstStatus || ""
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
      name: "",
      gstin: "",
      address: "",
      contact: "",
      gstStatus: "",
      state: "",
      pincode: ""
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
    if (!formData.name) return;
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          refetch();
          toast.success("Customer updated successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to update customer");
        }
      });
    } else {
      createMutation.mutate({ data: formData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          refetch();
          toast.success("Customer created successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to create customer");
        }
      });
    }
  };

  const handleEdit = (customer: any) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
      contact: customer.contact || "",
      gstStatus: customer.gstStatus || "",
      state: customer.state || "",
      pincode: customer.pincode || ""
    });
    setUIState({
      isFetching: false,
      fetchSuccess: false,
      fetchError: "",
      gstinValid: customer.gstin ? validateGSTIN(customer.gstin) : false
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(id);
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        setDeletingId(null);
        refetch();
        toast.success("Customer deleted successfully!");
      },
      onError: (error: any) => {
        setDeletingId(null);
        toast.error(error?.response?.data?.error || "Failed to delete customer");
      }
    });
  };

  const handlePushToZoho = async (customerId: number) => {
    setPushingId(customerId);
    try {
      const response = await fetch(`/api/customers/${customerId}/push-zoho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to push to Zoho");

      const result = await response.json();
      toast.success("Customer pushed to Zoho successfully!");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to push customer to Zoho");
    } finally {
      setPushingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage your clients and view their history.</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="rounded-xl shadow-lg w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
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
      ) : filteredCustomers?.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          No customers found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-4 font-semibold text-sm text-muted-foreground">Name</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">GSTIN</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-center">Calculations</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Added On</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers?.map((customer) => (
                    <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-foreground">{customer.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono">{customer.gstin || '-'}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold">
                          {customer.calculationCount}
                        </span>
                      </td>
                      <td className="p-4 text-right text-sm text-muted-foreground">
                        {format(new Date(customer.createdAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {customer.zohoSyncStatus === "synced" && customer.zohoId ? (
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
                                  <p className="text-xs font-mono">ID: {customer.zohoId}</p>
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
                                handlePushToZoho(customer.id);
                              }}
                              disabled={pushingId === customer.id}
                              title="Push to Zoho"
                            >
                              {pushingId === customer.id ? (
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
                              handleEdit(customer);
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
                              handleDelete(customer.id);
                            }}
                            disabled={deletingId === customer.id}
                          >
                            {deletingId === customer.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </Button>
                          <Link href={`/customers/${customer.id}`}>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-5 h-5" />
                            </Button>
                          </Link>
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
            {filteredCustomers?.map((customer) => (
              <Card key={customer.id} className="p-4 hover:border-primary/40">
                <Link href={`/customers/${customer.id}`}>
                  <div className="flex items-center gap-3 mb-3 cursor-pointer active:scale-[0.99] transition-transform">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{customer.name}</p>
                      {customer.gstin && (
                        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                          <Hash className="w-3 h-3 mr-1" />
                          <span className="font-mono">{customer.gstin}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end mb-1">
                        <FileText className="w-3 h-3" />
                        <span className="font-bold text-foreground">{customer.calculationCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{format(new Date(customer.createdAt), 'dd MMM yy')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-1" />
                  </div>
                </Link>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {customer.zohoSyncStatus === "synced" && customer.zohoId ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 px-2 py-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Synced to Zoho</span>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePushToZoho(customer.id)}
                      disabled={pushingId === customer.id}
                    >
                      {pushingId === customer.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-1" />
                          Push to Zoho
                        </>
                      )}
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(customer)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(customer.id)}
                      disabled={deletingId === customer.id}
                    >
                      {deletingId === customer.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-1" />
                      )}
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Customer Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update customer details below." : "Enter the GSTIN to auto-fetch details or enter manually."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* GSTIN with Fetch Button */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">GSTIN *</label>
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
            <label className="text-sm font-semibold">Business Name (Legal Name) *</label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Reliance Industries"
            />
          </div>

          {/* GST Status Badge */}
          {formData.gstStatus && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">GST Status</label>
              <div>
                <Badge
                  variant={formData.gstStatus === "Active" ? "default" : "destructive"}
                  className="text-xs"
                >
                  {formData.gstStatus}
                </Badge>
              </div>
              {formData.gstStatus === "Cancelled" && (
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  This GSTIN is marked as Cancelled in GST records. You can still save this customer.
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
              value={formData.contact}
              onChange={e => setFormData({ ...formData, contact: e.target.value })}
              placeholder="Phone or Email"
            />
          </div>

          <Button
            onClick={handleCreate}
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.name}
            className="w-full mt-2"
          >
            {editingId ? "Update Customer" : "Create Customer"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob
