import Expense from "../models/expense.model.js";

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parsePurchaseType = (value) => {
  if (!value) return "planned";
  const normalized = String(value).trim().toLowerCase();
  return normalized === "impulse" || normalized === "planned" ? normalized : null;
};

export const createExpense = async (req, res) => {
  try {
    const { amount, category, date, note, purchaseType } = req.body;

    if (amount === undefined || !category || !date) {
      return res.status(400).json({ message: "Amount, category, and date are required." });
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }

    const expenseDate = parseDate(date);
    if (!expenseDate) {
      return res.status(400).json({ message: "Please provide a valid date." });
    }

    const parsedPurchaseType = parsePurchaseType(purchaseType);
    if (!parsedPurchaseType) {
      return res.status(400).json({ message: "purchaseType must be impulse or planned." });
    }

    const expense = await Expense.create({
      user: req.user._id,
      amount: numericAmount,
      category: category.trim(),
      date: expenseDate,
      note: note?.trim() || "",
      purchaseType: parsedPurchaseType,
    });

    return res.status(201).json({
      message: "Expense added successfully.",
      expense,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while adding expense." });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, q, page = 1, limit = 10 } = req.query;
    const query = { user: req.user._id };
    const currentPage = Math.max(Number(page) || 1, 1);
    const pageSize = Math.max(Number(limit) || 10, 1);

    if (category) {
      query.category = category.trim();
    }

    if (q?.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      query.$or = [{ category: searchRegex }, { note: searchRegex }];
    }

    if (startDate || endDate) {
      query.date = {};

      const parsedStartDate = parseDate(startDate);
      const parsedEndDate = parseDate(endDate);

      if (startDate && !parsedStartDate) {
        return res.status(400).json({ message: "Invalid startDate." });
      }

      if (endDate && !parsedEndDate) {
        return res.status(400).json({ message: "Invalid endDate." });
      }

      if (parsedStartDate) {
        query.date.$gte = parsedStartDate;
      }

      if (parsedEndDate) {
        query.date.$lte = parsedEndDate;
      }
    }

    const [expenses, totalCount] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize),
      Expense.countDocuments(query),
    ]);

    return res.status(200).json({
      count: expenses.length,
      totalCount,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      expenses,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching expenses." });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, date, note, purchaseType } = req.body;

    const expense = await Expense.findOne({ _id: id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number." });
      }
      expense.amount = numericAmount;
    }

    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({ message: "Category cannot be empty." });
      }
      expense.category = category.trim();
    }

    if (date !== undefined) {
      const expenseDate = parseDate(date);
      if (!expenseDate) {
        return res.status(400).json({ message: "Please provide a valid date." });
      }
      expense.date = expenseDate;
    }

    if (note !== undefined) {
      expense.note = note.trim();
    }

    if (purchaseType !== undefined) {
      const parsedPurchaseType = parsePurchaseType(purchaseType);
      if (!parsedPurchaseType) {
        return res.status(400).json({ message: "purchaseType must be impulse or planned." });
      }
      expense.purchaseType = parsedPurchaseType;
    }

    await expense.save();

    return res.status(200).json({
      message: "Expense updated successfully.",
      expense,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating expense." });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({ _id: id, user: req.user._id });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    return res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error while deleting expense." });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totals, categoryBreakdown, purchaseTypeBreakdown] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalSpending: { $sum: "$amount" },
            totalExpenses: { $sum: 1 },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: { $ifNull: ["$purchaseType", "planned"] },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const impulseCount =
      purchaseTypeBreakdown.find((item) => item._id === "impulse")?.count || 0;
    const plannedCount = purchaseTypeBreakdown.find((item) => item._id === "planned")?.count || 0;
    const totalTypeCount = impulseCount + plannedCount;
    const impulsePercentage = totalTypeCount ? (impulseCount / totalTypeCount) * 100 : 0;

    return res.status(200).json({
      totalSpending: totals[0]?.totalSpending || 0,
      totalExpenses: totals[0]?.totalExpenses || 0,
      categoryBreakdown: categoryBreakdown.map((item) => ({
        category: item._id,
        total: item.total,
      })),
      impulseCount,
      plannedCount,
      impulsePercentage,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching dashboard stats." });
  }
};

export const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const monthlySummary = await Expense.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalAmount: { $sum: "$amount" },
          totalExpenses: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1,
        },
      },
    ]);

    return res.status(200).json({
      monthlySummary: monthlySummary.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        totalAmount: item.totalAmount,
        totalExpenses: item.totalExpenses,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching monthly summary." });
  }
};
