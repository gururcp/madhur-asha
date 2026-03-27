import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { calculationsTable, customersTable } from "@workspace/db/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { requireApproved, requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.status !== "approved") {
      return res.status(403).json({ error: "Account not approved" });
    }
    if (user.role === "calc_only") {
      return res.json([]);
    }

    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const assignedIds: number[] = JSON.parse(user.assignedCustomerIds || "[]");

    let calcs = await db
      .select({
        calc: calculationsTable,
        customerName: customersTable.name,
      })
      .from(calculationsTable)
      .leftJoin(customersTable, eq(calculationsTable.customerId, customersTable.id))
      .orderBy(desc(calculationsTable.date));

    if (user.role !== "admin") {
      calcs = calcs.filter(
        (c) => c.calc.userId === user.id || (c.calc.customerId && assignedIds.includes(c.calc.customerId))
      );
    }

    if (customerId) {
      calcs = calcs.filter((c) => c.calc.customerId === customerId);
    }

    res.json(
      calcs.map((c) => ({
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
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role === "calc_only") {
      return res.status(403).json({ error: "Calculator-only access cannot save calculations" });
    }

    const { customerId, label, billNumber, notes, date, inputs, result } = req.body;

    const [calc] = await db
      .insert(calculationsTable)
      .values({
        customerId: customerId || null,
        userId: user.id,
        label,
        billNumber,
        notes,
        date: new Date(date),
        inputs,
        result,
        netProfit: result?.netProfit,
      })
      .returning();

    const [customerRow] = customerId
      ? await db.select().from(customersTable).where(eq(customersTable.id, customerId)).limit(1)
      : [null];

    res.status(201).json({
      id: calc.id,
      customerId: calc.customerId,
      customerName: customerRow?.name || null,
      userId: calc.userId,
      label: calc.label,
      billNumber: calc.billNumber,
      notes: calc.notes,
      date: calc.date,
      inputs: calc.inputs,
      result: calc.result,
      createdAt: calc.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboard/stats", requireApproved, async (req, res, next) => {
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

router.get("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [row] = await db
      .select({ calc: calculationsTable, customerName: customersTable.name })
      .from(calculationsTable)
      .leftJoin(customersTable, eq(calculationsTable.customerId, customersTable.id))
      .where(eq(calculationsTable.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Not found" });

    const assignedIds: number[] = JSON.parse(user.assignedCustomerIds || "[]");
    if (
      user.role !== "admin" &&
      row.calc.userId !== user.id &&
      !(row.calc.customerId && assignedIds.includes(row.calc.customerId))
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({
      id: row.calc.id,
      customerId: row.calc.customerId,
      customerName: row.customerName,
      userId: row.calc.userId,
      label: row.calc.label,
      billNumber: row.calc.billNumber,
      notes: row.calc.notes,
      date: row.calc.date,
      inputs: row.calc.inputs,
      result: row.calc.result,
      createdAt: row.calc.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [row] = await db
      .select()
      .from(calculationsTable)
      .where(eq(calculationsTable.id, id))
      .limit(1);

    if (!row) return res.status(404).json({ error: "Not found" });
    if (user.role !== "admin" && row.userId !== user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(calculationsTable).where(eq(calculationsTable.id, id));
    res.json({ message: "Calculation deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
