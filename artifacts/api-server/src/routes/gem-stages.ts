import { Router } from "express";
import { db } from "@workspace/db";
import { gemStagesTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();

/**
 * GET /api/gem-stages
 * List all stages ordered by sortOrder
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const stages = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.isActive, true))
      .orderBy(asc(gemStagesTable.sortOrder));

    res.json(stages);
  } catch (error) {
    console.error("Error fetching gem stages:", error);
    res.status(500).json({ error: "Failed to fetch stages" });
  }
});

/**
 * GET /api/gem-stages/:id
 * Get a single stage by ID
 */
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid stage ID" });
    }

    const stage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.id, id))
      .limit(1);

    if (!stage.length) {
      return res.status(404).json({ error: "Stage not found" });
    }

    res.json(stage[0]);
  } catch (error) {
    console.error("Error fetching gem stage:", error);
    res.status(500).json({ error: "Failed to fetch stage" });
  }
});

/**
 * POST /api/gem-stages
 * Create a new stage (admin only)
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      displayName,
      description,
      color,
      icon,
      expectedDurationDays,
      requiresPo,
      requiresInvoice,
      requiresEwayBill,
      requiresPayment,
    } = req.body;

    // Validation
    if (!name || !displayName) {
      return res.status(400).json({ error: "Name and display name are required" });
    }

    // Get the highest sort order
    const maxSortOrder = await db
      .select({ max: gemStagesTable.sortOrder })
      .from(gemStagesTable)
      .orderBy(asc(gemStagesTable.sortOrder))
      .limit(1);

    const nextSortOrder = (maxSortOrder[0]?.max || 0) + 1;

    const newStage = await db
      .insert(gemStagesTable)
      .values({
        name,
        displayName,
        description,
        color: color || "#6366f1",
        icon,
        sortOrder: nextSortOrder,
        expectedDurationDays,
        isActive: true,
        isSystem: false,
        requiresPo: requiresPo || false,
        requiresInvoice: requiresInvoice || false,
        requiresEwayBill: requiresEwayBill || false,
        requiresPayment: requiresPayment || false,
        createdBy: (req.user as any)?.id,
      })
      .returning();

    res.status(201).json(newStage[0]);
  } catch (error) {
    console.error("Error creating gem stage:", error);
    res.status(500).json({ error: "Failed to create stage" });
  }
});

/**
 * PUT /api/gem-stages/:id
 * Update a stage (admin only)
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid stage ID" });
    }

    // Check if stage exists
    const existingStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.id, id))
      .limit(1);

    if (!existingStage.length) {
      return res.status(404).json({ error: "Stage not found" });
    }

    // Prevent editing system stages' critical fields
    if (existingStage[0].isSystem) {
      const { name, sortOrder, ...allowedUpdates } = req.body;
      
      const updatedStage = await db
        .update(gemStagesTable)
        .set({
          ...allowedUpdates,
          updatedAt: new Date(),
        })
        .where(eq(gemStagesTable.id, id))
        .returning();

      return res.json(updatedStage[0]);
    }

    // Non-system stages can be fully updated
    const {
      name,
      displayName,
      description,
      color,
      icon,
      expectedDurationDays,
      requiresPo,
      requiresInvoice,
      requiresEwayBill,
      requiresPayment,
      isActive,
    } = req.body;

    const updatedStage = await db
      .update(gemStagesTable)
      .set({
        name,
        displayName,
        description,
        color,
        icon,
        expectedDurationDays,
        requiresPo,
        requiresInvoice,
        requiresEwayBill,
        requiresPayment,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(gemStagesTable.id, id))
      .returning();

    res.json(updatedStage[0]);
  } catch (error) {
    console.error("Error updating gem stage:", error);
    res.status(500).json({ error: "Failed to update stage" });
  }
});

/**
 * DELETE /api/gem-stages/:id
 * Delete a stage (admin only, soft delete)
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid stage ID" });
    }

    // Check if stage exists
    const existingStage = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.id, id))
      .limit(1);

    if (!existingStage.length) {
      return res.status(404).json({ error: "Stage not found" });
    }

    // Prevent deleting system stages
    if (existingStage[0].isSystem) {
      return res.status(403).json({ error: "Cannot delete system stage" });
    }

    // Soft delete
    await db
      .update(gemStagesTable)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(gemStagesTable.id, id));

    res.json({ message: "Stage deleted successfully" });
  } catch (error) {
    console.error("Error deleting gem stage:", error);
    res.status(500).json({ error: "Failed to delete stage" });
  }
});

/**
 * POST /api/gem-stages/reorder
 * Reorder stages (admin only)
 * Body: { stageIds: [id1, id2, id3, ...] } in desired order
 */
router.post("/reorder", requireAdmin, async (req, res) => {
  try {
    const { stageIds } = req.body;

    if (!Array.isArray(stageIds) || stageIds.length === 0) {
      return res.status(400).json({ error: "Invalid stage IDs array" });
    }

    // Update sort order for each stage
    for (let i = 0; i < stageIds.length; i++) {
      await db
        .update(gemStagesTable)
        .set({
          sortOrder: i + 1,
          updatedAt: new Date(),
        })
        .where(eq(gemStagesTable.id, stageIds[i]));
    }

    // Fetch updated stages
    const updatedStages = await db
      .select()
      .from(gemStagesTable)
      .where(eq(gemStagesTable.isActive, true))
      .orderBy(asc(gemStagesTable.sortOrder));

    res.json(updatedStages);
  } catch (error) {
    console.error("Error reordering gem stages:", error);
    res.status(500).json({ error: "Failed to reorder stages" });
  }
});

export default router;

// Made with Bob
