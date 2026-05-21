import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import playersRouter from "./players.js";
import bankRouter from "./bank.js";
import gameSessionsRouter from "./gameSessions.js";
import adminRouter from "./admin.js";
import chipInventoryRouter from "./chipInventory.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(bankRouter);
router.use(gameSessionsRouter);
router.use(adminRouter);
router.use(chipInventoryRouter);

export default router;
