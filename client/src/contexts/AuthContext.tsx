import React, { createContext, useState, useEffect, ReactNode } from "react";
import { router } from "expo-router";
import { getFromStorage, saveToStorage, removeFromStorage } from "../utils/storage";

type User = {
  id: string; // Keep as string to match your existing code
  name: string;
  email: string;
  phone_number: string;
  dob: string;
  role: "passenger" | "conductor";
  bus_id: number | null; // Added for conductors
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await getFromStorage<string>("token");
        const storedUser = await getFromStorage<User>("user");

        if (token && storedUser) {
          setUser(storedUser);
          setToken(token);
        }
      } catch (err) {
        console.error("Error loading user from storage", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (userData: User, token: string) => {
    try {
      await saveToStorage("token", token);
      await saveToStorage("user", userData);
      setUser(userData);
      setToken(token);
      
    } catch (error) {
      console.error("Login error", error);
    }
  };

  const logout = async () => {
    try {
      await removeFromStorage("token");
      await removeFromStorage("user");
      setUser(null);
      setToken(null);
      router.replace("/Auth/LoginScreen");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};