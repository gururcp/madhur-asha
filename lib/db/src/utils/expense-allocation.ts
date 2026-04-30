import { db } from "../index";
import { ordersTable, genericExpensesTable, gemStagesTable } from "../schema";
import { eq, and, gte, lte, sql, ne } from "drizzle-orm";

/**
 * Calculate allocated generic expenses per order for a given period
 * Generic expenses are divided equally among all active orders (not completed)
 */
export async function calculateExpenseAllocation(
  startDate: Date,
  endDate: Date
): Promise<number> {
  try {
    // Get the COMPLETED stage ID
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, "COMPLETED"))
      .limit(1);

    if (!completedStage.length) {
      console.warn("COMPLETED stage not found, treating all orders as active");
    }

    const completedStageId = completedStage[0]?.id;

    // Count active orders (not in COMPLETED stage)
    const activeOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(
        completedStageId
          ? ne(ordersTable.stageId, completedStageId)
          : sql`true`
      );

    const activeOrderCount = Number(activeOrdersResult[0]?.count || 0);

    if (activeOrderCount === 0) {
      return 0; // No active orders, no allocation
    }

    // Calculate total generic expenses for the period
    const expensesResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(genericExpensesTable)
      .where(
        and(
          gte(genericExpensesTable.expenseDate, startDate.toISOString().split('T')[0]),
          lte(genericExpensesTable.expenseDate, endDate.toISOString().split('T')[0])
        )
      );

    const totalExpenses = Number(expensesResult[0]?.total || 0);

    // Calculate allocation per order
    const allocationPerOrder = totalExpenses / activeOrderCount;

    return allocationPerOrder;
  } catch (error) {
    console.error("Error calculating expense allocation:", error);
    throw error;
  }
}

/**
 * Update allocated expenses for all active orders
 * This should be called whenever:
 * - A generic expense is added/updated/deleted
 * - An order stage changes (becomes active or completed)
 */
export async function updateAllOrderAllocations(
  startDate?: Date,
  endDate?: Date
): Promise<void> {
  try {
    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Calculate allocation per order
    const allocationPerOrder = await calculateExpenseAllocation(start, end);

    // Get the COMPLETED stage ID
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, "COMPLETED"))
      .limit(1);

    const completedStageId = completedStage[0]?.id;

    // Update all active orders with the new allocation
    if (completedStageId) {
      await db
        .update(ordersTable)
        .set({
          allocatedGenericExpenses: allocationPerOrder.toString(),
          updatedAt: new Date(),
        })
        .where(ne(ordersTable.stageId, completedStageId));
    } else {
      // If no completed stage, update all orders
      await db
        .update(ordersTable)
        .set({
          allocatedGenericExpenses: allocationPerOrder.toString(),
          updatedAt: new Date(),
        });
    }

    // Recalculate net profit for all updated orders
    await recalculateNetProfitForAllOrders();

    console.log(`✅ Updated expense allocation: ₹${allocationPerOrder.toFixed(2)} per order`);
  } catch (error) {
    console.error("Error updating order allocations:", error);
    throw error;
  }
}

/**
 * Calculate net profit for an order
 * Net Profit = Gross Profit - Commission - Other Expenses - Allocated Generic Expenses
 */
export function calculateNetProfit(
  grossProfit: number,
  commission: number,
  otherExpenses: number,
  allocatedGenericExpenses: number
): number {
  return grossProfit - commission - otherExpenses - allocatedGenericExpenses;
}

/**
 * Calculate gross profit for an order
 * Gross Profit = Sale Total (Ex-GST) - Purchase Total (Ex-GST)
 */
export function calculateGrossProfit(
  saleTotalExGst: number,
  purchaseTotalExGst: number
): number {
  return saleTotalExGst - purchaseTotalExGst;
}

/**
 * Recalculate net profit for all orders based on their current values
 */
async function recalculateNetProfitForAllOrders(): Promise<void> {
  try {
    // Use SQL to update net profit in a single query
    await db.execute(sql`
      UPDATE orders
      SET net_profit = COALESCE(gross_profit, 0) 
                     - COALESCE(commission, 0) 
                     - COALESCE(other_expenses, 0) 
                     - COALESCE(allocated_generic_expenses, 0),
          updated_at = NOW()
    `);
  } catch (error) {
    console.error("Error recalculating net profit:", error);
    throw error;
  }
}

/**
 * Get expense allocation summary for a period
 */
export async function getExpenseAllocationSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalGenericExpenses: number;
  activeOrderCount: number;
  allocationPerOrder: number;
  period: { start: string; end: string };
}> {
  try {
    // Get the COMPLETED stage ID
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, "COMPLETED"))
      .limit(1);

    const completedStageId = completedStage[0]?.id;

    // Count active orders
    const activeOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(
        completedStageId
          ? ne(ordersTable.stageId, completedStageId)
          : sql`true`
      );

    const activeOrderCount = Number(activeOrdersResult[0]?.count || 0);

    // Calculate total generic expenses
    const expensesResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(genericExpensesTable)
      .where(
        and(
          gte(genericExpensesTable.expenseDate, startDate.toISOString().split('T')[0]),
          lte(genericExpensesTable.expenseDate, endDate.toISOString().split('T')[0])
        )
      );

    const totalGenericExpenses = Number(expensesResult[0]?.total || 0);
    const allocationPerOrder = activeOrderCount > 0 ? totalGenericExpenses / activeOrderCount : 0;

    return {
      totalGenericExpenses,
      activeOrderCount,
      allocationPerOrder,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
    };
  } catch (error) {
    console.error("Error getting expense allocation summary:", error);
    throw error;
  }
}

/**
 * Calculate overall net profit (sum of all order net profits)
 */
export async function calculateOverallNetProfit(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  try {
    if (startDate && endDate) {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(net_profit), 0)` })
        .from(ordersTable)
        .where(
          and(
            gte(ordersTable.createdAt, startDate),
            lte(ordersTable.createdAt, endDate)
          )
        );
      return Number(result[0]?.total || 0);
    } else {
      const result = await db
        .select({ total: sql<number>`COALESCE(SUM(net_profit), 0)` })
        .from(ordersTable);
      return Number(result[0]?.total || 0);
    }
  } catch (error) {
    console.error("Error calculating overall net profit:", error);
    throw error;
  }
}

// Made with Bob
