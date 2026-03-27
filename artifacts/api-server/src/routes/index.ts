import { type IRouter, Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import customersRouter from "./customers.js";
import calculationsRouter from "./calculations.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/customers", customersRouter);
router.use("/calculations", calculationsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
