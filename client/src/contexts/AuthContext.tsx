import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFromStorage, saveToStorage, removeFromStorage } from "../utils/storage";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import api, { isAuthError, setAuthToken, setUnauthorizedHandler } from "../services/api";

export type Role = "passenger" | "conductor";

export type User = {
  id: number;
  name: string;
  email: string;
  phone_number: string | null;
  dob: string | null;
  role: Role;
  /** Set for conductors, null for passengers. */
  bus_id: number | null;
  from?: string | null;
  to?: string | null;
  trip_code?: string | null;
  class_of_service?: string | null;
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the profile from the server, e.g. after editing it. */
  refreshUser: () => Promise<void>;
  /** Replace the cached user with a copy the caller already has. */
  applyUser: (user: User) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: null,
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  applyUser: async () => {},
});

/**
 * Register this device for push notifications and hand the token to the API.
 *
 * Deliberately fire-and-forget: sign-in must not block on a permission prompt
 * or a network round trip, and a rider who declines notifications should still
 * reach the app. Failures are logged, never surfaced as an alert.
 */
const syncPushToken = async (userId: number) => {
  try {
    const expoPushToken = await registerForPushNotificationsAsync();
    if (!expoPushToken) return;

    await api.post("/notify/savePushToken", {
      user_id: userId,
      expo_push_token: expoPushToken,
    });
  } catch (error) {
    console.warn("Could not register for push notifications", error);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await getFromStorage<string>("token");
        const storedUser = await getFromStorage<User>("user");

        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setUser(storedUser);
          setToken(storedToken);
          verifySession();
        }
      } catch (err) {
        console.error("Error loading user from storage", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
    // Deliberately runs once on mount; verifySession is stable for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (userData: User, nextToken: string) => {
    setAuthToken(nextToken);
    await saveToStorage("token", nextToken);
    await saveToStorage("user", userData);

    setUser(userData);
    setToken(nextToken);

    syncPushToken(userData.id);
  }, []);

  const logout = useCallback(async () => {
    // Clear local state first so the router redirects immediately; a failure
    // to delete a key must never leave the user stuck in a signed-in shell.
    setAuthToken(null);
    setUser(null);
    setToken(null);

    try {
      await removeFromStorage("token");
      await removeFromStorage("user");
    } catch (error) {
      console.error("Logout error", error);
    }
  }, []);

  const applyUser = useCallback(async (nextUser: User) => {
    setUser(nextUser);
    await saveToStorage("user", nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      if (data?.user) await applyUser(data.user);
    } catch (error) {
      console.warn("Could not refresh profile", error);
    }
  }, [applyUser]);

  /**
   * Confirm a restored session is still real, and refresh the cached profile.
   *
   * Only a rejected session signs the user out — a network failure must not,
   * or the app would sign people out every time it opened out of coverage.
   * Without this, a session whose account no longer exists stays "signed in"
   * and only fails later, at the point of booking.
   */
  const verifySession = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      if (data?.user) await applyUser(data.user);
    } catch (error) {
      if (isAuthError(error)) await logout();
    }
  }, [applyUser, logout]);

  // Any 401 mid-session ends it, rather than leaving the app acting signed in.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthContextType>(
    () => ({ user, loading, token, login, logout, refreshUser, applyUser }),
    [user, loading, token, login, logout, refreshUser, applyUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
