import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playersRouter from "./players";
import bankRouter from "./bank";
import gameSessionsRouter from "./gameSessions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playersRouter);
router.use(bankRouter);
router.use(gameSessionsRouter);

export default router;
