import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

export const getStoredToken = () => localStorage.getItem("token");

export const setStoredToken = (token) => {
  localStorage.setItem("token", token);
};

export const clearStoredToken = () => {
  localStorage.removeItem("token");
};

http.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default http;
