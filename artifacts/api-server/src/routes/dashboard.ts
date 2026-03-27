import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { calculationsTable, customersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/stats", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const assignedIds: number[] = JSON.parse(user.assignedCustomerIds || "[]");

    let allCalcs = await db
      .select({ calc: calculationsTable, customerName: customersTable.name })
      .from(calculationsTable)
      .leftJoin(customersTable, eq(calculationsTable.customerId, customersTable.id))
      .orderBy(desc(calculationsTable.date));

    if (user.role !== "admin") {
      allCalcs = allCalcs.filter(
        (c) => c.calc.userId === user.id || (c.calc.customerId && assignedIds.includes(c.calc.customerId))
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const mtdCalcs = allCalcs.filter((c) => new Date(c.calc.date) >= startOfMonth);
    const netProfitMtd = mtdCalcs.reduce((sum, c) => sum + (Number((c.calc.result as any)?.netProfit) || 0), 0);

    let customers = await db.select().from(customersTable);
    if (user.role !== "admin") {
      customers = customers.filter((c) => assignedIds.includes(c.id));
    }

    res.json({
      totalCustomers: customers.length,
      totalCalculations: allCalcs.length,
      netProfitMtd,
      recentCalculations: allCalcs.slice(0, 5).map((c) => ({
        id: c.calc.id,
        customerId: c.calc.customerId,
        customerName: c.customerName,
        userId: c.calc.userId,
        label: c.calc.label,
        billNumber: c.calc.billNumber,
        notes: c.calc.notes,
        date: c.calc.date,
        inputs: c.calc.inputs,
        result: c.calc.result,
        createdAt: c.calc.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
