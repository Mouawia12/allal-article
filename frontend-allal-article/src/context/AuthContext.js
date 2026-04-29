import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "services/apiClient";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password, tenantId) => {
    const headers = tenantId ? { "X-Tenant-ID": tenantId } : {};
    const endpoint = tenantId ? "/api/auth/login" : "/api/platform/auth/login";
    // apiClient unwraps ApiResponse envelope → data is payload directly
    const { data: payload } = await apiClient.post(endpoint, { email, password }, { headers });

    const { token } = payload;
    const claims = parseJwt(token);
    const userData = {
      id: claims?.userId,
      email: payload.email,
      name: payload.name,
      roleCode: payload.roleCode,
      schema: payload.schema,
      type: payload.type,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    if (tenantId) localStorage.setItem("tenantId", tenantId);

    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tenantId");
    setUser(null);
    window.location.href = "/authentication/sign-in";
  }, []);

  // Trust React state — token presence is enforced by apiClient's 401 handler
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
