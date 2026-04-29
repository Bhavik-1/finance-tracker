import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import {
  createExpense,
  deleteExpense,
  getDashboardStats,
  getExpenses,
  getMonthlySummary,
  updateExpense,
} from "../controllers/expense.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createExpense);
router.get("/", getExpenses);
router.get("/dashboard", getDashboardStats);
router.get("/monthly-summary", getMonthlySummary);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;
