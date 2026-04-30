import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  Package,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// Types
interface GemStage {
  id: number;
  name: string;
  color: string;
  displayName: string;
  order: number;
}

interface Order {
  id: number;
  orderNumber: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  stageId: number;
  customerName: string | null;
  supplierName: string | null;
  saleTotalIncGst: string;
  purchaseTotalIncGst: string;
  netProfit: string;
  paymentStatus: string;
  supplierPaymentStatus: string;
  receivedAmount: string;
  supplierPaidAmount: string;
  createdAt: string;
}

export default function OrdersPage() {
  // Component load indicator - this runs immediately when file loads
  console.log('[ORDERS] ========================================');
  console.log('[ORDERS] OrdersPage component LOADED and EXECUTING');
  console.log('[ORDERS] Timestamp:', new Date().toISOString());
  console.log('[ORDERS] ========================================');
  
  // Data state
  const [stages, setStages] = useState<GemStage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [customerPaymentFilter, setCustomerPaymentFilter] = useState<string>("all");
  const [supplierPaymentFilter, setSupplierPaymentFilter] = useState<string>("all");
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);

  // Fetch data function
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[ORDERS] Fetching orders data...');

      // Fetch stages and orders in parallel
      const [stagesResponse, ordersResponse] = await Promise.all([
        fetch("/api/gem-stages", { credentials: "include" }),
        fetch("/api/orders", { credentials: "include" }),
      ]);

      if (!stagesResponse.ok) {
        throw new Error("Failed to fetch gem stages");
      }

      if (!ordersResponse.ok) {
        throw new Error("Failed to fetch orders");
      }

      const stagesData = await stagesResponse.json();
      const ordersData = await ordersResponse.json();

      setStages(stagesData);
      // Handle new pagination response structure
      setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.orders || []));
      
      console.log('[ORDERS] Data fetched successfully:', {
        stages: stagesData.length,
        orders: Array.isArray(ordersData) ? ordersData.length : ordersData.orders?.length || 0
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on mount and when returning to this page
  useEffect(() => {
    console.log('[ORDERS] useEffect triggered - fetching data');
    fetchData();
  }, []); // Empty dependency array means this runs on mount

  // Refetch data when window gains focus (user returns to tab/page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[ORDERS] Window focused - refetching data');
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Helper functions for payment calculations
  const parseAmount = (amount: string | null | undefined) => {
    const parsed = parseFloat(amount || "0");
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getPaymentProgress = (paidAmount: string, totalAmount: string) => {
    const paid = parseAmount(paidAmount);
    const total = parseAmount(totalAmount);

    // Handle missing/null/0 total amounts (old orders without financial data)
    if (total <= 0) {
      return {
        paid,
        total,
        percentage: 0,
        roundedPercentage: 0,
        isPending: true,
        isComplete: false,
        isOverpaid: false,
        isMissingData: true, // Flag for old orders
      };
    }

    const rawPercentage = (paid / total) * 100;
    const percentage = Number.isFinite(rawPercentage) ? rawPercentage : 0;
    const roundedPercentage = Math.round(percentage);
    const balance = total - paid;

    return {
      paid,
      total,
      percentage,
      roundedPercentage,
      isPending: paid <= 0,
      isComplete: balance === 0 || percentage === 100,
      isOverpaid: percentage > 100,
      isMissingData: false,
    };
  };

  // Filter orders
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.itemDescription.toLowerCase().includes(search.toLowerCase()) ||
      (order.customerName?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStage = stageFilter === "all" || (order.stageId !== null && order.stageId.toString() === stageFilter);
    
    // Calculate actual payment status for customer payments
    const customerPayment = getPaymentProgress(order.receivedAmount, order.saleTotalIncGst);
    let customerStatus = "pending";
    if (customerPayment.isMissingData) {
      customerStatus = "pending";
    } else if (customerPayment.isOverpaid) {
      customerStatus = "overdue"; // Using overdue for overpaid in filter
    } else if (customerPayment.isComplete) {
      customerStatus = "paid";
    } else if (customerPayment.percentage > 0) {
      customerStatus = "partial";
    }
    const matchesCustomerPayment = customerPaymentFilter === "all" || customerStatus === customerPaymentFilter;
    
    // Calculate actual payment status for supplier payments
    const supplierPayment = getPaymentProgress(order.supplierPaidAmount, order.purchaseTotalIncGst);
    let supplierStatus = "pending";
    if (supplierPayment.isMissingData) {
      supplierStatus = "pending";
    } else if (supplierPayment.isOverpaid) {
      supplierStatus = "overpaid";
    } else if (supplierPayment.isComplete) {
      supplierStatus = "paid";
    } else if (supplierPayment.percentage > 0) {
      supplierStatus = "partial";
    }
    const matchesSupplierPayment = supplierPaymentFilter === "all" || supplierStatus === supplierPaymentFilter;
    
    return matchesSearch && matchesStage && matchesCustomerPayment && matchesSupplierPayment;
  }) : [];

  // Group orders by stage for Kanban view
  const ordersByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredOrders.filter(order => order.stageId === stage.id);
    return acc;
  }, {} as Record<number, Order[]>);

  const getStageInfo = (stageId: number) => {
    return stages.find(s => s.id === stageId);
  };

  const getSupplierPaymentBadge = (paidAmount: string, totalAmount: string, status?: string) => {
    const payment = getPaymentProgress(paidAmount, totalAmount);

    // Handle old orders without financial data
    if (payment.isMissingData) {
      return (
        <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-600 border-gray-200">
          <AlertCircle className="h-3 w-3" />
          To Pay: N/A
        </Badge>
      );
    }

    let config = {
      variant: "secondary" as const,
      label: "Paid: 0%",
      icon: Clock,
      className: "bg-orange-100 text-orange-800 border-orange-200"
    };

    if (payment.isOverpaid) {
      config = {
        variant: "default" as const,
        label: "To Pay: Overpaid",
        icon: AlertCircle,
        className: "bg-red-200 text-red-900 border-red-300"
      };
    } else if (payment.isComplete) {
      config = {
        variant: "default" as const,
        label: "Paid: 100%",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-800 border-green-200"
      };
    } else if (!payment.isPending && payment.percentage > 0) {
      config = {
        variant: "default" as const,
        label: `Paid: ${payment.roundedPercentage}%`,
        icon: AlertCircle,
        className: "bg-orange-200 text-orange-900 border-orange-300"
      };
    } else if (status === "overpaid") {
      config = {
        variant: "default" as const,
        label: "To Pay: Overpaid",
        icon: AlertCircle,
        className: "bg-red-200 text-red-900 border-red-300"
      };
    }

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCustomerPaymentBadge = (paidAmount: string, totalAmount: string, status?: string) => {
    const payment = getPaymentProgress(paidAmount, totalAmount);

    // Handle old orders without financial data
    if (payment.isMissingData) {
      return (
        <Badge variant="secondary" className="gap-1 bg-gray-100 text-gray-600 border-gray-200">
          <AlertCircle className="h-3 w-3" />
          To Receive: N/A
        </Badge>
      );
    }

    let config = {
      variant: "secondary" as const,
      label: "Received: 0%",
      icon: Clock,
      className: "bg-blue-100 text-blue-800 border-blue-200"
    };

    if (payment.isOverpaid) {
      config = {
        variant: "default" as const,
        label: "To Receive: Overpaid",
        icon: AlertCircle,
        className: "bg-green-200 text-green-900 border-green-300"
      };
    } else if (payment.isComplete) {
      config = {
        variant: "default" as const,
        label: "Received: 100%",
        icon: CheckCircle2,
        className: "bg-green-100 text-green-800 border-green-200"
      };
    } else if (!payment.isPending && payment.percentage > 0) {
      config = {
        variant: "default" as const,
        label: `Received: ${payment.roundedPercentage}%`,
        icon: AlertCircle,
        className: "bg-blue-200 text-blue-900 border-blue-300"
      };
    } else if (status === "overdue") {
      config = {
        variant: "destructive" as const,
        label: "To Receive: Overdue!",
        icon: AlertCircle,
        className: "bg-red-100 text-red-800 border-red-200"
      };
    }

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    setDeletingOrderId(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete order" }));
        throw new Error(errorData.error || "Failed to delete order");
      }

      toast.success("Order deleted successfully");
      // Reload the page to refresh the orders list
      window.location.reload();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete order");
      setDeletingOrderId(null);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  console.log('[ORDERS] Component rendering');
  console.log('[ORDERS] Orders count:', orders.length);
  console.log('[ORDERS] Filtered orders count:', filteredOrders.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your procurement orders and track their progress
          </p>
        </div>
        {(() => {
          console.log('[ORDERS] New Order button rendered in DOM');
          console.log('[ORDERS] Link href:', '/orders/create');
          return null;
        })()}
        <Link
          href="/orders/create"
          onClick={(e) => {
            console.log('[ORDERS] ========================================');
            console.log('[ORDERS] New Order button CLICKED!');
            console.log('[ORDERS] Event:', e);
            console.log('[ORDERS] Event type:', e.type);
            console.log('[ORDERS] Target:', e.target);
            console.log('[ORDERS] CurrentTarget:', e.currentTarget);
            console.log('[ORDERS] Navigating to:', '/orders/create');
            console.log('[ORDERS] ========================================');
          }}
          className="inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/20 h-14 px-8 text-lg gap-2"
        >
          <Plus className="h-5 w-5" />
          New Order
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading orders...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your data</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load orders</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters and View Toggle */}
      {!isLoading && !error && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by order number, item, or customer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Stage Filter */}
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>
                        {stage.displayName || stage.name.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Customer Payment Filter */}
                <Select value={customerPaymentFilter} onValueChange={setCustomerPaymentFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="To Receive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (To Receive)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Done ✓</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                {/* Supplier Payment Filter */}
                <Select value={supplierPaymentFilter} onValueChange={setSupplierPaymentFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="To Pay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All (To Pay)</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Done ✓</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "kanban" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("kanban")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          {viewMode === "list" ? (
            /* List View */
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                    <p className="text-muted-foreground mb-4">
                      {search || stageFilter !== "all" || customerPaymentFilter !== "all" || supplierPaymentFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Create your first order to get started"}
                    </p>
                    {!search && stageFilter === "all" && customerPaymentFilter === "all" && supplierPaymentFilter === "all" && (
                      <>
                        {(() => {
                          console.log('[ORDERS] Create Order button (empty state) rendered in DOM');
                          console.log('[ORDERS] Link href:', '/orders/create');
                          return null;
                        })()}
                        <Link
                          href="/orders/create"
                          onClick={(e) => {
                            console.log('[ORDERS] ========================================');
                            console.log('[ORDERS] Create Order button (empty state) CLICKED!');
                            console.log('[ORDERS] Event:', e);
                            console.log('[ORDERS] Event type:', e.type);
                            console.log('[ORDERS] Target:', e.target);
                            console.log('[ORDERS] CurrentTarget:', e.currentTarget);
                            console.log('[ORDERS] Navigating to:', '/orders/create');
                            console.log('[ORDERS] ========================================');
                          }}
                          className="inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/20 h-11 px-5 py-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Order
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map(order => {
                  const stage = getStageInfo(order.stageId);
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Order Number and Stage */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <Link href={`/orders/${order.id}`}>
                                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                                  {order.orderNumber}
                                </h3>
                              </Link>
                              {stage && (
                                <Badge
                                  style={{ backgroundColor: stage.color }}
                                  className="text-white"
                                >
                                  {stage.displayName || stage.name.replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {getSupplierPaymentBadge(order.supplierPaidAmount, order.purchaseTotalIncGst, order.supplierPaymentStatus)}
                              {getCustomerPaymentBadge(order.receivedAmount, order.saleTotalIncGst, order.paymentStatus)}
                            </div>

                            {/* Item Description */}
                            <p className="text-sm text-muted-foreground">
                              {order.itemDescription} • {order.quantity} {order.unit}
                            </p>

                            {/* Customer and Supplier */}
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-muted-foreground">Customer:</span>{" "}
                                <span className="font-medium">{order.customerName || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Supplier:</span>{" "}
                                <span className="font-medium">{order.supplierName || "N/A"}</span>
                              </div>
                            </div>

                            {/* Financial Info */}
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-muted-foreground">Sale Value:</span>{" "}
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(order.saleTotalIncGst)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Net Profit:</span>{" "}
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(order.netProfit)}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                {format(new Date(order.createdAt), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Link href={`/orders/${order.id}`}>
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </Link>
                              <Link href={`/orders/${order.id}/edit`}>
                                <DropdownMenuItem>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Order
                                </DropdownMenuItem>
                              </Link>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteOrder(order.id)}
                                disabled={deletingOrderId === order.id}
                              >
                                {deletingOrderId === order.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Order
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            /* Kanban View */
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {stages.map(stage => {
                  const stageOrders = ordersByStage[stage.id] || [];
                  const totalValue = stageOrders.reduce(
                    (sum, order) => sum + parseFloat(order.saleTotalIncGst),
                    0
                  );

                  return (
                    <div key={stage.id} className="w-80 flex-shrink-0">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {stage.displayName || stage.name.replace(/_/g, ' ')}
                            </CardTitle>
                            <Badge
                              variant="secondary"
                              style={{ backgroundColor: stage.color + '20', color: stage.color }}
                            >
                              {stageOrders.length}
                            </Badge>
                          </div>
                          {totalValue > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(totalValue.toString())}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {stageOrders.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                              No orders
                            </div>
                          ) : (
                            stageOrders.map(order => (
                              <Link key={order.id} href={`/orders/${order.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                  <CardContent className="p-4 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-semibold text-sm">
                                        {order.orderNumber}
                                      </h4>
                                      <div className="flex flex-col gap-1">
                                        {getSupplierPaymentBadge(order.supplierPaidAmount, order.purchaseTotalIncGst, order.supplierPaymentStatus)}
                                        {getCustomerPaymentBadge(order.receivedAmount, order.saleTotalIncGst, order.paymentStatus)}
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {order.itemDescription}
                                    </p>
                                    <div className="text-xs text-muted-foreground">
                                      {order.customerName || "N/A"}
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <span className="text-xs font-semibold text-green-600">
                                        {formatCurrency(order.saleTotalIncGst)}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(order.createdAt), "MMM dd")}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Made with Bob
