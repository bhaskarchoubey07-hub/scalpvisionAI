"use client";

import { createContext, useContext, useEffect, useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storageKey = "scalpvision-auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as { token: string; user: User };
      setToken(parsed.token);
      setUser(parsed.user);
    }
    setIsReady(true);
  }, []);

  function persist(nextToken: string, nextUser: User) {
    setToken(nextToken);
    setUser(nextUser);
    window.localStorage.setItem(storageKey, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Unable to log in");
    persist(payload.token, payload.user);
  }

  async function signup(fullName: string, email: string, password: string) {
    const response = await fetch(`${apiBaseUrl}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "Unable to sign up");
    persist(payload.token, payload.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.localStorage.removeItem(storageKey);
  }

  return <AuthContext.Provider value={{ user, token, isReady, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
