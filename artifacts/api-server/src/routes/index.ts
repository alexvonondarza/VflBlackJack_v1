import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import playersRouter from "./players.js";
import bankRouter from "./bank.js";
import gameSessionsRouter from "./gameSessions.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(bankRouter);
router.use(gameSessionsRouter);

export default router;
