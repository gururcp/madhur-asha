import { Router } from "express";
import { db } from "@workspace/db";
import {
  ordersTable,
  orderStageHistoryTable,
  orderPaymentsTable,
  orderDocumentsTable,
  gemStagesTable,
  customersTable,
  suppliersTable,
  itemsTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, desc, asc, sql, ne, or, like } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";
// Import utility functions - will be defined inline for now
// TODO: Export these from @workspace/db properly
function calculateGrossProfit(saleTotalExGst: number, purchaseTotalExGst: number): number {
  return saleTotalExGst - purchaseTotalExGst;
}

function calculateNetProfit(
  grossProfit: number,
  commission: number,
  otherExpenses: number,
  allocatedGenericExpenses: number
): number {
  return grossProfit - commission - otherExpenses - allocatedGenericExpenses;
}

async function updateAllOrderAllocations() {
  // Placeholder - will implement proper allocation update
  console.log("Allocation update triggered");
}

const router = Router();

/**
 * Generate order number in format MAE-YYYY-NNN
 */
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Get the last order number for this year
  const lastOrder = await db
    .select({ orderNumber: ordersTable.orderNumber })
    .from(ordersTable)
    .where(like(ordersTable.orderNumber, `MAE-${year}-%`))
    .orderBy(desc(ordersTable.orderNumber))
    .limit(1);

  let nextNumber = 1;
  if (lastOrder.length > 0) {
    const lastNumber = parseInt(lastOrder[0].orderNumber.split('-')[2]);
    nextNumber = lastNumber + 1;
  }

  return `MAE-${year}-${String(nextNumber).padStart(3, '0')}`;
}

/**
 * Calculate payment status based on amounts
 */
function calculatePaymentStatus(received: number, total: number, dueDate: Date | null): string {
  // Check if fully paid first
  if (received >= total) return 'paid';
  
  // Check if overdue (must come before partial check)
  if (dueDate && new Date(dueDate) < new Date() && received < total) return 'overdue';
  
  // Check if partially paid
  if (received > 0 && received < total) return 'partial';
  
  // Default to pending
  return 'pending';
}

/**
 * Flatten order response with joined data
 */
function flattenOrderResponse(orderData: any) {
  if (!orderData || !orderData.order) return null;
  
  return {
    ...orderData.order,
    // Add customer fields
    customerName: orderData.customer?.name || null,
    customerGstin: orderData.customer?.gstin || null,
    customerEmail: orderData.customer?.email || null,
    customerPhone: orderData.customer?.phone || null,
    
    // Add supplier fields
    supplierName: orderData.supplier?.businessName || null,
    supplierGstin: orderData.supplier?.gstin || null,
    supplierEmail: orderData.supplier?.email || null,
    supplierPhone: orderData.supplier?.phone || null,
    
    // Add item fields
    itemName: orderData.item?.name || null,
    itemCode: orderData.item?.code || null,
    itemHsnCode: orderData.item?.hsnCode || null,
    
    // Add stage fields
    stageName: orderData.stage?.name || null,
    stageDisplayName: orderData.stage?.displayName || null,
    stageColor: orderData.stage?.color || null,
  };
}

/**
 * GET /api/orders
 * List orders with filters and pagination
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const {
      stage,
      customer,
      supplier,
      status,
      startDate,
      endDate,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    let query = db
      .select({
        order: ordersTable,
        customer: customersTable,
        supplier: suppliersTable,
        item: itemsTable,
        stage: gemStagesTable,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .leftJoin(suppliersTable, eq(ordersTable.supplierId, suppliersTable.id))
      .leftJoin(itemsTable, eq(ordersTable.itemId, itemsTable.id))
      .leftJoin(gemStagesTable, eq(ordersTable.stageId, gemStagesTable.id))
      .$dynamic();

    // Apply filters
    const conditions = [];
    
    if (stage) {
      conditions.push(eq(ordersTable.stageId, parseInt(stage as string)));
    }
    
    if (customer) {
      conditions.push(eq(ordersTable.customerId, parseInt(customer as string)));
    }
    
    if (supplier) {
      conditions.push(eq(ordersTable.supplierId, parseInt(supplier as string)));
    }
    
    if (status) {
      conditions.push(eq(ordersTable.paymentStatus, status as string));
    }
    
    if (startDate) {
      conditions.push(gte(ordersTable.createdAt, new Date(startDate as string)));
    }
    
    if (endDate) {
      conditions.push(lte(ordersTable.createdAt, new Date(endDate as string)));
    }
    
    if (search) {
      conditions.push(
        or(
          like(ordersTable.orderNumber, `%${search}%`),
          like(ordersTable.itemDescription, `%${search}%`),
          like(ordersTable.poNumber, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const ordersResult = await query
      .orderBy(desc(ordersTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Flatten the response structure
    const flattenedOrders = ordersResult.map(flattenOrderResponse).filter(Boolean);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable);
    
    const total = Number(totalResult[0]?.count || 0);

    res.json({
      orders: flattenedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/orders/pipeline
 * Get pipeline view (count by stage)
 */
