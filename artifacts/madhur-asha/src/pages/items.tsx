import { useState } from "react";
import { useListItems, useCreateItem, useUpdateItem, useDeleteItem } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Package, Search, Loader2, Pencil, Trash2, Check, X, Upload, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ItemsPage() {
  const { data: items, isLoading, refetch } = useListItems();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterGST, setFilterGST] = useState<string>("all");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [inlineEditId, setInlineEditId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<any>(null);
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkPushing, setIsBulkPushing] = useState(false);
  
  // Individual Zoho push
  const [pushingId, setPushingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    hsnCode: "",
    description: "",
    unit: "Nos",
    purchaseRate: "",
    sellingRate: "",
    gstRate: "18",
    itemType: "goods"
  });

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const filteredItems = items?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.hsnCode.includes(search);
    const matchesType = filterType === "all" || item.itemType === filterType;
    const matchesGST = filterGST === "all" || item.gstRate === filterGST;
    return matchesSearch && matchesType && matchesGST;
  });

  const resetForm = () => {
    setFormData({
      name: "",
      hsnCode: "",
      description: "",
      unit: "Nos",
      purchaseRate: "",
      sellingRate: "",
      gstRate: "18",
      itemType: "goods"
    });
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.purchaseRate || !formData.sellingRate) {
      toast.error("Please fill all required fields");
      return;
    }
    
    const submitData: any = formData;
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: submitData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          refetch();
          toast.success("Item updated successfully!");
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to update item");
        }
      });
    } else {
      createMutation.mutate({ data: submitData }, {
        onSuccess: () => {
          setOpen(false);
          resetForm();
          toast.success("Item created successfully!");
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.error || "Failed to create item");
        }
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || "",
      hsnCode: item.hsnCode || "",
      description: item.description || "",
      unit: item.unit || "Nos",
      purchaseRate: item.purchaseRate || "",
      sellingRate: item.sellingRate || "",
      gstRate: item.gstRate || "18",
      itemType: item.itemType || "goods"
    });
    setOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }
    
    setDeletingId(id);
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        setDeletingId(null);
        refetch();
        toast.success("Item deleted successfully!");
      },
      onError: (error: any) => {
        setDeletingId(null);
        toast.error(error?.response?.data?.error || "Failed to delete item");
      }
    });
  };

  // Inline editing
  const startInlineEdit = (item: any) => {
    setInlineEditId(item.id);
    setInlineEditData({
      purchaseRate: item.purchaseRate,
      sellingRate: item.sellingRate
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineEditData(null);
  };

  const saveInlineEdit = () => {
    if (!inlineEditId || !inlineEditData) return;

    const item = items?.find(i => i.id === inlineEditId);
    if (!item) return;

    updateMutation.mutate({ 
      id: inlineEditId, 
      data: {
        ...item,
        purchaseRate: inlineEditData.purchaseRate,
        sellingRate: inlineEditData.sellingRate
      } as any
    }, {
      onSuccess: () => {
        cancelInlineEdit();
        refetch();
        toast.success("Rates updated successfully!");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.error || "Failed to update rates");
      }
    });
  };

  // Bulk selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems?.map(i => i.id) || []);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkPush = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select items to push");
      return;
    }

    setIsBulkPushing(true);
    try {
      // Call bulk push API
      const response = await fetch("/api/items/bulk-push-zoho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: selectedIds })
      });

      if (!response.ok) throw new Error("Bulk push failed");

      const result = await response.json();
      
      // Show results
      const successCount = result.results?.filter((r: any) => r.success).length || 0;
      const failCount = result.results?.length - successCount || 0;

      if (failCount === 0) {
        toast.success(`Successfully pushed ${successCount} items to Zoho!`);
      } else {
        toast.warning(`Pushed ${successCount} items. ${failCount} failed.`);
      }

      setSelectedIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to push items to Zoho");
    } finally {
      setIsBulkPushing(false);
    }
  };

  const handlePushToZoho = async (itemId: number) => {
    setPushingId(itemId);
    try {
      const response = await fetch(`/api/items/${itemId}/push-zoho`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      toast.success(`Item pushed to Zoho successfully! Zoho ID: ${result.zohoId || 'N/A'}`);
      refetch();
    } catch (error: any) {
      console.error("Failed to push item to Zoho:", error);
      const errorMessage = error?.message || "Failed to push item to Zoho";
      toast.error(`Zoho Push Failed: ${errorMessage}`, {
        description: "Check the browser console and server logs for detailed error information.",
        duration: 5000
      });
    } finally {
      setPushingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Items</h1>
          <p className="text-muted-foreground text-sm">Manage your products and services inventory.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button 
              onClick={handleBulkPush}
              disabled={isBulkPushing}
              variant="secondary"
              className="rounded-xl shadow-lg"
            >
              {isBulkPushing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Pushing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Push {selectedIds.length} to Zoho
                </>
              )}
            </Button>
          )}
          <Button onClick={() => { resetForm(); setOpen(true); }} className="rounded-xl shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or HSN code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="goods">Goods</SelectItem>
            <SelectItem value="service">Service</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterGST} onValueChange={setFilterGST}>
          <SelectTrigger className="w-full sm:w-40 bg-card">
            <SelectValue placeholder="GST Rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All GST</SelectItem>
            <SelectItem value="0">0%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
            <SelectItem value="12">12%</SelectItem>
            <SelectItem value="18">18%</SelectItem>
            <SelectItem value="28">28%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredItems?.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border/50">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
          No items found.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="p-4 w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredItems?.length && filteredItems.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">Item Name</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground">HSN/SAC</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Purchase Rate</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-right">Selling Rate</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground text-center">GST</th>
                    <th className="p-4 font-semibold text-sm text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems?.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-foreground block">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">
                                {item.unit}
                              </Badge>
                              <Badge variant={item.itemType === "goods" ? "default" : "secondary"} className="text-xs">
                                {item.itemType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-mono">{item.hsnCode}</td>
                      <td className="p-4 text-right">
                        {inlineEditId === item.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={inlineEditData.purchaseRate}
                            onChange={e => setInlineEditData({ ...inlineEditData, purchaseRate: e.target.value })}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="font-mono">₹{parseFloat(item.purchaseRate).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {inlineEditId === item.id ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={inlineEditData.sellingRate}
                            onChange={e => setInlineEditData({ ...inlineEditData, sellingRate: e.target.value })}
                            className="w-24 text-right"
                          />
                        ) : (
                          <span className="font-mono font-bold">₹{parseFloat(item.sellingRate).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant="secondary" className="text-xs">
                          {item.gstRate}%
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {inlineEditId === item.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={saveInlineEdit}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Check className="w-5 h-5 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelInlineEdit}
                              >
                                <X className="w-5 h-5 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {item.zohoSyncStatus === "synced" && item.zohoId ? (
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
                                      <p className="text-xs font-mono">ID: {item.zohoId}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handlePushToZoho(item.id)}
                                  disabled={pushingId === item.id}
                                  title="Push to Zoho"
                                >
                                  {pushingId === item.id ? (
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
                                onClick={() => handleEdit(item)}
                                title="Edit item"
                              >
                                <Pencil className="w-5 h-5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5" />
                                )}
                              </Button>
                            </>
                          )}
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
            {filteredItems?.map((item) => (
              <Card key={item.id} className="p-4 hover:border-primary/40">
                <div className="flex items-start gap-3 mb-3">
                  <Checkbox
                    checked={selectedIds.includes(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    className="mt-1"
                  />
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">HSN: {item.hsnCode}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.unit}</Badge>
                      <Badge variant={item.itemType === "goods" ? "default" : "secondary"} className="text-xs">
                        {item.itemType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{item.gstRate}%</Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Purchase</span>
                    <p className="font-mono">₹{parseFloat(item.purchaseRate).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Selling</span>
                    <p className="font-mono font-bold">₹{parseFloat(item.sellingRate).toFixed(2)}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/50">
                  {item.zohoSyncStatus === "synced" && item.zohoId ? (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 px-2 py-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Synced to Zoho</span>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => handlePushToZoho(item.id)}
                      disabled={pushingId === item.id}
                    >
                      {pushingId === item.id ? (
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
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
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

      {/* Add/Edit Item Dialog */}
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Item" : "Add New Item"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update item details below." : "Enter item details to add to inventory."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Item Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Item Name *</label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Steel Rod 12mm"
            />
          </div>

          {/* HSN/SAC Code */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">HSN/SAC Code</label>
            <Input
              value={formData.hsnCode}
              onChange={e => setFormData({ ...formData, hsnCode: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 7213 (optional)"
              maxLength={8}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Optional 4-8 digit code for tax classification</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Description</label>
            <Input
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          {/* Unit and Item Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Unit *</label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nos">Nos</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Grams">Grams</SelectItem>
                  <SelectItem value="Litre">Litre</SelectItem>
                  <SelectItem value="Metre">Metre</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                  <SelectItem value="Bag">Bag</SelectItem>
                  <SelectItem value="Piece">Piece</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Type *</label>
              <Select
                value={formData.itemType}
                onValueChange={(value) => setFormData({ ...formData, itemType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goods">Goods</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purchase and Selling Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Purchase Rate *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchaseRate}
                onChange={e => setFormData({ ...formData, purchaseRate: e.target.value })}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Selling Rate *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.sellingRate}
                onChange={e => setFormData({ ...formData, sellingRate: e.target.value })}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
          </div>

          {/* GST Rate */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">GST Rate *</label>
            <Select
              value={formData.gstRate}
              onValueChange={(value) => setFormData({ ...formData, gstRate: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="12">12%</SelectItem>
                <SelectItem value="18">18%</SelectItem>
                <SelectItem value="28">28%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.name || !formData.purchaseRate || !formData.sellingRate}
            className="w-full mt-2"
          >
            {editingId ? "Update Item" : "Create Item"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob