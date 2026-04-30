import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { suppliersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

// List all suppliers
router.get("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const suppliers = await db.select().from(suppliersTable).orderBy(desc(suppliersTable.createdAt));

    // For now, all approved users can see all suppliers
    // TODO: Implement assignedSupplierIds if needed for role-based filtering
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
});

// Create new supplier
router.post("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      businessName,
      gstin,
      contactPerson,
      status,
      address,
      state,
      pincode,
      contactInfo,
      paymentTerms,
      bankAccount,
    } = req.body;

    // Check for duplicate GSTIN if provided
    if (gstin) {
      const existing = await db.select().from(suppliersTable).where(eq(suppliersTable.gstin, gstin)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: "A supplier with this GSTIN already exists" });
      }
    }

    const [supplier] = await db
      .insert(suppliersTable)
      .values({
        businessName,
        gstin,
        contactPerson,
        status,
        address,
        state,
        pincode,
        contactInfo,
        paymentTerms,
        bankAccount: bankAccount ? JSON.stringify(bankAccount) : null,
        createdBy: user.id,
      })
      .returning();

    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
});

// Get single supplier
router.get("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    const id = Number(req.params.id);

    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    // For now, all approved users can access all suppliers
    // TODO: Implement assignedSupplierIds if needed for role-based access control

    // Parse bankAccount JSON if it exists
    const supplierWithParsedBank = {
      ...supplier,
      bankAccount: supplier.bankAccount ? JSON.parse(supplier.bankAccount) : null,
    };

    res.json(supplierWithParsedBank);
  } catch (err) {
    next(err);
  }
});

// Update supplier
router.put("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = Number(req.params.id);
    const {
      businessName,
      gstin,
      contactPerson,
      status,
      address,
      state,
      pincode,
      contactInfo,
      paymentTerms,
      bankAccount,
    } = req.body;

    // Check for duplicate GSTIN if provided (excluding current supplier)
    if (gstin) {
      const existing = await db.select().from(suppliersTable).where(eq(suppliersTable.gstin, gstin)).limit(1);
      if (existing.length > 0 && existing[0].id !== id) {
        return res.status(400).json({ error: "A supplier with this GSTIN already exists" });
      }
    }

    const [supplier] = await db
      .update(suppliersTable)
      .set({
        businessName,
        gstin,
        contactPerson,
        status,
        address,
        state,
        pincode,
        contactInfo,
        paymentTerms,
        bankAccount: bankAccount ? JSON.stringify(bankAccount) : null,
        updatedAt: new Date(),
      })
      .where(eq(suppliersTable.id, id))
      .returning();

    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    // Parse bankAccount JSON if it exists
    const supplierWithParsedBank = {
      ...supplier,
      bankAccount: supplier.bankAccount ? JSON.parse(supplier.bankAccount) : null,
    };

    res.json(supplierWithParsedBank);
  } catch (err) {
    next(err);
  }
});

// Delete supplier
router.delete("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const id = Number(req.params.id);
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    next(err);
  }
});

// Push supplier to Zoho Books
router.post("/:id/push-zoho", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id)).limit(1);

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Import Zoho service
    const { pushContact } = await import("../lib/zoho.js");

    // Update status to syncing
    await db.update(suppliersTable)
      .set({ zohoSyncStatus: "syncing" })
      .where(eq(suppliersTable.id, id));

    try {
      const result = await pushContact(supplier, "vendor");

      if (result.success && result.zohoId) {
        await db.update(suppliersTable)
          .set({
            zohoId: result.zohoId,
            zohoSyncStatus: "synced",
            zohoSyncedAt: new Date(),
            zohoErrorMessage: null,
          })
          .where(eq(suppliersTable.id, id));

        res.json({ message: "Synced successfully", zohoId: result.zohoId });
      } else {
        throw new Error(result.error || "Zoho API error");
      }
    } catch (error: any) {
      await db.update(suppliersTable)
        .set({
          zohoSyncStatus: "error",
          zohoErrorMessage: error.message,
        })
        .where(eq(suppliersTable.id, id));

      throw error;
    }
  } catch (err) {
    next(err);
  }
});

export default router;

// Made with Bob