router.get("/pipeline", requireAuth, async (req, res) => {
  try {
    const pipeline = await db
      .select({
        stageId: ordersTable.stageId,
        stageName: gemStagesTable.displayName,
        stageColor: gemStagesTable.color,
        count: sql<number>`count(*)`,
      })
      .from(ordersTable)
      .leftJoin(gemStagesTable, eq(ordersTable.stageId, gemStagesTable.id))
      .groupBy(ordersTable.stageId, gemStagesTable.displayName, gemStagesTable.color)
      .orderBy(asc(gemStagesTable.sortOrder));

    res.json(pipeline);
  } catch (error) {
    console.error("Error fetching pipeline:", error);
    res.status(500).json({ error: "Failed to fetch pipeline" });
  }
});

/**
 * GET /api/orders/alerts
 * Get payment alerts (overdue and due soon)
 */
router.get("/alerts", requireAuth, async (req, res) => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Overdue payments
    const overdue = await db
      .select({
        order: ordersTable,
        customer: customersTable,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(
        and(
          ne(ordersTable.paymentStatus, 'paid'),
          sql`${ordersTable.paymentDueDate} < ${today.toISOString().split('T')[0]}`
        )
      )
      .orderBy(asc(ordersTable.paymentDueDate));

    // Due soon (within 3 days)
    const dueSoon = await db
      .select({
        order: ordersTable,
        customer: customersTable,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .where(
        and(
          ne(ordersTable.paymentStatus, 'paid'),
          sql`${ordersTable.paymentDueDate} >= ${today.toISOString().split('T')[0]}`,
          sql`${ordersTable.paymentDueDate} <= ${threeDaysFromNow.toISOString().split('T')[0]}`
        )
      )
      .orderBy(asc(ordersTable.paymentDueDate));

    // Supplier payments due
    const supplierDue = await db
      .select({
        order: ordersTable,
        supplier: suppliersTable,
      })
      .from(ordersTable)
      .leftJoin(suppliersTable, eq(ordersTable.supplierId, suppliersTable.id))
      .where(
        and(
          ne(ordersTable.supplierPaymentStatus, 'paid'),
          sql`${ordersTable.supplierPaymentDueDate} <= ${threeDaysFromNow.toISOString().split('T')[0]}`
        )
      )
      .orderBy(asc(ordersTable.supplierPaymentDueDate));

    res.json({
      overdue,
      dueSoon,
      supplierDue,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

/**
 * GET /api/orders/:id
 * Get single order with all details
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderResult = await db
      .select({
        order: ordersTable,
        customer: customersTable,
        supplier: suppliersTable,
        item: itemsTable,
        stage: gemStagesTable,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .leftJoin(suppliersTable, eq(ordersTable.supplierId, suppliersTable.id))
      .leftJoin(itemsTable, eq(ordersTable.itemId, itemsTable.id))
      .leftJoin(gemStagesTable, eq(ordersTable.stageId, gemStagesTable.id))
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (!orderResult.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Flatten the response structure
    const flattenedOrder = flattenOrderResponse(orderResult[0]);
    
    if (!flattenedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(flattenedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * POST /api/orders
 * Create new order
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      customerId,
      supplierId,
      itemId,
      stageId,
      itemDescription,
      quantity,
      unit,
      supplierRate,
      purchaseGstPct,
      sellingRate,
      saleGstPct,
      commission,
      otherExpenses,
      notes,
      priority,
    } = req.body;

    // Validation - only basic fields are required
    if (!itemDescription || !quantity || !unit) {
      return res.status(400).json({ error: "Missing required fields: itemDescription, quantity, and unit are required" });
    }

    // Validate that if pricing is provided, both rates must be present
    const hasSupplierRate = supplierRate !== undefined && supplierRate !== null;
    const hasSellingRate = sellingRate !== undefined && sellingRate !== null;
    
    if ((hasSupplierRate && !hasSellingRate) || (!hasSupplierRate && hasSellingRate)) {
      return res.status(400).json({ error: "Both supplier rate and selling rate must be provided together" });
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Get default stage if not provided
    let finalStageId = stageId;
    if (!finalStageId) {
      const enquiryStage = await db
        .select()
        .from(gemStagesTable)
        .where(eq(gemStagesTable.name, 'ENQUIRY'))
        .limit(1);
      finalStageId = enquiryStage[0]?.id;
    }

    // Calculate financial values only if pricing is provided
    let purchaseTotalExGst = '0';
    let purchaseTotalIncGst = '0';
    let saleTotalExGst = '0';
    let saleTotalIncGst = '0';
    let grossProfit = '0';
    let netProfit = '0';
    
    if (hasSupplierRate && hasSellingRate) {
      const qty = parseFloat(quantity);
      const suppRate = parseFloat(supplierRate);
      const sellRate = parseFloat(sellingRate);
      const purchGst = parseFloat(purchaseGstPct || '0');
      const saleGst = parseFloat(saleGstPct || '0');
      const comm = parseFloat(commission || '0');
      const otherExp = parseFloat(otherExpenses || '0');

      const purchTotalExGstNum = suppRate * qty;
      const purchTotalIncGstNum = purchTotalExGstNum * (1 + purchGst / 100);
      const saleTotalExGstNum = sellRate * qty;
      const saleTotalIncGstNum = saleTotalExGstNum * (1 + saleGst / 100);
      const grossProfitCalc = calculateGrossProfit(saleTotalExGstNum, purchTotalExGstNum);
      
      // Allocated expenses will be calculated separately
      const allocatedGenericExpenses = 0;
      const netProfitCalc = calculateNetProfit(grossProfitCalc, comm, otherExp, allocatedGenericExpenses);
      
      purchaseTotalExGst = purchTotalExGstNum.toString();
      purchaseTotalIncGst = purchTotalIncGstNum.toString();
      saleTotalExGst = saleTotalExGstNum.toString();
      saleTotalIncGst = saleTotalIncGstNum.toString();
      grossProfit = grossProfitCalc.toString();
      netProfit = netProfitCalc.toString();
    }

    const newOrder = await db
      .insert(ordersTable)
      .values({
        orderNumber,
        customerId: customerId || null,
        supplierId: supplierId || null,
        itemId: itemId || null,
        stageId: finalStageId,
        itemDescription,
        quantity: quantity.toString(),
        unit,
        supplierRate: supplierRate?.toString() || '0',
        purchaseGstPct: purchaseGstPct?.toString() || '0',
        purchaseTotalExGst,
        purchaseTotalIncGst,
        sellingRate: sellingRate?.toString() || '0',
        saleGstPct: saleGstPct?.toString() || '0',
        saleTotalExGst,
        saleTotalIncGst,
        commission: commission?.toString() || '0',
        otherExpenses: otherExpenses?.toString() || '0',
        grossProfit,
        allocatedGenericExpenses: '0',
        netProfit,
        paymentStatus: 'pending',
        supplierPaymentStatus: 'pending',
        notes,
        priority: priority || 'normal',
        createdBy: (req.user as any)?.id,
      })
      .returning();

    // Record initial stage in history
    await db.insert(orderStageHistoryTable).values({
      orderId: newOrder[0].id,
      fromStageId: null,
      toStageId: finalStageId,
      changedBy: (req.user as any)?.id,
      notes: 'Order created',
    });

    // Recalculate allocations for all orders
    await updateAllOrderAllocations();

    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/**
 * PUT /api/orders/:id
 * Update order
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (!existingOrder.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const {
      customerId,
      supplierId,
      itemId,
      itemDescription,
      quantity,
      unit,
      supplierRate,
      purchaseGstPct,
      sellingRate,
      saleGstPct,
      commission,
      otherExpenses,
      invoiceNumber,
      invoiceDate,
      invoiceAmount,
      paymentDueDate,
      receivedAmount,
      paymentReceivedDate,
      supplierInvoiceNumber,
      supplierInvoiceDate,
      supplierInvoiceAmount,
      supplierCreditDays,
      supplierPaymentDueDate,
      advancePaid,
      supplierPaidAmount,
      supplierPaymentDate,
      poNumber,
      poDate,
      ewayBillNumber,
      dispatchDate,
      deliveryDate,
      notes,
      priority,
      tags,
    } = req.body;

    // Recalculate financial values if changed
    let updates: any = {
      customerId,
      supplierId,
      itemId,
      itemDescription,
      quantity: quantity?.toString(),
      unit,
      supplierRate: supplierRate?.toString(),
      purchaseGstPct: purchaseGstPct?.toString(),
      sellingRate: sellingRate?.toString(),
      saleGstPct: saleGstPct?.toString(),
      commission: commission?.toString(),
      otherExpenses: otherExpenses?.toString(),
      invoiceNumber,
      invoiceDate,
      invoiceAmount: invoiceAmount?.toString(),
      paymentDueDate,
      receivedAmount: receivedAmount?.toString(),
      paymentReceivedDate,
      supplierInvoiceNumber,
      supplierInvoiceDate,
      supplierInvoiceAmount: supplierInvoiceAmount?.toString(),
      supplierCreditDays,
      supplierPaymentDueDate,
      advancePaid: advancePaid?.toString(),
      supplierPaidAmount: supplierPaidAmount?.toString(),
      supplierPaymentDate,
      poNumber,
      poDate,
      ewayBillNumber,
      dispatchDate,
      deliveryDate,
      notes,
      priority,
      tags,
      updatedAt: new Date(),
    };

    // Recalculate if financial fields changed
    if (quantity && supplierRate && sellingRate) {
      const qty = parseFloat(quantity);
      const suppRate = parseFloat(supplierRate);
      const sellRate = parseFloat(sellingRate);
      const purchGst = parseFloat(purchaseGstPct || '0');
      const saleGst = parseFloat(saleGstPct || '0');
      const comm = parseFloat(commission || '0');
      const otherExp = parseFloat(otherExpenses || '0');

      const purchaseTotalExGst = suppRate * qty;
      const purchaseTotalIncGst = purchaseTotalExGst * (1 + purchGst / 100);
      const saleTotalExGst = sellRate * qty;
      const saleTotalIncGst = saleTotalExGst * (1 + saleGst / 100);
      const grossProfit = calculateGrossProfit(saleTotalExGst, purchaseTotalExGst);
      
      const allocatedGenericExpenses = parseFloat(existingOrder[0].allocatedGenericExpenses || '0');
      const netProfit = calculateNetProfit(grossProfit, comm, otherExp, allocatedGenericExpenses);

      updates = {
        ...updates,
        purchaseTotalExGst: purchaseTotalExGst.toString(),
        purchaseTotalIncGst: purchaseTotalIncGst.toString(),
        saleTotalExGst: saleTotalExGst.toString(),
        saleTotalIncGst: saleTotalIncGst.toString(),
        grossProfit: grossProfit.toString(),
        netProfit: netProfit.toString(),
      };
    }

    // Update payment status if amounts changed
    if (receivedAmount !== undefined && invoiceAmount !== undefined) {
      updates.paymentStatus = calculatePaymentStatus(
        parseFloat(receivedAmount),
        parseFloat(invoiceAmount),
        paymentDueDate
      );
    }

    if (supplierPaidAmount !== undefined && supplierInvoiceAmount !== undefined) {
      updates.supplierPaymentStatus = calculatePaymentStatus(
        parseFloat(supplierPaidAmount),
        parseFloat(supplierInvoiceAmount),
        supplierPaymentDueDate
      );
    }

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedOrder = await db
      .update(ordersTable)
      .set(updates)
      .where(eq(ordersTable.id, id))
      .returning();

    res.json(updatedOrder[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete order
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    await db.delete(ordersTable).where(eq(ordersTable.id, id));

    // Recalculate allocations after deletion
    await updateAllOrderAllocations();

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

/**
 * POST /api/orders/:id/stage
 * Move order to different stage
 */
router.post("/:id/stage", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { stageId, notes } = req.body;
    
    if (isNaN(id) || !stageId) {
      return res.status(400).json({ error: "Invalid order ID or stage ID" });
    }

    // Get current order
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (!order.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStageId = order[0].stageId;

    // Calculate duration in previous stage
    const lastHistory = await db
      .select()
      .from(orderStageHistoryTable)
      .where(eq(orderStageHistoryTable.orderId, id))
      .orderBy(desc(orderStageHistoryTable.changedAt))
      .limit(1);

    let durationDays = null;
    if (lastHistory.length > 0) {
      const daysDiff = Math.floor(
        (new Date().getTime() - new Date(lastHistory[0].changedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      durationDays = daysDiff;
    }

    // Update order stage
    await db
      .update(ordersTable)
      .set({
        stageId,
        updatedAt: new Date(),
      })
      .where(eq(ordersTable.id, id));

    // Record in history
    await db.insert(orderStageHistoryTable).values({
      orderId: id,
      fromStageId: currentStageId,
      toStageId: stageId,
      changedBy: (req.user as any)?.id,
      notes,
      durationDays,
    });

    // Recalculate allocations if moving to/from COMPLETED stage
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, 'COMPLETED'))
      .limit(1);

    if (completedStage.length > 0 && (stageId === completedStage[0].id || currentStageId === completedStage[0].id)) {
      await updateAllOrderAllocations();
    }

    res.json({ message: "Stage updated successfully" });
  } catch (error) {
    console.error("Error updating stage:", error);
    res.status(500).json({ error: "Failed to update stage" });
  }
});

/**
 * GET /api/orders/:id/history
 * Get stage history for order
 */
router.get("/:id/history", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Create aliases for the gem stages table to avoid duplicate joins
    const fromStageAlias = {
      ...gemStagesTable,
      _: { ...gemStagesTable._, name: 'fromStage' }
    };
    const toStageAlias = {
      ...gemStagesTable,
      _: { ...gemStagesTable._, name: 'toStage' }
    };

    const history = await db
      .select({
        id: orderStageHistoryTable.id,
        orderId: orderStageHistoryTable.orderId,
        fromStageId: orderStageHistoryTable.fromStageId,
        toStageId: orderStageHistoryTable.toStageId,
        changedAt: orderStageHistoryTable.changedAt,
        changedBy: orderStageHistoryTable.changedBy,
        notes: orderStageHistoryTable.notes,
        durationDays: orderStageHistoryTable.durationDays,
        fromStageName: sql<string>`from_stage.name`.as('fromStageName'),
        fromStageDisplayName: sql<string>`from_stage.display_name`.as('fromStageDisplayName'),
        fromStageColor: sql<string>`from_stage.color`.as('fromStageColor'),
        toStageName: sql<string>`to_stage.name`.as('toStageName'),
        toStageDisplayName: sql<string>`to_stage.display_name`.as('toStageDisplayName'),
        toStageColor: sql<string>`to_stage.color`.as('toStageColor'),
      })
      .from(orderStageHistoryTable)
      .leftJoin(
        sql`gem_stages as from_stage`,
        sql`${orderStageHistoryTable.fromStageId} = from_stage.id`
      )
      .leftJoin(
        sql`gem_stages as to_stage`,
        sql`${orderStageHistoryTable.toStageId} = to_stage.id`
      )
      .where(eq(orderStageHistoryTable.orderId, id))
      .orderBy(desc(orderStageHistoryTable.changedAt));

    res.json(history);
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * POST /api/orders/:id/payments
 * Record payment for order
 */
router.post("/:id/payments", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { paymentType, amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;
    
    if (isNaN(id) || !paymentType || !amount || !paymentDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Record payment
    const payment = await db
      .insert(orderPaymentsTable)
      .values({
        orderId: id,
        paymentType,
        amount: amount.toString(),
        paymentDate,
        paymentMethod,
        referenceNumber,
        notes,
        createdBy: (req.user as any)?.id,
      })
      .returning();

    // Update order payment amounts
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (order.length > 0) {
      if (paymentType === 'receivable') {
        const newReceived = parseFloat(order[0].receivedAmount || '0') + parseFloat(amount);
        const invoiceAmt = parseFloat(order[0].invoiceAmount || '0');
        const newStatus = calculatePaymentStatus(
          newReceived,
          invoiceAmt,
          order[0].paymentDueDate ? new Date(order[0].paymentDueDate) : null
        );

        await db
          .update(ordersTable)
          .set({
            receivedAmount: newReceived.toString(),
            paymentStatus: newStatus,
            paymentReceivedDate: paymentDate,
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, id));
      } else if (paymentType === 'payable') {
        const newPaid = parseFloat(order[0].supplierPaidAmount || '0') + parseFloat(amount);
        const supplierInvAmt = parseFloat(order[0].supplierInvoiceAmount || '0');
        const newStatus = calculatePaymentStatus(
          newPaid,
          supplierInvAmt,
          order[0].supplierPaymentDueDate ? new Date(order[0].supplierPaymentDueDate) : null
        );

        await db
          .update(ordersTable)
          .set({
            supplierPaidAmount: newPaid.toString(),
            supplierPaymentStatus: newStatus,
            supplierPaymentDate: paymentDate,
            updatedAt: new Date(),
          })
          .where(eq(ordersTable.id, id));
      }
    }

    res.status(201).json(payment[0]);
  } catch (error) {
    console.error("Error recording payment:", error);
    res.status(500).json({ error: "Failed to record payment" });
  }
});

/**
 * GET /api/orders/:id/payments
 * Get payments for order
 */
router.get("/:id/payments", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const payments = await db
      .select()
      .from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.orderId, id))
      .orderBy(desc(orderPaymentsTable.createdAt));

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});
/**
 * DELETE /api/orders/:id/payments/:paymentId
 * Delete a payment record
 */
router.delete("/:id/payments/:paymentId", requireAuth, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const paymentId = parseInt(req.params.paymentId);
    
    if (isNaN(orderId) || isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid order ID or payment ID" });
    }

    // Verify the payment belongs to this order
    const payment = await db
      .select()
      .from(orderPaymentsTable)
      .where(
        and(
          eq(orderPaymentsTable.id, paymentId),
          eq(orderPaymentsTable.orderId, orderId)
        )
      )
      .limit(1);

    if (payment.length === 0) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Delete the payment
    await db
      .delete(orderPaymentsTable)
      .where(eq(orderPaymentsTable.id, paymentId));

    // Recalculate order payment totals
    const payments = await db
      .select()
      .from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.orderId, orderId));

    const receivedAmount = payments
      .filter(p => p.paymentType === 'receivable')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const supplierPaidAmount = payments
      .filter(p => p.paymentType === 'payable')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Get order to calculate payment status
    const order = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, orderId))
      .limit(1);

    if (order.length > 0) {
      const invoiceAmount = parseFloat(order[0].invoiceAmount || '0');
      const paymentDueDate = order[0].paymentDueDate ? new Date(order[0].paymentDueDate) : null;
      const paymentStatus = calculatePaymentStatus(
        receivedAmount,
        invoiceAmount,
        paymentDueDate
      );

      const supplierInvoiceAmount = parseFloat(order[0].supplierInvoiceAmount || '0');
      const supplierPaymentDueDate = order[0].supplierPaymentDueDate ? new Date(order[0].supplierPaymentDueDate) : null;
      const supplierPaymentStatus = calculatePaymentStatus(
        supplierPaidAmount,
        supplierInvoiceAmount,
        supplierPaymentDueDate
      );

      // Update order with new totals
      await db
        .update(ordersTable)
        .set({
          receivedAmount: receivedAmount.toString(),
          supplierPaidAmount: supplierPaidAmount.toString(),
          paymentStatus,
          supplierPaymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(ordersTable.id, orderId));
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});


export default router;

// Made with Bob
