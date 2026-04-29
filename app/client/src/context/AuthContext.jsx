import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfileRequest, loginRequest, signupRequest } from "../api/authApi";
import { clearStoredToken, getStoredToken, setStoredToken } from "../api/http";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfileRequest();
        setUser(data.user);
      } catch (error) {
        clearStoredToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signup = async (payload) => {
    const data = await signupRequest(payload);
    setStoredToken(data.token);
    setUser(data.user);
    return data;
  };

  const login = async (payload) => {
    const data = await loginRequest(payload);
    setStoredToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      signup,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

