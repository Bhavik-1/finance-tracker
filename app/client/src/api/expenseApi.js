import http from "./http";

export const createExpenseRequest = async (payload) => {
  const response = await http.post("/expenses", payload);
  return response.data;
};

export const getExpensesRequest = async (filters = {}) => {
  const params = {};

  if (filters.category) params.category = filters.category;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.q) params.q = filters.q;
  if (filters.page) params.page = filters.page;
  if (filters.limit) params.limit = filters.limit;

  const response = await http.get("/expenses", { params });
  return response.data;
};

export const updateExpenseRequest = async (id, payload) => {
  const response = await http.put(`/expenses/${id}`, payload);
  return response.data;
};

export const deleteExpenseRequest = async (id) => {
  const response = await http.delete(`/expenses/${id}`);
  return response.data;
};

export const getDashboardStatsRequest = async () => {
  const response = await http.get("/expenses/dashboard");
  return response.data;
};

export const getMonthlySummaryRequest = async () => {
  const response = await http.get("/expenses/monthly-summary");
  return response.data;
};
