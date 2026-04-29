import { createContext, useContext, useState, useCallback } from "react";
import { ownerClient } from "services/ownerApi";

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
    // Use ownerClient directly — 401 interceptor skips redirect for login URL
    const res = await ownerClient.post("/api/platform/auth/login", { email, password });
    const payload = res.data; // auto-unwrapped by ownerClient interceptor
    if (!payload?.token) throw new Error("Invalid response from server");
    const { token } = payload;
    const claims = parseJwt(token);
    const user = {
      id: claims?.userId,
      email: payload.email,
      name: payload.name || payload.email,
      roleCode: payload.roleCode,
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
    window.location.href = "/owner/login";
  }, []);

  // Trust React state — token presence in localStorage is enforced by ownerClient's 401 handler
  const isAuthenticated = !!owner;

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
