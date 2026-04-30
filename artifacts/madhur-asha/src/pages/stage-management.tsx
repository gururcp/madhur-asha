import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data - will be replaced with API calls
const mockStages = [
  {
    id: 1,
    name: "ENQUIRY",
    displayName: "Enquiry",
    description: "Initial requirement received, searching for supplier",
    color: "#3b82f6",
    icon: "Search",
    orderSequence: 1,
    slaDays: 2,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 2,
    name: "SUPPLIER_FOUND",
    displayName: "Supplier Found",
    description: "Supplier identified and price obtained",
    color: "#8b5cf6",
    icon: "UserCheck",
    orderSequence: 2,
    slaDays: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 3,
    name: "QUOTED",
    displayName: "Quoted",
    description: "Quote sent to government officer",
    color: "#06b6d4",
    icon: "FileText",
    orderSequence: 3,
    slaDays: 3,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 4,
    name: "PO_RECEIVED",
    displayName: "PO Received",
    description: "Purchase Order received from government",
    color: "#10b981",
    icon: "FileCheck",
    orderSequence: 4,
    slaDays: 7,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 5,
    name: "DISPATCHED",
    displayName: "Dispatched",
    description: "Order dispatched with eway bill",
    color: "#f59e0b",
    icon: "Truck",
    orderSequence: 5,
    slaDays: 2,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 6,
    name: "DELIVERED",
    displayName: "Delivered",
    description: "Delivery completed and accepted",
    color: "#14b8a6",
    icon: "PackageCheck",
    orderSequence: 6,
    slaDays: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 7,
    name: "PAYMENT_DUE",
    displayName: "Payment Due",
    description: "Waiting for government payment",
    color: "#f97316",
    icon: "Clock",
    orderSequence: 7,
    slaDays: 30,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 8,
    name: "PAYMENT_RECEIVED",
    displayName: "Payment Received",
    description: "Payment received from government",
    color: "#22c55e",
    icon: "CheckCircle",
    orderSequence: 8,
    slaDays: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 9,
    name: "SUPPLIER_PAID",
    displayName: "Supplier Paid",
    description: "Supplier payment completed",
    color: "#84cc16",
    icon: "Wallet",
    orderSequence: 9,
    slaDays: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: 10,
    name: "COMPLETED",
    displayName: "Completed",
    description: "Order fully completed and settled",
    color: "#6366f1",
    icon: "CheckCircle2",
    orderSequence: 10,
    slaDays: 0,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const availableIcons = [
  "Search", "UserCheck", "FileText", "FileCheck", "Truck", "PackageCheck",
  "Clock", "CheckCircle", "Wallet", "CheckCircle2", "AlertCircle", "Settings"
];

const colorPresets = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Green", value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Lime", value: "#84cc16" },
];

export default function StageManagementPage() {
  const [stages, setStages] = useState(mockStages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    color: "#3b82f6",
    icon: "Search",
    slaDays: 1,
    isActive: true,
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newStages = [...stages];
    const draggedStage = newStages[draggedIndex];
    newStages.splice(draggedIndex, 1);
    newStages.splice(index, 0, draggedStage);

    // Update order sequences
    newStages.forEach((stage, idx) => {
      stage.orderSequence = idx + 1;
    });

    setStages(newStages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    toast.success("Stage order updated");
    // Here you would call API to save the new order
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.displayName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingId) {
      setStages(stages.map(s => 
        s.id === editingId 
          ? { ...s, ...formData }
          : s
      ));
      toast.success("Stage updated successfully");
    } else {
      const newStage = {
        id: Math.max(...stages.map(s => s.id)) + 1,
        ...formData,
        orderSequence: stages.length + 1,
        createdAt: new Date().toISOString(),
      };
      setStages([...stages, newStage]);
      toast.success("Stage added successfully");
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      displayName: "",
      description: "",
      color: "#3b82f6",
      icon: "Search",
      slaDays: 1,
      isActive: true,
    });
    setEditingId(null);
  };

  const handleEdit = (stage: typeof mockStages[0]) => {
    setFormData({
      name: stage.name,
      displayName: stage.displayName,
      description: stage.description,
      color: stage.color,
      icon: stage.icon,
      slaDays: stage.slaDays,
      isActive: stage.isActive,
    });
    setEditingId(stage.id);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    const stage = stages.find(s => s.id === id);
    if (!stage) return;

    if (confirm(`Are you sure you want to delete "${stage.displayName}"? This cannot be undone.`)) {
      setStages(stages.filter(s => s.id !== id));
      toast.success("Stage deleted successfully");
    }
  };

  const toggleActive = (id: number) => {
    setStages(stages.map(s => 
      s.id === id 
        ? { ...s, isActive: !s.isActive }
        : s
    ));
    toast.success("Stage status updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GeM Procurement Stages</h1>
          <p className="text-muted-foreground mt-1">
            Configure and manage your procurement workflow stages
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-5 w-5" />
          Add Stage
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Drag and Drop to Reorder</p>
              <p className="text-sm text-muted-foreground">
                You can reorder stages by dragging them. The order determines the workflow sequence for all orders.
                Inactive stages won't appear in order creation but existing orders in those stages remain unaffected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Stages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stages.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg SLA Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stages.reduce((sum, s) => sum + s.slaDays, 0) / stages.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stages List */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement Workflow Stages</CardTitle>
          <CardDescription>
            Drag stages to reorder • Click to edit • Toggle to activate/deactivate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg transition-all cursor-move",
                  draggedIndex === index && "opacity-50",
                  stage.isActive 
                    ? "bg-card hover:bg-muted/50 border-border" 
                    : "bg-muted/30 border-muted"
                )}
              >
                {/* Drag Handle */}
                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />

                {/* Order Number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {stage.orderSequence}
                </div>

                {/* Color Indicator */}
                <div 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: stage.color }}
                />

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold truncate">{stage.displayName}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {stage.name}
                    </Badge>
                    {!stage.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {stage.description}
                  </p>
                </div>

                {/* SLA */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{stage.slaDays}d</span>
                </div>

                {/* Active Toggle */}
                <Switch
                  checked={stage.isActive}
                  onCheckedChange={() => toggleActive(stage.id)}
                  className="shrink-0"
                />

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(stage)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(stage.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Stage Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader>
          <DialogTitle>{editingId ? "Edit Stage" : "Add New Stage"}</DialogTitle>
          <DialogDescription>
            {editingId ? "Update stage configuration" : "Create a new procurement stage"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Stage Name (Code) *</Label>
              <Input
                placeholder="e.g., ENQUIRY"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s/g, '_') })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uppercase, no spaces (use underscore)
              </p>
            </div>
            <div>
              <Label>Display Name *</Label>
              <Input
                placeholder="e.g., Enquiry"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              placeholder="Brief description of this stage"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === color.value 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label>SLA Days</Label>
              <Input
                type="number"
                min="0"
                value={formData.slaDays}
                onChange={(e) => setFormData({ ...formData, slaDays: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expected days to complete this stage
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <Label>Active Status</Label>
              <p className="text-xs text-muted-foreground">
                Inactive stages won't appear in new orders
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="h-4 w-4 mr-2" />
              {editingId ? "Update" : "Create"} Stage
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob
