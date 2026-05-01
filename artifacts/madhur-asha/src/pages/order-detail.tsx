import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Upload,
  Plus,
  ChevronRight,
  Package,
  Building2,
  Truck,
  FileText,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  CreditCard,
  Receipt,
  Calculator as CalcIcon,
  Loader2,
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
  stageId: number;
  // Flat fields from backend
  itemId: number | null;
  itemName: string | null;
  itemCode: string | null;
  stageName: string | null;
  stageDisplayName: string | null;
  stageColor: string | null;
  itemDescription: string;
  quantity: number;
  unit: string;
  customerId: number | null;
  customerName: string | null;
  customerGstin: string | null;
  supplierId: number | null;
  supplierName: string | null;
  supplierGstin: string | null;
  supplierRate: string;
  purchaseGstPct: string;
  purchaseTotalExGst: string;
  purchaseTotalIncGst: string;
  advancePaid: string;
  supplierCreditDays: number | null;
  supplierPaymentDue: string | null;
  supplierPaymentDueDate: string | null;
  sellingRate: string;
  saleGstPct: string;
  saleTotalExGst: string;
  saleTotalIncGst: string;
  grossProfit: string;
  commission: string;
  otherExpenses: string;
  allocatedGenericExpenses: string;
  netProfit: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  invoiceAmount: string;
  receivedAmount: string;
  paymentDueDate: string | null;
  paymentStatus: string;
  supplierInvoiceNumber: string | null;
  supplierInvoiceAmount: string;
  supplierPaidAmount: string;
  poNumber: string | null;
  poDate: string | null;
  ewayBillNumber: string | null; // Standardized to lowercase 'w'
  dispatchDate: string | null;
  transportDetails: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StageHistory {
  id: number;
  orderId: number;
  fromStageId: number | null;
  toStageId: number;
  fromStageName: string | null;
  fromStageDisplayName: string | null;
  fromStageColor: string | null;
  toStageName: string | null;
  toStageDisplayName: string | null;
  toStageColor: string | null;
  changedAt: string;
  changedBy: number;
  notes: string | null;
  durationDays: number | null;
}

interface Payment {
  id: number;
  orderId: number;
  paymentType: "receivable" | "payable";
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const [location, navigate] = useLocation();
  const orderId = params.id;
  
  // Detect if we're in create mode (orderId === "create")
  const isCreateMode = orderId === "create";
  
  // Detect if we're in edit mode based on URL
  // Initialize edit mode based on URL - only set once on mount
  const [isEditMode, setIsEditMode] = useState(() => {
    return location.endsWith('/edit') || isCreateMode;
  });
  
  // Update edit mode when location changes (but not on every render)
  useEffect(() => {
    const editMode = location.endsWith('/edit') || isCreateMode;
    // Only update if the value actually changed
    setIsEditMode(prev => prev !== editMode ? editMode : prev);
  }, [location, isCreateMode]);

  // Data state
  const [order, setOrder] = useState<Order | null>(null);
  const [stages, setStages] = useState<GemStage[]>([]);
  const [stageHistory, setStageHistory] = useState<StageHistory[]>([]);
  const [payments, setPayments] = useState<{ receivable: Payment[]; payable: Payment[] }>({
    receivable: [],
    payable: [],
  });
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [error, setError] = useState<string | null>(null);
  
  // Create mode: Dropdown data
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(isCreateMode);
  
  // Create mode: Form data
  const [formData, setFormData] = useState({
    customerId: '',
    supplierId: '',
    supplierRate: '',
    purchaseGstPct: '',
    sellingRate: '',
    saleGstPct: '',
    notes: '',
  });
  
  // Multi-item support: Array of items for the order
  const [orderItems, setOrderItems] = useState<Array<{
    id: string; // Temporary ID for UI management
    itemId: string;
    itemDescription: string;
    quantity: string;
    unit: string;
  }>>([
    {
      id: crypto.randomUUID(),
      itemId: '',
      itemDescription: '',
      quantity: '',
      unit: 'Nos',
    }
  ]);
  
  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"receivable" | "payable">("receivable");
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  
  // Stage transition form state
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [stageNotes, setStageNotes] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Fetch dropdown data for create mode
  useEffect(() => {
    if (!isCreateMode) {
      return;
    }
    
    const fetchDropdownData = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
        const [itemsRes, customersRes, suppliersRes, stagesRes] = await Promise.all([
          fetch(`${backendUrl}/api/items`, { credentials: 'include' }),
          fetch(`${backendUrl}/api/customers`, { credentials: 'include' }),
          fetch(`${backendUrl}/api/suppliers`, { credentials: 'include' }),
          fetch(`${backendUrl}/api/gem-stages`, { credentials: 'include' }),
        ]);
        
        if (!itemsRes.ok || !customersRes.ok || !suppliersRes.ok || !stagesRes.ok) {
          const errors = [];
          if (!itemsRes.ok) errors.push(`items: ${itemsRes.status}`);
          if (!customersRes.ok) errors.push(`customers: ${customersRes.status}`);
          if (!suppliersRes.ok) errors.push(`suppliers: ${suppliersRes.status}`);
          if (!stagesRes.ok) errors.push(`stages: ${stagesRes.status}`);
          throw new Error(`Failed to fetch dropdown data: ${errors.join(', ')}`);
        }
        
        const [itemsData, customersData, suppliersData, stagesData] = await Promise.all([
          itemsRes.json(),
          customersRes.json(),
          suppliersRes.json(),
          stagesRes.json(),
        ]);
        
        setItems(itemsData);
        setCustomers(customersData);
        setSuppliers(suppliersData);
        setStages(stagesData);
        
        // Check if required data is available
        if (itemsData.length === 0 || customersData.length === 0 || suppliersData.length === 0) {
          const missing = [];
          if (itemsData.length === 0) missing.push('items');
          if (customersData.length === 0) missing.push('customers');
          if (suppliersData.length === 0) missing.push('suppliers');
          setError(`Unable to load required data: ${missing.join(', ')}. Please ensure they exist.`);
          toast.error(`Missing required data: ${missing.join(', ')}`);
        }
      } catch (err) {
        toast.error('Failed to load form data');
        setError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        setIsLoadingDropdowns(false);
      }
    };
    
    fetchDropdownData();
  }, [isCreateMode]);

  // Pre-fill form data from URL parameters (calculator integration)
  useEffect(() => {
    if (!isCreateMode) {
      return;
    }
    
    try {
      // Parse URL query parameters
      const searchParams = new URLSearchParams(window.location.search);
      console.log('[ORDER-DETAIL] URL search params:', window.location.search);
      
      // Check if we have calculation data in URL
      const supplierRate = searchParams.get('supplierRate');
      const sellingRate = searchParams.get('sellingRate');
      
      if (supplierRate || sellingRate) {
        setFormData(prev => ({
          ...prev,
          supplierRate: supplierRate || prev.supplierRate,
          purchaseGstPct: searchParams.get('purchaseGstPct') || prev.purchaseGstPct,
          sellingRate: sellingRate || prev.sellingRate,
          saleGstPct: searchParams.get('saleGstPct') || prev.saleGstPct,
        }));
        toast.success('Calculation data loaded! Please select item, customer, and supplier.');
      }
    } catch (err) {
      console.error('[ORDER-DETAIL] Error parsing URL parameters:', err);
      toast.error('Failed to load calculation data');
    }
  }, [isCreateMode, location]);

  // Fetch order data (skip if in create mode)
  useEffect(() => {
    if (isCreateMode) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
        const [orderResponse, stagesResponse, historyResponse, paymentsResponse] = await Promise.all([
          fetch(`${backendUrl}/api/orders/${orderId}`, { credentials: "include" }),
          fetch(`${backendUrl}/api/gem-stages`, { credentials: "include" }),
          fetch(`${backendUrl}/api/orders/${orderId}/history`, { credentials: "include" }),
          fetch(`${backendUrl}/api/orders/${orderId}/payments`, { credentials: "include" }),
        ]);

        if (!orderResponse.ok) {
          if (orderResponse.status === 404) {
            throw new Error("Order not found");
          }
          throw new Error("Failed to fetch order");
        }

        if (!stagesResponse.ok) {
          throw new Error("Failed to fetch gem stages");
        }

        if (!historyResponse.ok) {
          throw new Error("Failed to fetch stage history");
        }

        if (!paymentsResponse.ok) {
          throw new Error("Failed to fetch payments");
        }

        const orderData = await orderResponse.json();
        const stagesData = await stagesResponse.json();
        const historyData = await historyResponse.json();
        const paymentsData = await paymentsResponse.json();

        setOrder(orderData);
        setStages(stagesData);
        setStageHistory(historyData);
        
        // Group payments by type
        const receivablePayments = paymentsData.filter((p: Payment) => p.paymentType === "receivable");
        const payablePayments = paymentsData.filter((p: Payment) => p.paymentType === "payable");
        setPayments({
          receivable: receivablePayments,
          payable: payablePayments,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
        toast.error(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [orderId, isCreateMode]);

  // Recalculate financial totals when rates or GST change in edit mode
  useEffect(() => {
    if (!isEditMode || !order || isCreateMode) return;
    
    const quantity = parseFloat(order.quantity?.toString() || "0");
    const supplierRate = parseFloat(order.supplierRate?.toString() || "0");
    const purchaseGstPct = parseFloat(order.purchaseGstPct?.toString() || "0");
    const sellingRate = parseFloat(order.sellingRate?.toString() || "0");
    const saleGstPct = parseFloat(order.saleGstPct?.toString() || "0");
    
    // Calculate purchase totals
    const purchaseTotalExGst = quantity * supplierRate;
    const purchaseTotalIncGst = purchaseTotalExGst * (1 + purchaseGstPct / 100);
    
    // Calculate sale totals
    const saleTotalExGst = quantity * sellingRate;
    const saleTotalIncGst = saleTotalExGst * (1 + saleGstPct / 100);
    
    // Calculate profit
    const grossProfit = saleTotalExGst - purchaseTotalExGst;
    const netProfit = grossProfit - parseFloat(order.commission?.toString() || "0") - parseFloat(order.otherExpenses?.toString() || "0") - parseFloat(order.allocatedGenericExpenses?.toString() || "0");
    
    // Update order with calculated values
    setOrder(prev => prev ? {
      ...prev,
      purchaseTotalExGst: purchaseTotalExGst.toString(),
      purchaseTotalIncGst: purchaseTotalIncGst.toString(),
      saleTotalExGst: saleTotalExGst.toString(),
      saleTotalIncGst: saleTotalIncGst.toString(),
      grossProfit: grossProfit.toString(),
      netProfit: netProfit.toString(),
    } : null);
  }, [order?.supplierRate, order?.purchaseGstPct, order?.sellingRate, order?.saleGstPct, order?.quantity, order?.commission, order?.otherExpenses, order?.allocatedGenericExpenses, isEditMode, isCreateMode]);

  // Calculate total payments from payment history
  const totalReceivedFromCustomer = useMemo(() => {
    return payments.receivable.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || "0");
    }, 0);
  }, [payments.receivable]);

  const totalPaidToSupplier = useMemo(() => {
    return payments.payable.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount || "0");
    }, 0);
  }, [payments.payable]);

  // Calculate balance due amounts
  const customerBalanceDue = useMemo(() => {
    const invoiceTotal = parseFloat(order?.saleTotalIncGst || "0");
    return invoiceTotal - totalReceivedFromCustomer;
  }, [order?.saleTotalIncGst, totalReceivedFromCustomer]);

  const supplierBalanceDue = useMemo(() => {
    const invoiceTotal = parseFloat(order?.purchaseTotalIncGst || "0");
    return invoiceTotal - totalPaidToSupplier;
  }, [order?.purchaseTotalIncGst, totalPaidToSupplier]);

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const response = await fetch(`${backendUrl}/api/orders/${orderId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete order" }));
        throw new Error(errorData.error || "Failed to delete order");
      }

      toast.success("Order deleted successfully");
      navigate("/orders");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete order");
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.customerId) errors.push('Customer is required');
    if (!formData.supplierId) errors.push('Supplier is required');
    
    // Validate items
    if (orderItems.length === 0) {
      errors.push('At least one item is required');
    } else {
      orderItems.forEach((item, index) => {
        if (!item.itemId) errors.push(`Item ${index + 1}: Item selection is required`);
        if (!item.quantity || parseFloat(item.quantity) <= 0) errors.push(`Item ${index + 1}: Valid quantity is required`);
      });
    }
    
    // Validate pricing fields only if at least one is provided
    const hasSupplierRate = formData.supplierRate && formData.supplierRate.trim() !== '';
    const hasSellingRate = formData.sellingRate && formData.sellingRate.trim() !== '';
    
    if (hasSupplierRate && parseFloat(formData.supplierRate) <= 0) {
      errors.push('Supplier rate must be greater than 0');
    }
    if (hasSellingRate && parseFloat(formData.sellingRate) <= 0) {
      errors.push('Selling rate must be greater than 0');
    }
    
    // If one rate is provided, both should be provided
    if ((hasSupplierRate && !hasSellingRate) || (!hasSupplierRate && hasSellingRate)) {
      errors.push('Both supplier rate and selling rate must be provided together');
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return false;
    }
    
    return true;
  };

  const handleCreateOrder = async () => {
    console.log('[ORDER-DETAIL] ========================================');
    console.log('[ORDER-DETAIL] handleCreateOrder called');
    console.log('[ORDER-DETAIL] Current formData:', formData);
    console.log('[ORDER-DETAIL] Current orderItems:', orderItems);
    console.log('[ORDER-DETAIL] Current suppliers state:', suppliers);
    console.log('[ORDER-DETAIL] Current items state:', items);
    console.log('[ORDER-DETAIL] Current customers state:', customers);
    console.log('[ORDER-DETAIL] Current stages state:', stages);
    
    // Validate required fields
    console.log('[ORDER-DETAIL] Validating required fields...');
    if (!validateForm()) {
      console.log('[ORDER-DETAIL] ❌ Validation failed');
      return;
    }

    console.log('[ORDER-DETAIL] ✅ Validation passed');
    console.log('[ORDER-DETAIL] Setting isCreatingOrder to true');
    setIsCreatingOrder(true);
    
    try {
      // Get the first stage as default
      console.log('[ORDER-DETAIL] Finding default stage...');
      const defaultStage = stages.find(s => s.order === 1) || stages[0];
      console.log('[ORDER-DETAIL] Default stage:', defaultStage);
      
      if (!defaultStage) {
        throw new Error('No stages available');
      }

      // Create an order for each item
      const createdOrders = [];
      const totalItems = orderItems.length;
      
      for (let i = 0; i < orderItems.length; i++) {
        const item = orderItems[i];
        console.log(`[ORDER-DETAIL] Creating order ${i + 1}/${totalItems} for item:`, item);
        
        // Build payload with optional pricing fields
        const orderPayload: any = {
          itemId: parseInt(item.itemId),
          customerId: parseInt(formData.customerId),
          supplierId: parseInt(formData.supplierId),
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          itemDescription: item.itemDescription,
          stageId: defaultStage.id,
        };
        
        // Add pricing fields only if provided
        if (formData.supplierRate && formData.supplierRate.trim() !== '') {
          orderPayload.supplierRate = parseFloat(formData.supplierRate);
          orderPayload.purchaseGstPct = parseFloat(formData.purchaseGstPct || '0');
        }
        
        if (formData.sellingRate && formData.sellingRate.trim() !== '') {
          orderPayload.sellingRate = parseFloat(formData.sellingRate);
          orderPayload.saleGstPct = parseFloat(formData.saleGstPct || '0');
        }
        
        if (formData.notes) {
          orderPayload.notes = formData.notes;
        }
        
        console.log('[ORDER-DETAIL] Order payload:', JSON.stringify(orderPayload, null, 2));
        console.log('[ORDER-DETAIL] Sending POST request to /api/orders');

        const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
        const response = await fetch(`${backendUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(orderPayload),
        });

        console.log('[ORDER-DETAIL] Response received:', response.ok, 'status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to create order' }));
          console.log('[ORDER-DETAIL] Error response:', errorData);
          throw new Error(errorData.error || `Failed to create order for item ${i + 1}`);
        }

        const newOrder = await response.json();
        console.log(`[ORDER-DETAIL] ✅ Order ${i + 1}/${totalItems} created successfully:`, newOrder);
        createdOrders.push(newOrder);
      }
      
      // Show success message
      if (createdOrders.length === 1) {
        toast.success('Order created successfully');
        console.log('[ORDER-DETAIL] Navigating to /orders/' + createdOrders[0].id);
        navigate(`/orders/${createdOrders[0].id}`);
      } else {
        toast.success(`${createdOrders.length} orders created successfully`);
        console.log('[ORDER-DETAIL] Navigating to /orders');
        navigate('/orders');
      }
    } catch (error) {
      console.error('[ORDER-DETAIL] ❌ Error creating order:', error);
      console.error('[ORDER-DETAIL] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      console.log('[ORDER-DETAIL] Setting isCreatingOrder to false');
      setIsCreatingOrder(false);
    }
  };
  
  const handleSaveEdit = async () => {
    if (!order) return;
    
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const response = await fetch(`${backendUrl}/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerId: order.customerId,
          supplierId: order.supplierId,
          itemId: order.itemId,
          itemDescription: order.itemDescription,
          quantity: order.quantity,
          unit: order.unit,
          supplierRate: order.supplierRate,
          purchaseGstPct: order.purchaseGstPct,
          sellingRate: order.sellingRate,
          saleGstPct: order.saleGstPct,
          commission: order.commission,
          otherExpenses: order.otherExpenses,
          invoiceNumber: order.invoiceNumber,
          invoiceDate: order.invoiceDate,
          ewayBillNumber: order.ewayBillNumber,
          transportDetails: order.transportDetails,
          paymentDueDate: order.paymentDueDate,
          notes: order.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update order' }));
        throw new Error(errorData.error || 'Failed to update order');
      }
      
      const updatedOrder = await response.json();
      setOrder(updatedOrder);
      setIsEditMode(false);
      toast.success("Order updated successfully");
      navigate(`/orders/${order.id}`);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order');
    }
  };
  
  const handleStageTransition = async () => {
    if (!selectedStageId || !order) {
      toast.error("Please select a stage");
      return;
    }
    
    setIsTransitioning(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          stageId: parseInt(selectedStageId),
          notes: stageNotes || `Stage changed from ${order.stageName} to new stage`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update stage' }));
        throw new Error(errorData.error || 'Failed to update stage');
      }
      
      toast.success("Stage updated successfully");
      setStageDialogOpen(false);
      setSelectedStageId("");
      setStageNotes("");
      
      // Refresh order data and stage history
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const [orderResponse, historyResponse] = await Promise.all([
        fetch(`${backendUrl}/api/orders/${orderId}`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/orders/${orderId}/history`, { credentials: 'include' }),
      ]);
      
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrder(orderData);
      }
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setStageHistory(historyData);
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update stage");
    } finally {
      setIsTransitioning(false);
    }
  };
  
  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentDate || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    setIsRecordingPayment(true);
    try {
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const response = await fetch(`${backendUrl}/api/orders/${orderId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paymentType,
          amount,
          paymentDate,
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          notes: paymentNotes || undefined,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to record payment' }));
        throw new Error(errorData.error || 'Failed to record payment');
      }
      
      const result = await response.json();
      
      toast.success(`Payment recorded successfully: ${formatCurrency(amount.toString())}`);
      
      // Close dialog and reset form
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod("");
      setReferenceNumber("");
      setPaymentNotes("");
      
      // Refresh order and payment data without page reload
      const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
      const [orderResponse, paymentsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/orders/${orderId}`, { credentials: 'include' }),
        fetch(`${backendUrl}/api/orders/${orderId}/payments`, { credentials: 'include' }),
      ]);
      
      if (orderResponse.ok && paymentsResponse.ok) {
        const orderData = await orderResponse.json();
        const paymentsData = await paymentsResponse.json();
        
        setOrder(orderData);
        const receivablePayments = paymentsData.filter((p: Payment) => p.paymentType === "receivable");
        const payablePayments = paymentsData.filter((p: Payment) => p.paymentType === "payable");
        setPayments({
          receivable: receivablePayments,
          payable: payablePayments,
        });
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
      // Keep dialog open on error so user can retry
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Get current stage info
  const currentStage = order ? stages.find(s => s.id === order.stageId) : null;

  // Loading state
  if (isLoading || (isCreateMode && isLoadingDropdowns)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isCreateMode ? "Loading form..." : "Loading..."}
          </h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">
              {isCreateMode ? "Loading form data..." : "Loading order details..."}
            </h3>
            <p className="text-muted-foreground">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Error</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load order</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Link href="/orders">
                <Button variant="outline">Back to Orders</Button>
              </Link>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found state (order is null but not loading and not in create mode)
  if (!order && !isCreateMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Order Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order not found</h3>
            <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist</p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {isCreateMode ? "Create New Order" : order?.orderNumber}
              </h1>
              {!isCreateMode && order && currentStage && (
                <>
                  <Badge
                    style={{ backgroundColor: currentStage.color }}
                    className="text-white"
                  >
                    {currentStage.displayName || currentStage.name.replace(/_/g, ' ')}
                  </Badge>
                  {order.paymentStatus === "overdue" && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Payment Overdue
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {isCreateMode
                ? "Fill in the details below to create a new order"
                : order?.createdAt ? `Created ${format(new Date(order.createdAt), "MMM dd, yyyy 'at' hh:mm a")}` : ""
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditMode && !isCreateMode ? (
            <>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setStageDialogOpen(true)}
              >
                <ChevronRight className="h-4 w-4" />
                Change Stage
              </Button>
              <Link href={`/orders/${orderId}/edit`}>
                <Button variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" className="gap-2" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          ) : (
            <>
              {!isCreateMode && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/orders/${orderId}`)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                className="gap-2"
                onClick={isCreateMode ? handleCreateOrder : handleSaveEdit}
                disabled={isCreatingOrder || (!isCreateMode && isEditMode && !order)}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {isCreateMode ? "Create Order" : "Save Changes"}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreateMode ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-base font-semibold">Items *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrderItems([...orderItems, {
                            id: crypto.randomUUID(),
                            itemId: '',
                            itemDescription: '',
                            quantity: '',
                            unit: 'Nos',
                          }]);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    
                    {orderItems.map((orderItem, index) => (
                      <div key={orderItem.id} className="border rounded-lg p-4 space-y-3 relative">
                        {orderItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setOrderItems(orderItems.filter(item => item.id !== orderItem.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                        
                        <div className="font-medium text-sm text-muted-foreground">
                          Item {index + 1}
                        </div>
                        
                        <div>
                          <Label>Item *</Label>
                          <Select
                            value={orderItem.itemId}
                            onValueChange={(value) => {
                              const selectedItem = items.find(item => item.id.toString() === value);
                              setOrderItems(orderItems.map(item =>
                                item.id === orderItem.id
                                  ? {
                                      ...item,
                                      itemId: value,
                                      itemDescription: selectedItem?.description || selectedItem?.name || '',
                                    }
                                  : item
                              ));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={orderItem.itemDescription}
                            onChange={(e) => {
                              setOrderItems(orderItems.map(item =>
                                item.id === orderItem.id
                                  ? { ...item, itemDescription: e.target.value }
                                  : item
                              ));
                            }}
                            placeholder="Enter item description"
                            rows={2}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              value={orderItem.quantity}
                              onChange={(e) => {
                                setOrderItems(orderItems.map(item =>
                                  item.id === orderItem.id
                                    ? { ...item, quantity: e.target.value }
                                    : item
                                ));
                              }}
                              placeholder="Enter quantity"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Select
                              value={orderItem.unit}
                              onValueChange={(value) => {
                                setOrderItems(orderItems.map(item =>
                                  item.id === orderItem.id
                                    ? { ...item, unit: value }
                                    : item
                                ));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Nos">Nos</SelectItem>
                                <SelectItem value="Kg">Kg</SelectItem>
                                <SelectItem value="Ltr">Ltr</SelectItem>
                                <SelectItem value="Mtr">Mtr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Item Name</Label>
                      <p className="font-medium">{order?.itemName || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className={isEditMode ? "" : "text-muted-foreground"}>Description</Label>
                      {isEditMode ? (
                        <Textarea
                          value={order?.itemDescription || ""}
                          onChange={(e) => setOrder(order ? { ...order, itemDescription: e.target.value } : null)}
                          placeholder="Enter item description"
                          rows={2}
                        />
                      ) : (
                        <p className="font-medium">{order?.itemDescription}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className={isEditMode ? "" : "text-muted-foreground"}>Quantity</Label>
                        {isEditMode ? (
                          <Input
                            type="number"
                            value={order?.quantity || ""}
                            onChange={(e) => setOrder(order ? { ...order, quantity: parseFloat(e.target.value) || 0 } : null)}
                            placeholder="Enter quantity"
                          />
                        ) : (
                          <p className="font-medium">{order?.quantity}</p>
                        )}
                      </div>
                      <div>
                        <Label className={isEditMode ? "" : "text-muted-foreground"}>Unit</Label>
                        {isEditMode ? (
                          <Select
                            value={order?.unit || "Nos"}
                            onValueChange={(value) => setOrder(order ? { ...order, unit: value } : null)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Nos">Nos</SelectItem>
                              <SelectItem value="Kg">Kg</SelectItem>
                              <SelectItem value="Ltr">Ltr</SelectItem>
                              <SelectItem value="Mtr">Mtr</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium">{order?.unit}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreateMode ? (
                  <div>
                    <Label>Customer *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) => setFormData({...formData, customerId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{order?.customerName || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">GSTIN</Label>
                      <p className="font-mono text-sm">{order?.customerGstin || 'N/A'}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Supplier Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCreateMode ? (
                  <div>
                    <Label>Supplier *</Label>
                    <Select
                      value={formData.supplierId}
                      onValueChange={(value) => {
                        console.log('[ORDER-DETAIL] Supplier selected:', value);
                        setFormData({...formData, supplierId: value});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id.toString()}>
                            {supplier.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{order?.supplierName || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">GSTIN</Label>
                      <p className="font-mono text-sm">{order?.supplierGstin || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Credit Days</Label>
                      <p className="font-medium">{order?.supplierCreditDays} days</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>PO Number</Label>
                    {isEditMode ? (
                      <Input
                        value={order?.poNumber || ""}
                        onChange={(e) => setOrder(order ? { ...order, poNumber: e.target.value } : null)}
                        placeholder="Enter PO number"
                      />
                    ) : (
                      <p className="font-medium">{order?.poNumber || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>PO Date</Label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={order?.poDate || ""}
                        onChange={(e) => setOrder(order ? { ...order, poDate: e.target.value } : null)}
                      />
                    ) : (
                      <p className="font-medium">
                        {order?.poDate ? format(new Date(order?.poDate), "MMM dd, yyyy") : "—"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>E-Way Bill</Label>
                    {isEditMode ? (
                      <Input
                        value={order?.ewayBillNumber || ""}
                        onChange={(e) => setOrder(order ? { ...order, ewayBillNumber: e.target.value } : null)}
                        placeholder="Enter e-way bill number"
                      />
                    ) : (
                      <p className="font-medium">{order?.ewayBillNumber || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>Dispatch Date</Label>
                    {isEditMode ? (
                      <Input
                        type="date"
                        value={order?.dispatchDate || ""}
                        onChange={(e) => setOrder(order ? { ...order, dispatchDate: e.target.value } : null)}
                      />
                    ) : (
                      <p className="font-medium">
                        {order?.dispatchDate ? format(new Date(order?.dispatchDate), "MMM dd, yyyy") : "—"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing */}
          {isEditMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Pricing (Optional)
                </CardTitle>
                <CardDescription>
                  You can add pricing details now or update them later
                  {orderItems.length > 1 && (
                    <span className="block mt-1 text-amber-600 font-medium">
                      Note: These pricing rates will apply to all {orderItems.length} items
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Purchase Side */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Purchase Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Supplier Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.supplierRate}
                          onChange={(e) => setFormData({...formData, supplierRate: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>GST %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.purchaseGstPct}
                          onChange={(e) => setFormData({...formData, purchaseGstPct: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Sale Side */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">Sale Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Selling Rate</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.sellingRate}
                          onChange={(e) => setFormData({...formData, sellingRate: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label>GST %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.saleGstPct}
                          onChange={(e) => setFormData({...formData, saleGstPct: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {(order?.notes || isCreateMode) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode || isCreateMode ? (
                  <Textarea
                    value={isCreateMode ? formData.notes : (order?.notes || '')}
                    onChange={isCreateMode
                      ? (e) => setFormData({...formData, notes: e.target.value})
                      : (e) => setOrder(order ? { ...order, notes: e.target.value } : null)
                    }
                    placeholder="Add notes about this order"
                    rows={3}
                  />
                ) : (
                  <p className="text-muted-foreground">{order?.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchase Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Purchase (Cost)</CardTitle>
                <CardDescription>What you pay to supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>Rate (Ex-GST)</Label>
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={order?.supplierRate || ""}
                        onChange={(e) => setOrder(order ? { ...order, supplierRate: e.target.value } : null)}
                        placeholder="Enter rate"
                      />
                    ) : (
                      <p className="font-semibold">{formatCurrency(order?.supplierRate || "0")}</p>
                    )}
                  </div>
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>GST %</Label>
                    {isEditMode ? (
                      <Select
                        value={order?.purchaseGstPct?.toString() || "0"}
                        onValueChange={(value) => setOrder(order ? { ...order, purchaseGstPct: value } : null)}
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
                    ) : (
                      <p className="font-semibold">{order?.purchaseGstPct}%</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Total (Ex-GST)</Label>
                  <p className="text-lg font-bold">{formatCurrency(order?.purchaseTotalExGst || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total (Inc-GST)</Label>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(order?.purchaseTotalIncGst || "0")}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Advance Paid</Label>
                  <p className="font-semibold">{formatCurrency(order?.advancePaid || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Balance Due</Label>
                  <p className="font-semibold text-orange-600">
                    {formatCurrency((parseFloat(order?.purchaseTotalIncGst || "0") - parseFloat(order?.advancePaid || "0")).toString())}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Sale Side */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Sale (Revenue)</CardTitle>
                <CardDescription>What customer pays you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>Rate (Ex-GST)</Label>
                    {isEditMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={order?.sellingRate || ""}
                        onChange={(e) => setOrder(order ? { ...order, sellingRate: e.target.value } : null)}
                        placeholder="Enter rate"
                      />
                    ) : (
                      <p className="font-semibold">{formatCurrency(order?.sellingRate || "0")}</p>
                    )}
                  </div>
                  <div>
                    <Label className={isEditMode ? "" : "text-muted-foreground"}>GST %</Label>
                    {isEditMode ? (
                      <Select
                        value={order?.saleGstPct?.toString() || "0"}
                        onValueChange={(value) => setOrder(order ? { ...order, saleGstPct: value } : null)}
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
                    ) : (
                      <p className="font-semibold">{order?.saleGstPct}%</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Total (Ex-GST)</Label>
                  <p className="text-lg font-bold">{formatCurrency(order?.saleTotalExGst || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total (Inc-GST)</Label>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(order?.saleTotalIncGst || "0")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profit Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalcIcon className="h-5 w-5" />
                Profit Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Gross Profit</Label>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(order?.grossProfit || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission</Label>
                  <p className="text-lg font-semibold text-orange-600">-{formatCurrency(order?.commission || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Other Expenses</Label>
                  <p className="text-lg font-semibold text-orange-600">-{formatCurrency(order?.otherExpenses || "0")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Allocated Expenses</Label>
                  <p className="text-lg font-semibold text-orange-600">-{formatCurrency(order?.allocatedGenericExpenses || "0")}</p>
                </div>
              </div>
              <Separator />
              <div className="bg-primary/5 p-4 rounded-lg">
                <Label className="text-muted-foreground">Net Profit</Label>
                <p className="text-3xl font-bold text-primary">{formatCurrency(order?.netProfit || "0")}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Margin: {((parseFloat(order?.netProfit || "0") / parseFloat(order?.saleTotalExGst || "1")) * 100).toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payable - LEFT SIDE (matching Financial tab) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-red-600" />
                    Payable (To Supplier)
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPaymentType("payable");
                      setPaymentDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Invoice Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(order?.purchaseTotalIncGst || "0")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Paid:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalPaidToSupplier)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance Due:</span>
                    <span className={`font-bold text-xl ${supplierBalanceDue < 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {supplierBalanceDue < 0
                        ? `${formatCurrency(Math.abs(supplierBalanceDue))} (Overpaid)`
                        : formatCurrency(supplierBalanceDue)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className={isEditMode ? "" : "text-muted-foreground"}>Payment Due Date</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={order?.supplierPaymentDueDate || order?.supplierPaymentDue || ""}
                      onChange={(e) => setOrder(order ? { ...order, supplierPaymentDueDate: e.target.value, supplierPaymentDue: e.target.value } : null)}
                    />
                  ) : (
                    <p className="font-medium">
                      {(order?.supplierPaymentDueDate || order?.supplierPaymentDue)
                        ? format(new Date(order?.supplierPaymentDueDate || order?.supplierPaymentDue || ""), "MMM dd, yyyy")
                        : "Not set"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Receivable - RIGHT SIDE (matching Financial tab) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-green-600" />
                    Receivable (From Customer)
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setPaymentType("receivable");
                      setPaymentDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Invoice Amount:</span>
                    <span className="font-bold text-lg">{formatCurrency(order?.saleTotalIncGst || "0")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount Received:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(totalReceivedFromCustomer)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance Due:</span>
                    <span className={`font-bold text-xl ${customerBalanceDue < 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {customerBalanceDue < 0
                        ? `${formatCurrency(Math.abs(customerBalanceDue))} (Overpaid)`
                        : formatCurrency(customerBalanceDue)}
                    </span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className={isEditMode ? "" : "text-muted-foreground"}>Payment Due Date</Label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={order?.paymentDueDate || ""}
                      onChange={(e) => setOrder(order ? { ...order, paymentDueDate: e.target.value } : null)}
                    />
                  ) : (
                    <p className="font-medium">{order?.paymentDueDate ? format(new Date(order.paymentDueDate), "MMM dd, yyyy") : "Not set"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Paid to Supplier</h4>
                  {payments.payable.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments made yet</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.payable.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.paymentDate && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                              </p>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                if (!confirm("Are you sure you want to delete this payment?")) return;
                                try {
                                  const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
                                  const response = await fetch(`${backendUrl}/api/orders/${orderId}/payments/${payment.id}`, {
                                    method: "DELETE",
                                    credentials: "include",
                                  });
                                  if (!response.ok) throw new Error("Failed to delete payment");
                                  toast.success("Payment deleted successfully");
                                  // Refresh payments
                                  const paymentsResponse = await fetch(`${backendUrl}/api/orders/${orderId}/payments`, { credentials: "include" });
                                  const paymentsData = await paymentsResponse.json();
                                  setPayments({
                                    receivable: paymentsData.filter((p: Payment) => p.paymentType === "receivable"),
                                    payable: paymentsData.filter((p: Payment) => p.paymentType === "payable"),
                                  });
                                  // Refresh order to update totals
                                  const orderResponse = await fetch(`${backendUrl}/api/orders/${orderId}`, { credentials: "include" });
                                  const orderData = await orderResponse.json();
                                  setOrder(orderData);
                                } catch (error) {
                                  toast.error("Failed to delete payment");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Received from Customer</h4>
                  {payments.receivable.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payments received yet</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.receivable.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-muted-foreground">{payment.notes}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {payment.paymentDate && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                              </p>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                if (!confirm("Are you sure you want to delete this payment?")) return;
                                try {
                                  const backendUrl = import.meta.env.VITE_API_URL || "https://api.madhurasha.arvat.in";
                                  const response = await fetch(`${backendUrl}/api/orders/${orderId}/payments/${payment.id}`, {
                                    method: "DELETE",
                                    credentials: "include",
                                  });
                                  if (!response.ok) throw new Error("Failed to delete payment");
                                  toast.success("Payment deleted successfully");
                                  // Refresh payments
                                  const paymentsResponse = await fetch(`${backendUrl}/api/orders/${orderId}/payments`, { credentials: "include" });
                                  const paymentsData = await paymentsResponse.json();
                                  setPayments({
                                    receivable: paymentsData.filter((p: Payment) => p.paymentType === "receivable"),
                                    payable: paymentsData.filter((p: Payment) => p.paymentType === "payable"),
                                  });
                                  // Refresh order to update totals
                                  const orderResponse = await fetch(`${backendUrl}/api/orders/${orderId}`, { credentials: "include" });
                                  const orderData = await orderResponse.json();
                                  setOrder(orderData);
                                } catch (error) {
                                  toast.error("Failed to delete payment");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Documents</CardTitle>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload PO, invoices, delivery notes, and other documents
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Stage History
              </CardTitle>
              <CardDescription>Track the order's journey through different stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stageHistory.map((entry, index) => (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === stageHistory.length - 1 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      {index < stageHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        {entry.fromStageName && (
                          <>
                            <Badge variant="outline">
                              {entry.fromStageDisplayName || entry.fromStageName.replace(/_/g, ' ')}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </>
                        )}
                        <Badge>
                          {entry.toStageDisplayName || entry.toStageName?.replace(/_/g, ' ') || 'Unknown Stage'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{entry.notes}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>User #{entry.changedBy}</span>
                        <span>•</span>
                        <span>{format(new Date(entry.changedAt), "MMM dd, yyyy 'at' hh:mm a")}</span>
                        {entry.durationDays !== null && (
                          <>
                            <span>•</span>
                            <span>{entry.durationDays} days in previous stage</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stage Transition Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogHeader>
          <DialogTitle>Change Order Stage</DialogTitle>
          <DialogDescription>
            Move this order to a different stage in the procurement cycle
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Select New Stage</Label>
            <Select value={selectedStageId} onValueChange={setSelectedStageId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add notes about this stage transition..."
              value={stageNotes}
              onChange={(e) => setStageNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setStageDialogOpen(false);
                setSelectedStageId("");
                setStageNotes("");
              }}
              disabled={isTransitioning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStageTransition}
              disabled={isTransitioning || !selectedStageId}
            >
              {isTransitioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Stage
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Payment Recording Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogHeader>
          <DialogTitle>
            Record {paymentType === "receivable" ? "Receivable" : "Payable"} Payment
          </DialogTitle>
          <DialogDescription>
            {paymentType === "receivable"
              ? "Record payment received from customer"
              : "Record payment made to supplier"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount *</Label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            {paymentType === "receivable" && (
              <p className="text-xs text-muted-foreground mt-1">
                Outstanding: {formatCurrency(Math.max(0, customerBalanceDue).toString())}
              </p>
            )}
            {paymentType === "payable" && (
              <p className="text-xs text-muted-foreground mt-1">
                Outstanding: {formatCurrency(Math.max(0, supplierBalanceDue).toString())}
              </p>
            )}
          </div>
          <div>
            <Label>Payment Date *</Label>
            <Input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="neft">NEFT/RTGS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference Number</Label>
            <Input
              placeholder="Transaction ID / Cheque No"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes (optional)"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentAmount("");
                setPaymentDate(format(new Date(), "yyyy-MM-dd"));
                setPaymentMethod("");
                setReferenceNumber("");
                setPaymentNotes("");
              }}
              disabled={isRecordingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={isRecordingPayment || !paymentAmount || !paymentDate || !paymentMethod}
            >
              {isRecordingPayment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// Made with Bob
