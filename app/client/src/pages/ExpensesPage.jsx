import { useEffect, useMemo, useState } from "react";
import {
  createExpenseRequest,
  deleteExpenseRequest,
  getDashboardStatsRequest,
  getExpensesRequest,
  getMonthlySummaryRequest,
  updateExpenseRequest,
} from "../api/expenseApi";
import { getBudgetSummaryRequest, upsertBudgetRequest } from "../api/budgetApi";
import { useAuth } from "../context/AuthContext";

const INITIAL_FORM = {
  amount: "",
  category: "",
  date: "",
  note: "",
  purchaseType: "planned",
};

const currentDate = new Date();

function ExpensesPage() {
  const { user, logout } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalSpending: 0,
    totalExpenses: 0,
    categoryBreakdown: [],
    impulseCount: 0,
    plannedCount: 0,
    impulsePercentage: 0,
  });
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [budgetSummary, setBudgetSummary] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    budgetAmount: 0,
    totalSpent: 0,
    remaining: 0,
    isOverBudget: false,
  });
  const [budgetForm, setBudgetForm] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    amount: "",
  });
  const [filters, setFilters] = useState({
    category: "",
    startDate: "",
    endDate: "",
    q: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0,
  });
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [budgetError, setBudgetError] = useState("");

  const loadDashboard = async () => {
    const data = await getDashboardStatsRequest();
    setDashboardStats({
      totalSpending: data.totalSpending || 0,
      totalExpenses: data.totalExpenses || 0,
      categoryBreakdown: data.categoryBreakdown || [],
      impulseCount: data.impulseCount || 0,
      plannedCount: data.plannedCount || 0,
      impulsePercentage: data.impulsePercentage || 0,
    });
  };

  const loadMonthlySummary = async () => {
    const data = await getMonthlySummaryRequest();
    setMonthlySummary(data.monthlySummary || []);
  };

  const loadBudgetSummary = async (month = budgetForm.month, year = budgetForm.year) => {
    const data = await getBudgetSummaryRequest({ month, year });
    setBudgetSummary(data);
  };

  const loadAnalytics = async () => {
    await Promise.all([loadDashboard(), loadMonthlySummary(), loadBudgetSummary()]);
  };

  const loadExpenses = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const data = await getExpensesRequest(activeFilters);
      setExpenses(data.expenses || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || 1,
        totalCount: data.totalCount || 0,
      });
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Failed to fetch expenses.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        await Promise.all([loadExpenses(), loadAnalytics()]);
      } catch (apiError) {
        const message = apiError.response?.data?.message || "Failed to load page data.";
        setError(message);
      }
    };

    initializePage();
  }, []);

  const filteredTotalSpending = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount), 0),
    [expenses]
  );
  const highestCategoryTotal = useMemo(
    () => Math.max(...dashboardStats.categoryBreakdown.map((item) => item.total), 0),
    [dashboardStats.categoryBreakdown]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingExpenseId("");
  };

  const handleApplyFilters = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters, page: 1 };
    setFilters(nextFilters);
    await loadExpenses(nextFilters);
  };

  const handleClearFilters = async () => {
    const cleared = { category: "", startDate: "", endDate: "", q: "", page: 1, limit: 10 };
    setFilters(cleared);
    await loadExpenses(cleared);
  };

  const handleSubmitExpense = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const payload = {
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      note: formData.note,
      purchaseType: formData.purchaseType,
    };

    try {
      if (editingExpenseId) {
        await updateExpenseRequest(editingExpenseId, payload);
      } else {
        await createExpenseRequest(payload);
      }

      resetForm();
      await Promise.all([loadExpenses(filters), loadAnalytics()]);
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Failed to save expense.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpenseId(expense._id);
    setFormData({
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10),
      note: expense.note || "",
      purchaseType: expense.purchaseType || "planned",
    });
  };

  const handleDelete = async (id) => {
    const shouldDelete = window.confirm("Delete this expense?");
    if (!shouldDelete) return;

    try {
      await deleteExpenseRequest(id);
      await Promise.all([loadExpenses(filters), loadAnalytics()]);
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Failed to delete expense.";
      setError(message);
    }
  };

  const handleBudgetChange = (event) => {
    setBudgetForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSaveBudget = async (event) => {
    event.preventDefault();
    setBudgetSubmitting(true);
    setBudgetError("");

    try {
      await upsertBudgetRequest({
        amount: Number(budgetForm.amount),
        month: Number(budgetForm.month),
        year: Number(budgetForm.year),
      });

      await loadBudgetSummary(Number(budgetForm.month), Number(budgetForm.year));
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Failed to save budget.";
      setBudgetError(message);
    } finally {
      setBudgetSubmitting(false);
    }
  };

  const handlePageChange = async (nextPage) => {
    const safePage = Math.min(Math.max(nextPage, 1), pagination.totalPages || 1);
    const nextFilters = { ...filters, page: safePage };
    setFilters(nextFilters);
    await loadExpenses(nextFilters);
  };

  const handleExportCsv = async () => {
    try {
      const data = await getExpensesRequest({ ...filters, page: 1, limit: 1000 });
      const rows = data.expenses || [];

      if (!rows.length) {
        setError("No expenses to export with current filters.");
        return;
      }

      const csvHeader = "Date,Category,Amount,Note";
      const csvRows = rows.map((item) => {
        const date = new Date(item.date).toISOString().slice(0, 10);
        const category = `"${(item.category || "").replace(/"/g, '""')}"`;
        const amount = Number(item.amount).toFixed(2);
        const note = `"${(item.note || "").replace(/"/g, '""')}"`;
        const purchaseType = item.purchaseType || "planned";
        return `${date},${category},${amount},${note},${purchaseType}`;
      });

      const csvContent = [`${csvHeader},Purchase Type`, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "expenses-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (apiError) {
      const message = apiError.response?.data?.message || "Failed to export CSV.";
      setError(message);
    }
  };

  return (
    <main className="container">
      <header className="page-header">
        <div>
          <h1>Expense Tracker</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <button type="button" className="secondary-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="summary-card">
        <div className="summary-grid">
          <div>
            <h3>Total Spending</h3>
            <p className="summary-value">Rs. {Number(dashboardStats.totalSpending).toFixed(2)}</p>
          </div>
          <div>
            <h3>Total Entries</h3>
            <p className="summary-value">{dashboardStats.totalExpenses}</p>
          </div>
          <div>
            <h3>Filtered Total</h3>
            <p className="summary-value">Rs. {filteredTotalSpending.toFixed(2)}</p>
          </div>
        </div>
        <div className="insight-strip">
          <span className="pill impulse">Impulse: {dashboardStats.impulseCount}</span>
          <span className="pill planned">Planned: {dashboardStats.plannedCount}</span>
          <p className="insight-text">
            You make {Math.round(dashboardStats.impulsePercentage)}% impulse purchases.
          </p>
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>Monthly Budget</h3>
          <form onSubmit={handleSaveBudget} className="form-grid">
            <label>
              Month
              <input
                type="number"
                name="month"
                min="1"
                max="12"
                value={budgetForm.month}
                onChange={handleBudgetChange}
                required
              />
            </label>
            <label>
              Year
              <input
                type="number"
                name="year"
                min="2000"
                value={budgetForm.year}
                onChange={handleBudgetChange}
                required
              />
            </label>
            <label>
              Budget Amount
              <input
                type="number"
                name="amount"
                min="0"
                step="0.01"
                value={budgetForm.amount}
                onChange={handleBudgetChange}
                required
              />
            </label>
            <button type="submit" disabled={budgetSubmitting}>
              {budgetSubmitting ? "Saving..." : "Save Budget"}
            </button>
          </form>
          {budgetError && <p className="error-text">{budgetError}</p>}
          <div className={budgetSummary.isOverBudget ? "budget-alert over" : "budget-alert ok"}>
            <p>
              Budget: <strong>Rs. {Number(budgetSummary.budgetAmount).toFixed(2)}</strong>
            </p>
            <p>
              Spent: <strong>Rs. {Number(budgetSummary.totalSpent).toFixed(2)}</strong>
            </p>
            <p>
              Remaining: <strong>Rs. {Number(budgetSummary.remaining).toFixed(2)}</strong>
            </p>
          </div>
        </div>

        <div className="card">
          <h3>Category Breakdown</h3>
          {dashboardStats.categoryBreakdown.length === 0 ? (
            <p className="status-inline">No category data yet.</p>
          ) : (
            <div className="category-list">
              {dashboardStats.categoryBreakdown.map((item) => {
                const percentage = highestCategoryTotal
                  ? (Number(item.total) / highestCategoryTotal) * 100
                  : 0;

                return (
                  <div key={item.category} className="category-item">
                    <div className="category-meta">
                      <span>{item.category}</span>
                      <span>Rs. {Number(item.total).toFixed(2)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Monthly Summary</h3>
          {monthlySummary.length === 0 ? (
            <p className="status-inline">No monthly data yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Expenses</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.map((item) => (
                    <tr key={`${item.year}-${item.month}`}>
                      <td>
                        {new Date(item.year, item.month - 1, 1).toLocaleString(undefined, {
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td>{item.totalExpenses}</td>
                      <td>Rs. {Number(item.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h3>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h3>
          <form onSubmit={handleSubmitExpense} className="form-grid">
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Category
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Date
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Note
              <input type="text" name="note" value={formData.note} onChange={handleFormChange} />
            </label>
            <div>
              <p className="field-label">Purchase Type</p>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.purchaseType === "impulse" ? "active impulse" : ""}`}
                  onClick={() => setFormData((prev) => ({ ...prev, purchaseType: "impulse" }))}
                >
                  Impulse
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.purchaseType === "planned" ? "active planned" : ""}`}
                  onClick={() => setFormData((prev) => ({ ...prev, purchaseType: "planned" }))}
                >
                  Planned
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingExpenseId ? "Update Expense" : "Add Expense"}
              </button>
              {editingExpenseId && (
                <button type="button" className="secondary-btn" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Filters</h3>
          <form onSubmit={handleApplyFilters} className="form-grid">
            <label>
              Search (category/note)
              <input type="text" name="q" value={filters.q} onChange={handleFilterChange} />
            </label>
            <label>
              Category
              <input
                type="text"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
              />
            </label>

            <label>
              Start Date
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </label>

            <label>
              End Date
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </label>

            <div className="form-actions">
              <button type="submit">Apply Filters</button>
              <button type="button" className="secondary-btn" onClick={handleClearFilters}>
                Clear
              </button>
              <button type="button" className="secondary-btn" onClick={handleExportCsv}>
                Export CSV
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card">
        <h3>All Expenses</h3>
        {error && <p className="error-text">{error}</p>}
        {loading ? (
          <p className="status">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="status">No expenses found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.category}</td>
                    <td>Rs. {Number(expense.amount).toFixed(2)}</td>
                    <td>
                      <span
                        className={`type-chip ${expense.purchaseType === "impulse" ? "impulse" : "planned"}`}
                      >
                        {expense.purchaseType === "impulse" ? "Impulse" : "Planned"}
                      </span>
                    </td>
                    <td>{expense.note || "-"}</td>
                    <td className="actions">
                      <button type="button" onClick={() => handleEdit(expense)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleDelete(expense._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}

export default ExpensesPage;
