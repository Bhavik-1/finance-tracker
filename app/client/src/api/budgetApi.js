import http from "./http";

export const getBudgetSummaryRequest = async ({ month, year }) => {
  const response = await http.get("/budget/summary", {
    params: { month, year },
  });
  return response.data;
};

export const upsertBudgetRequest = async (payload) => {
  const response = await http.post("/budget", payload);
  return response.data;
};

