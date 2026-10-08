import { useEffect, useState } from "react";
import { api } from "./api";

import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));

  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("token")) {
      return () => {
        active = false;
      };
    }

    api("/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function authenticate(path, body) {
    const data = await api(path, { method: "POST", body });
    localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  const login = (email, password) => authenticate("/auth/login", { email, password });
  const register = (name, email, password) =>
    authenticate("/auth/register", { name, email, password });
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
