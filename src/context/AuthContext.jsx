import React, { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("lms-current-user");

    if (!savedUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      setUser(null);
      localStorage.removeItem("lms-current-user");
    }
  }, []);

  const login = (userData) => {
    if (!userData) return;

    const safeUser = {
      name: userData.name || "",
      email: userData.email || "",
      role: userData.role || "",
    };

    localStorage.setItem("lms-current-user", JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    localStorage.removeItem("lms-current-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}


