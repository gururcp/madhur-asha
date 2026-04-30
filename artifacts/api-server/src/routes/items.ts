import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { itemsTable } from "@workspace/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { requireApproved } from "../lib/auth.js";

const router: IRouter = Router();

// List all items
router.get("/", requireApproved, async (req, res, next) => {
  try {
    const items = await db.select().from(itemsTable).orderBy(desc(itemsTable.createdAt));
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// Create new item
router.post("/", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      name,
      hsnCode,
      description,
      unit,
      purchaseRate,
      sellingRate,
      gstRate,
      itemType,
    } = req.body;

    // Validate HSN code (4-8 digits) - only if provided
    if (hsnCode && hsnCode.trim() !== "" && !/^\d{4,8}$/.test(hsnCode)) {
      return res.status(400).json({ error: "HSN/SAC code must be 4-8 digits" });
    }

    // Use default HSN code if not provided (since DB requires it)
    const finalHsnCode = hsnCode && hsnCode.trim() !== "" ? hsnCode : "0000";

    const [item] = await db
      .insert(itemsTable)
      .values({
        name,
        hsnCode: finalHsnCode,
        description,
        unit,
        purchaseRate,
        sellingRate,
        gstRate,
        itemType,
        createdBy: user.id,
      })
      .returning();

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Get single item
router.get("/:id", requireApproved, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);
    
    if (!item) return res.status(404).json({ error: "Item not found" });
    
    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Update item
router.put("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin" && user.role !== "customer_access") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const id = Number(req.params.id);
    const {
      name,
      hsnCode,
      description,
      unit,
      purchaseRate,
      sellingRate,
      gstRate,
      itemType,
    } = req.body;

    // Validate HSN code (4-8 digits) - only if provided
    if (hsnCode && hsnCode.trim() !== "" && !/^\d{4,8}$/.test(hsnCode)) {
      return res.status(400).json({ error: "HSN/SAC code must be 4-8 digits" });
    }

    // Use default HSN code if not provided (since DB requires it)
    const finalHsnCode = hsnCode && hsnCode.trim() !== "" ? hsnCode : "0000";

    const [item] = await db
      .update(itemsTable)
      .set({
        name,
        hsnCode: finalHsnCode,
        description,
        unit,
        purchaseRate,
        sellingRate,
        gstRate,
        itemType,
        updatedAt: new Date(),
      })
      .where(eq(itemsTable.id, id))
      .returning();

    if (!item) return res.status(404).json({ error: "Item not found" });

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// Delete item
router.delete("/:id", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") return res.status(403).json({ error: "Admin only" });

    const id = Number(req.params.id);
    await db.delete(itemsTable).where(eq(itemsTable.id, id));
    res.json({ message: "Item deleted" });
  } catch (err) {
    next(err);
  }
});

// Push single item to Zoho Books
router.post("/:id/push-zoho", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const id = Number(req.params.id);
    const [item] = await db.select().from(itemsTable).where(eq(itemsTable.id, id)).limit(1);

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    console.log("=== ZOHO PUSH ITEM DEBUG ===");
    console.log("Item ID:", id);
    console.log("Item Name:", item.name);
    console.log("Item Data:", JSON.stringify(item, null, 2));
    console.log("HSN Code:", item.hsnCode, "(type:", typeof item.hsnCode, ")");
    console.log("Selling Rate:", item.sellingRate, "(type:", typeof item.sellingRate, ")");
    console.log("Purchase Rate:", item.purchaseRate, "(type:", typeof item.purchaseRate, ")");
    console.log("GST Rate:", item.gstRate, "(type:", typeof item.gstRate, ")");
    console.log("Unit:", item.unit);

    // Import Zoho service
    const { pushItem } = await import("../lib/zoho.js");

    // Update status to syncing
    await db.update(itemsTable)
      .set({ zohoSyncStatus: "syncing" })
      .where(eq(itemsTable.id, id));

    try {
      console.log("Calling pushItem() function...");
      const result = await pushItem(item);
      console.log("pushItem() result:", JSON.stringify(result, null, 2));

      if (result.success && result.zohoId) {
        await db.update(itemsTable)
          .set({
            zohoId: result.zohoId,
            zohoSyncStatus: "synced",
            zohoSyncedAt: new Date(),
            zohoErrorMessage: null,
          })
          .where(eq(itemsTable.id, id));

        console.log("✓ Item synced successfully to Zoho. Zoho ID:", result.zohoId);
        res.json({ message: "Synced successfully", zohoId: result.zohoId });
      } else {
        const errorMsg = result.error || "Zoho API error";
        console.error("✗ Zoho push failed:", errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("✗ Exception during Zoho push:", error.message);
      console.error("Stack trace:", error.stack);
      
      await db.update(itemsTable)
        .set({
          zohoSyncStatus: "error",
          zohoErrorMessage: error.message,
        })
        .where(eq(itemsTable.id, id));

      throw error;
    }
  } catch (err) {
    next(err);
  }
});

// Bulk push items to Zoho Books
router.post("/bulk-push-zoho", requireApproved, async (req, res, next) => {
  try {
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    const { itemIds } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: "itemIds must be a non-empty array" });
    }

    // Fetch all items
    const items = await db.select().from(itemsTable).where(inArray(itemsTable.id, itemIds));

    if (items.length === 0) {
      return res.status(404).json({ error: "No items found" });
    }

    // Import Zoho service
    const { pushItem } = await import("../lib/zoho.js");

    // Process each item sequentially
    const results = [];

    for (const item of items) {
      // Update status to syncing
      await db.update(itemsTable)
        .set({ zohoSyncStatus: "syncing" })
        .where(eq(itemsTable.id, item.id));

      try {
        const result = await pushItem(item);

        if (result.success && result.zohoId) {
          await db.update(itemsTable)
            .set({
              zohoId: result.zohoId,
              zohoSyncStatus: "synced",
              zohoSyncedAt: new Date(),
              zohoErrorMessage: null,
            })
            .where(eq(itemsTable.id, item.id));

          results.push({
            itemId: item.id,
            itemName: item.name,
            success: true,
            zohoId: result.zohoId,
          });
        } else {
          throw new Error(result.error || "Zoho API error");
        }
      } catch (error: any) {
        await db.update(itemsTable)
          .set({
            zohoSyncStatus: "error",
            zohoErrorMessage: error.message,
          })
          .where(eq(itemsTable.id, item.id));

        results.push({
          itemId: item.id,
          itemName: item.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    res.json({
      message: `Bulk push completed: ${successCount} succeeded, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: failureCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

// Made with Bob
