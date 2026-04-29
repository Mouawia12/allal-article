import { createContext, useContext, useState, useCallback } from "react";
import { ownerClient } from "services/ownerApi";
import { decodeJwtPayload } from "utils/jwt";

const OwnerAuthContext = createContext(null);

const STORAGE_KEY = "owner_token";
const USER_KEY    = "owner_user";

function getInitialOwner() {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    const stored = localStorage.getItem(USER_KEY);
    if (!token || !stored) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function OwnerAuthProvider({ children }) {
  const [owner, setOwner] = useState(getInitialOwner);

  const login = useCallback(async (email, password) => {
    // Use ownerClient directly — 401 interceptor skips redirect for login URL
    const res = await ownerClient.post("/api/platform/auth/login", { email, password });
    const payload = res.data; // auto-unwrapped by ownerClient interceptor
    if (!payload?.token) throw new Error("Invalid response from server");
    const { token } = payload;
    const claims = decodeJwtPayload(token);
    const user = {
      id: claims?.userId ?? payload.userId,
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
