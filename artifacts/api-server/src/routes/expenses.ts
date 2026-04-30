import { Router } from "express";
import { db } from "@workspace/db";
import { genericExpensesTable, ordersTable, gemStagesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc, sql, ne } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

/**
 * Recalculate and update expense allocation for all active orders
 */
async function recalculateAllocations(startDate?: Date, endDate?: Date) {
  try {
    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Get the COMPLETED stage ID
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, "COMPLETED"))
      .limit(1);

    const completedStageId = completedStage[0]?.id;

    // Count active orders (not in COMPLETED stage)
    const activeOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(completedStageId ? ne(ordersTable.stageId, completedStageId) : sql`true`);

    const activeOrderCount = Number(activeOrdersResult[0]?.count || 0);

    if (activeOrderCount === 0) {
      console.log("No active orders, skipping allocation");
      return;
    }

    // Calculate total generic expenses for the period
    const expensesResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(genericExpensesTable)
      .where(
        and(
          gte(genericExpensesTable.expenseDate, start.toISOString().split('T')[0]),
          lte(genericExpensesTable.expenseDate, end.toISOString().split('T')[0])
        )
      );

    const totalExpenses = Number(expensesResult[0]?.total || 0);
    const allocationPerOrder = totalExpenses / activeOrderCount;

    // Update all active orders with the new allocation
    if (completedStageId) {
      await db.execute(sql`
        UPDATE orders
        SET allocated_generic_expenses = ${allocationPerOrder.toString()},
            net_profit = COALESCE(gross_profit, 0) 
                       - COALESCE(commission, 0) 
                       - COALESCE(other_expenses, 0) 
                       - ${allocationPerOrder},
            updated_at = NOW()
        WHERE stage_id != ${completedStageId}
      `);
    } else {
      await db.execute(sql`
        UPDATE orders
        SET allocated_generic_expenses = ${allocationPerOrder.toString()},
            net_profit = COALESCE(gross_profit, 0) 
                       - COALESCE(commission, 0) 
                       - COALESCE(other_expenses, 0) 
                       - ${allocationPerOrder},
            updated_at = NOW()
      `);
    }

    console.log(`✅ Updated expense allocation: ₹${allocationPerOrder.toFixed(2)} per order`);
  } catch (error) {
    console.error("Error recalculating allocations:", error);
    throw error;
  }
}

/**
 * GET /api/expenses
 * List expenses with filters
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const {
      category,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    let query = db.select().from(genericExpensesTable).$dynamic();

    // Apply filters
    const conditions = [];
    
    if (category) {
      conditions.push(eq(genericExpensesTable.category, category as string));
    }
    
    if (startDate) {
      conditions.push(gte(genericExpensesTable.expenseDate, startDate as string));
    }
    
    if (endDate) {
      conditions.push(lte(genericExpensesTable.expenseDate, endDate as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const expenses = await query
      .orderBy(desc(genericExpensesTable.expenseDate))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(genericExpensesTable);
    
    const total = Number(totalResult[0]?.count || 0);

    res.json({
      expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

/**
 * GET /api/expenses/summary
 * Get expense summary by category and period
 */
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to current month
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate 
      ? new Date(endDate as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Get total by category
    const byCategory = await db
      .select({
        category: genericExpensesTable.category,
        total: sql<number>`COALESCE(SUM(amount), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(genericExpensesTable)
      .where(
        and(
          gte(genericExpensesTable.expenseDate, start.toISOString().split('T')[0]),
          lte(genericExpensesTable.expenseDate, end.toISOString().split('T')[0])
        )
      )
      .groupBy(genericExpensesTable.category);

    // Get total expenses
    const totalResult = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(genericExpensesTable)
      .where(
        and(
          gte(genericExpensesTable.expenseDate, start.toISOString().split('T')[0]),
          lte(genericExpensesTable.expenseDate, end.toISOString().split('T')[0])
        )
      );

    const totalExpenses = Number(totalResult[0]?.total || 0);

    // Get active order count
    const completedStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.name, "COMPLETED"))
      .limit(1);

    const completedStageId = completedStage[0]?.id;

    const activeOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ordersTable)
      .where(completedStageId ? ne(ordersTable.stageId, completedStageId) : sql`true`);

    const activeOrderCount = Number(activeOrdersResult[0]?.count || 0);
    const allocationPerOrder = activeOrderCount > 0 ? totalExpenses / activeOrderCount : 0;

    res.json({
      byCategory: byCategory.map(cat => ({
        category: cat.category,
        total: Number(cat.total),
        count: Number(cat.count),
      })),
      totalExpenses,
      activeOrderCount,
      allocationPerOrder,
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({ error: "Failed to fetch expense summary" });
  }
});

/**
 * GET /api/expenses/:id
 * Get single expense
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    const expense = await db
      .select()
      .from(genericExpensesTable)
      .where(eq(genericExpensesTable.id, id))
      .limit(1);

    if (!expense.length) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense[0]);
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: "Failed to fetch expense" });
  }
});

/**
 * POST /api/expenses
 * Create new expense (triggers recalculation)
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      description,
      amount,
      category,
      expenseDate,
      paymentMethod,
      receiptUrl,
      notes,
    } = req.body;

    // Validation
    if (!description || !amount || !category || !expenseDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Valid categories
    const validCategories = ['Travel', 'Food', 'Office', 'Utilities', 'Misc'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const newExpense = await db
      .insert(genericExpensesTable)
      .values({
        description,
        amount: amount.toString(),
        category,
        expenseDate,
        paymentMethod,
        receiptUrl,
        notes,
        createdBy: (req.user as any)?.id,
      })
      .returning();

    // Trigger allocation recalculation
    await recalculateAllocations();

    res.status(201).json(newExpense[0]);
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

/**
 * PUT /api/expenses/:id
 * Update expense (triggers recalculation)
 */
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    // Check if expense exists
    const existingExpense = await db
      .select()
      .from(genericExpensesTable)
      .where(eq(genericExpensesTable.id, id))
      .limit(1);

    if (!existingExpense.length) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const {
      description,
      amount,
      category,
      expenseDate,
      paymentMethod,
      receiptUrl,
      notes,
    } = req.body;

    // Validate category if provided
    if (category) {
      const validCategories = ['Travel', 'Food', 'Office', 'Utilities', 'Misc'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid category" });
      }
    }

    const updates: any = {
      description,
      amount: amount?.toString(),
      category,
      expenseDate,
      paymentMethod,
      receiptUrl,
      notes,
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedExpense = await db
      .update(genericExpensesTable)
      .set(updates)
      .where(eq(genericExpensesTable.id, id))
      .returning();

    // Trigger allocation recalculation
    await recalculateAllocations();

    res.json(updatedExpense[0]);
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ error: "Failed to update expense" });
  }
});

/**
 * DELETE /api/expenses/:id
 * Delete expense (triggers recalculation)
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid expense ID" });
    }

    await db.delete(genericExpensesTable).where(eq(genericExpensesTable.id, id));

    // Trigger allocation recalculation
    await recalculateAllocations();

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: "Failed to delete expense" });
  }
});

export default router;

// Made with Bob
