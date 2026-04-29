import http from "./http";

export const signupRequest = async (payload) => {
  const response = await http.post("/auth/signup", payload);
  return response.data;
};

export const loginRequest = async (payload) => {
  const response = await http.post("/auth/login", payload);
  return response.data;
};

export const getProfileRequest = async () => {
  const response = await http.get("/auth/me");
  return response.data;
};

