import Budget from "../models/budget.model.js";
import Expense from "../models/expense.model.js";

const getMonthYear = (monthValue, yearValue) => {
  const now = new Date();
  const month = Number(monthValue) || now.getMonth() + 1;
  const year = Number(yearValue) || now.getFullYear();
  return { month, year };
};

export const upsertBudget = async (req, res) => {
  try {
    const { amount, month, year } = req.body;
    const numericAmount = Number(amount);

    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ message: "Budget amount must be a valid positive number." });
    }

    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12 || !selectedYear) {
      return res.status(400).json({ message: "Valid month and year are required." });
    }

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month: selectedMonth, year: selectedYear },
      { amount: numericAmount },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: "Budget saved successfully.",
      budget,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while saving budget." });
  }
};

export const getBudgetSummary = async (req, res) => {
  try {
    const { month, year } = getMonthYear(req.query.month, req.query.year);

    const budget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
    });

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    const spendingResult = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: monthStart, $lt: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
        },
      },
    ]);

    const budgetAmount = budget?.amount || 0;
    const totalSpent = spendingResult[0]?.totalSpent || 0;
    const remaining = budgetAmount - totalSpent;

    return res.status(200).json({
      month,
      year,
      budgetAmount,
      totalSpent,
      remaining,
      isOverBudget: remaining < 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching budget summary." });
  }
};

