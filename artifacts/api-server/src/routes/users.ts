import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { sendApprovalEmail } from "../lib/email.js";

const router: IRouter = Router();

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
    res.json(
      users.map((u) => ({
        id: u.id,
        googleId: u.googleId,
        email: u.email,
        name: u.name,
        picture: u.picture,
        role: u.role,
        status: u.status,
        assignedCustomerIds: JSON.parse(u.assignedCustomerIds || "[]"),
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post("/:id/approve", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role, assignedCustomerIds } = req.body;

    const [user] = await db
      .update(usersTable)
      .set({
        role: role || "calc_only",
        status: "approved",
        assignedCustomerIds: JSON.stringify(assignedCustomerIds || []),
      })
      .where(eq(usersTable.id, id))
      .returning();

    if (!user) return res.status(404).json({ error: "User not found" });

    await sendApprovalEmail({ name: user.name, email: user.email }, user.role);

    res.json({
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      status: user.status,
      assignedCustomerIds: JSON.parse(user.assignedCustomerIds || "[]"),
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reject", requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [user] = await db.update(usersTable).set({ status: "rejected" }).where(eq(usersTable.id, id)).returning();

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      status: user.status,
      assignedCustomerIds: JSON.parse(user.assignedCustomerIds || "[]"),
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
