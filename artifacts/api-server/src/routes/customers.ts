import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, calculationsTable } from "@workspace/db/schema";
import { eq, count, inArray } from "drizzle-orm";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const customers = await db.select().from(customersTable).orderBy(customersTable.name);

    const assignedIds: number[] = JSON.parse(user.assignedCustomerIds || "[]");
    const filteredCustomers =
      user.role === "admin" ? customers : customers.filter((c) => assignedIds.includes(c.id));

    const counts = await db
      .select({ customerId: calculationsTable.customerId, cnt: count(calculationsTable.id) })
      .from(calculationsTable)
      .groupBy(calculationsTable.customerId);

    const countMap = new Map(counts.map((c) => [c.customerId, Number(c.cnt)]));

    res.json(
      filteredCustomers.map((c) => ({
        id: c.id,
        name: c.name,
        gstin: c.gstin,
        address: c.address,
        contact: c.contact,
        createdAt: c.createdAt,
        calculationCount: countMap.get(c.id) || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { name, gstin, address, contact } = req.body;
    const [customer] = await db
      .insert(customersTable)
      .values({ name, gstin, address, contact, createdBy: user.id })
      .returning();
    res.status(201).json({ ...customer, calculationCount: 0 });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const assignedIds: number[] = JSON.parse(user.assignedCustomerIds || "[]");
    if (user.role !== "admin" && !assignedIds.includes(id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const [{ cnt }] = await db
      .select({ cnt: count(calculationsTable.id) })
      .from(calculationsTable)
      .where(eq(calculationsTable.customerId, id));

    res.json({ ...customer, calculationCount: Number(cnt) });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const id = Number(req.params.id);
    const { name, gstin, address, contact } = req.body;
    const [customer] = await db
      .update(customersTable)
      .set({ name, gstin, address, contact })
      .where(eq(customersTable.id, id))
      .returning();
    if (!customer) return res.status(404).json({ error: "Customer not found" });

    const [{ cnt }] = await db
      .select({ cnt: count(calculationsTable.id) })
      .from(calculationsTable)
      .where(eq(calculationsTable.customerId, id));

    res.json({ ...customer, calculationCount: Number(cnt) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    const id = Number(req.params.id);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.json({ message: "Customer deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
