"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const API_URL = "http://localhost:8000";

type User = {
  id: string;
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [token, setToken] =
    useState<string | null>(null);

  async function fetchUser(
    token: string
  ) {
    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    setUser(data);
  }

  useEffect(() => {
    const saved =
      localStorage.getItem("token");

    if (saved) {
      setToken(saved);
      fetchUser(saved);
    }
  }, []);

  async function login(token: string) {
    localStorage.setItem(
      "token",
      token
    );

    setToken(token);

    await fetchUser(token);
  }

  function logout() {
    localStorage.removeItem("token");

    setToken(null);

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "AuthProvider missing"
    );
  }

  return context;
}