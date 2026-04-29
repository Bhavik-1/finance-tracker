import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getBudgetSummary, upsertBudget } from "../controllers/budget.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/summary", getBudgetSummary);
router.post("/", upsertBudget);

export default router;
