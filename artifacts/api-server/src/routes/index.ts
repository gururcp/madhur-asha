import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import customersRouter from "./customers.js";
import calculationsRouter from "./calculations.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/customers", customersRouter);
router.use("/calculations", calculationsRouter);
router.use("/dashboard", calculationsRouter);

export default router;
