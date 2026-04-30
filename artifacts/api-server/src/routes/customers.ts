import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { customersTable, calculationsTable } from "@workspace/db/schema";
import { eq, count, inArray, desc } from "drizzle-orm";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const customers = await db.select().from(customersTable).orderBy(desc(customersTable.createdAt));

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
        zohoId: c.zohoId,
        zohoSyncStatus: c.zohoSyncStatus,
        zohoSyncedAt: c.zohoSyncedAt,
        zohoErrorMessage: c.zohoErrorMessage,
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
    const { name, gstin, address, contact, gstStatus, state, pincode } = req.body;
    
    // Check for duplicate GSTIN if provided
    if (gstin) {
      const existing = await db.select().from(customersTable).where(eq(customersTable.gstin, gstin)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: "A customer with this GSTIN already exists" });
      }
    }
    
    const [customer] = await db
      .insert(customersTable)
      .values({ name, gstin, address, contact, gstStatus, state, pincode, createdBy: user.id })
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
    const { name, gstin, address, contact, gstStatus, state, pincode } = req.body;
    
    // Check for duplicate GSTIN if provided (excluding current customer)
    if (gstin) {
      const existing = await db.select().from(customersTable).where(eq(customersTable.gstin, gstin)).limit(1);
      if (existing.length > 0 && existing[0].id !== id) {
        return res.status(400).json({ error: "A customer with this GSTIN already exists" });
      }
    }
    
    const [customer] = await db
      .update(customersTable)
      .set({ name, gstin, address, contact, gstStatus, state, pincode })
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

// Push customer to Zoho Books
router.post("/:id/push-zoho", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id)).limit(1);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Import Zoho service
    const { pushContact } = await import("../lib/zoho.js");

    // Update status to syncing
    await db.update(customersTable)
      .set({ zohoSyncStatus: "syncing" })
      .where(eq(customersTable.id, id));

    try {
      const result = await pushContact(customer, "customer");

      if (result.success && result.zohoId) {
        await db.update(customersTable)
          .set({
            zohoId: result.zohoId,
            zohoSyncStatus: "synced",
            zohoSyncedAt: new Date(),
            zohoErrorMessage: null,
          })
          .where(eq(customersTable.id, id));

        res.json({ message: "Synced successfully", zohoId: result.zohoId });
      } else {
        throw new Error(result.error || "Zoho API error");
      }
    } catch (error: any) {
      await db.update(customersTable)
        .set({
          zohoSyncStatus: "error",
          zohoErrorMessage: error.message,
        })
        .where(eq(customersTable.id, id));

      throw error;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
