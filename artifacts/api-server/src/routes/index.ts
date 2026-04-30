import { type IRouter, Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import customersRouter from "./customers.js";
import suppliersRouter from "./suppliers.js";
import itemsRouter from "./items.js";
import calculationsRouter from "./calculations.js";
import dashboardRouter from "./dashboard.js";
import gstRouter from "./gst.js";
import gemStagesRouter from "./gem-stages.js";
import ordersRouter from "./orders.js";
import expensesRouter from "./expenses.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/gst", gstRouter);
router.use("/gem-stages", gemStagesRouter);
router.use("/orders", ordersRouter);
router.use("/expenses", expensesRouter);
router.use("/customers", customersRouter);
router.use("/suppliers", suppliersRouter);
router.use("/items", itemsRouter);
router.use("/calculations", calculationsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
