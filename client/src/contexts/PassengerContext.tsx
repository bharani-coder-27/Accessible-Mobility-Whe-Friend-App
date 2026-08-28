import React, {
  createContext,
  ReactNode,
  useState,
  useEffect,
  useContext,
} from "react";
import api from "../services/api";
import { AuthContext } from "./AuthContext";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message"; // optional toast popup
import { socketUrl } from "../config";

// Notification type from backend
export type Notification = {
  id: number;
  bus_id: number;
  bus_stop_id: number;
  user_id: number;
  timing: string;
  status: "waiting" | "traveling" | "completed";
  message: string;
  bus_stop_name: string;
  passenger_name: string;
};

export type Passenger = Notification;

type PassengerContextType = {
  passengers: Passenger[];
  fetchPassengers: () => Promise<void>;
  updateStatus: (id: number) => Promise<void>;
};

export const PassengerContext = createContext<PassengerContextType>({
  passengers: [],
  fetchPassengers: async () => {},
  updateStatus: async () => {},
});

let socket: Socket | null = null;

export const PassengerProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useContext(AuthContext);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  // 🔹 Fetch all passengers once (initial load)
  const fetchPassengers = async () => {
    if (!user?.bus_id) return;
    try {
      const res = await api.get<Passenger[]>(
        `/notify/conductor/${user.bus_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPassengers(res.data);
    } catch (err) {
      console.error("Fetch passengers error:", err);
      setPassengers([]);
    }
  };

  // 🔹 Update status from waiting -> traveling -> completed
  // inside PassengerProvider in PassengerContext.tsx

  const updateStatus = async (id: number) => {
    try {
      const passenger = passengers.find((p) => p.id === id);
      if (!passenger) return;

      // Determine the next action based on current status
      if (passenger.status === "waiting") {
        // ✅ Start travel → send push notification for confirmation
        await api.post(
          `/notify/startTravel`,
          {
            bus_id: passenger.bus_id,
            user_id: passenger.user_id,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await api.put(
          `/notify/markseen`,
          { notification_id: id, bus_id: passenger.bus_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Toast.show({
          type: "info",
          text1: "🚌 Travel Started",
          text2: `Confirmation request sent to ${passenger.passenger_name}`,
          position: "top",
        });

        // Locally update status to traveling
        setPassengers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "traveling" } : p))
        );
      } else if (passenger.status === "traveling") {
        // ✅ Complete travel → send completion notification
        await api.post(
          `/notify/completeTravel`,
          {
            bus_id: passenger.bus_id,
            user_id: passenger.user_id,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        Toast.show({
          type: "success",
          text1: "✅ Travel Completed",
          text2: `${passenger.passenger_name} notified successfully`,
          position: "top",
        });

        // Locally update status to completed
        setPassengers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "completed" } : p))
        );
      }
    } catch (err) {
      console.error("Update status error:", err);
      Toast.show({
        type: "error",
        text1: "Error updating travel status",
        text2: "Please try again.",
        position: "top",
      });
    }
  };

  // 🔹 Setup socket connection for real-time updates
  useEffect(() => {
    if (!user?.bus_id) return;

    // Step 1: connect socket
    socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
      socket?.emit("joinBusRoom", { bus_id: user.bus_id }); // join the correct bus room
    });

    // Step 2: listen for new notification
    socket.on("receiveNotification", (data: Passenger) => {
      console.log("📩 New real-time passenger:", data);

      // Show optional toast popup
      Toast.show({
        type: "info",
        text1: "🧍 New Passenger Booked",
        text2: `${data.passenger_name} at ${data.bus_stop_name}`,
        position: "top",
        topOffset: 80,
        visibilityTime: 4000,
      });

      // Step 3: update list without refetching
      setPassengers((prev) => {
        const alreadyExists = prev.some((p) => p.id === data.id);
        if (alreadyExists) return prev;
        return [...prev, data];
      });
    });

    // Step 4: cleanup
    return () => {
      socket?.off("receiveNotification");
      socket?.disconnect();
    };
  }, [user]);

  // Fetch once when user logs in
  useEffect(() => {
    fetchPassengers();
  }, [user]);

  return (
    <PassengerContext.Provider
      value={{ passengers, fetchPassengers, updateStatus }}
    >
      {children}
    </PassengerContext.Provider>
  );
};
