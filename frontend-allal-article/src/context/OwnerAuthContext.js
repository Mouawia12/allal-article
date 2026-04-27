import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "services/apiClient";

const OwnerAuthContext = createContext(null);

function parseJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

const STORAGE_KEY = "owner_token";
const USER_KEY    = "owner_user";

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(() => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post("/api/platform/auth/login", { email, password });
    const { token } = data.data;
    const claims = parseJwt(token);
    const user = {
      id: claims?.userId,
      email: data.data.email,
      name: data.data.name || "مالك المنصة",
      roleCode: data.data.roleCode,
    };
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setOwner(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setOwner(null);
  }, []);

  const isAuthenticated = !!owner && !!localStorage.getItem(STORAGE_KEY);

  return (
    <OwnerAuthContext.Provider value={{ owner, login, logout, isAuthenticated }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  const ctx = useContext(OwnerAuthContext);
  if (!ctx) throw new Error("useOwnerAuth must be used within OwnerAuthProvider");
  return ctx;
}

export default OwnerAuthContext;
