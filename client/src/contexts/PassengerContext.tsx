import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message";

import api from "../services/api";
import { AuthContext } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { getSocketUrl } from "../services/serverConfig";

export type PassengerStatus = "waiting" | "traveling" | "completed";

/** A passenger the conductor is responsible for on this bus. */
export type Passenger = {
  id: number;
  bus_id: number;
  bus_stop_id: number | null;
  user_id: number;
  timing: string | null;
  status: PassengerStatus;
  message: string;
  bus_stop_name: string | null;
  passenger_name: string;
  payment: { amount: number; method: "cash" | "gpay"; status: "paid" | "unpaid" };
};

type PassengerContextType = {
  passengers: Passenger[];
  loading: boolean;
  failed: boolean;
  /** The id currently being advanced, so the row can show progress. */
  updatingId: number | null;
  fetchPassengers: () => Promise<void>;
  updateStatus: (id: number) => Promise<void>;
};

export const PassengerContext = createContext<PassengerContextType>({
  passengers: [],
  loading: true,
  failed: false,
  updatingId: null,
  fetchPassengers: async () => {},
  updateStatus: async () => {},
});

export const PassengerProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const busId = user?.bus_id ?? null;
  const socketRef = useRef<Socket | null>(null);

  const fetchPassengers = useCallback(async () => {
    if (!busId) {
      setPassengers([]);
      setLoading(false);
      return;
    }

    try {
      // Authorization is attached by the axios interceptor; it used to be
      // passed by hand here and forgotten in other calls to the same API.
      const { data } = await api.get<Passenger[]>(`/notify/conductor/${busId}`);
      setPassengers(Array.isArray(data) ? data : []);
      setFailed(false);
    } catch (err) {
      console.error("Fetch passengers error:", err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [busId]);

  /**
   * Advance one passenger: waiting → traveling → completed.
   *
   * The local row is only updated after the request succeeds. The previous
   * version moved the row optimistically and never rolled back, so a failed
   * request left the conductor's screen claiming a journey had started when
   * the passenger had been told nothing.
   */
  const updateStatus = useCallback(
    async (id: number) => {
      const passenger = passengers.find((item) => item.id === id);
      if (!passenger || updatingId !== null) return;

      setUpdatingId(id);
      try {
        if (passenger.status === "waiting") {
          await api.post("/notify/startTravel", {
            bus_id: passenger.bus_id,
            user_id: passenger.user_id,
          });
          await api.put("/notify/markseen", {
            notification_id: id,
            bus_id: passenger.bus_id,
          });

          setPassengers((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "traveling" } : item))
          );
          Toast.show({
            type: "info",
            text1: t("travelStartedToast", { name: passenger.passenger_name }),
          });
        } else if (passenger.status === "traveling") {
          await api.post("/notify/completeTravel", {
            bus_id: passenger.bus_id,
            user_id: passenger.user_id,
          });

          setPassengers((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: "completed" } : item))
          );
          Toast.show({
            type: "success",
            text1: t("travelCompletedToast", { name: passenger.passenger_name }),
          });
        }
      } catch (err) {
        console.error("Update status error:", err);
        Toast.show({ type: "error", text1: t("updateStatusFailed") });
      } finally {
        setUpdatingId(null);
      }
    },
    [passengers, updatingId, t]
  );

  // Live updates for this bus.
  useEffect(() => {
    if (!busId) return;

    // Resolved here rather than at module load, so a server changed in
    // Settings takes effect without restarting the app.
    const socket = io(getSocketUrl(), { transports: ["websocket"] });
    socketRef.current = socket;

    const joinRoom = () => socket.emit("joinBusRoom", { bus_id: busId });

    // Re-join on every connect, not just the first: after a dropped
    // connection the server has forgotten the room membership, and without
    // this the conductor silently stops receiving new passengers.
    socket.on("connect", joinRoom);

    socket.on("receiveNotification", (incoming: Passenger) => {
      setPassengers((prev) =>
        prev.some((item) => item.id === incoming.id) ? prev : [incoming, ...prev]
      );

      Toast.show({
        type: "info",
        text1: t("newPassengerToast", {
          name: incoming.passenger_name,
          stop: incoming.bus_stop_name ?? "",
        }),
      });
    });

    return () => {
      socket.off("connect", joinRoom);
      socket.off("receiveNotification");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [busId, t]);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  const value = useMemo<PassengerContextType>(
    () => ({ passengers, loading, failed, updatingId, fetchPassengers, updateStatus }),
    [passengers, loading, failed, updatingId, fetchPassengers, updateStatus]
  );

  return <PassengerContext.Provider value={value}>{children}</PassengerContext.Provider>;
};
