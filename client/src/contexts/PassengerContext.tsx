import React, { createContext, ReactNode, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';
import { io, Socket } from 'socket.io-client';
import Toast from 'react-native-toast-message'; // optional toast popup

// Notification type from backend
export type Notification = {
  id: number;
  bus_id: number;
  bus_stop_id: number;
  user_id: number;
  timing: string;
  status: 'waiting' | 'traveling' | 'completed';
  message: string;
  bus_stop_name: string;
  passenger_name: string;
};

export type Passenger = Notification;

type PassengerContextType = {
  passengers: Passenger[];
  fetchPassengers: () => void;
  updateStatus: (id: number) => void;
};

export const PassengerContext = createContext<PassengerContextType>({
  passengers: [],
  fetchPassengers: () => {},
  updateStatus: () => {},
});

let socket: Socket | null = null;

export const PassengerProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useContext(AuthContext);
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  // 🔹 Fetch all passengers once (initial load)
  const fetchPassengers = async () => {
    if (!user?.bus_id) return;
    try {
      const res = await api.get<Passenger[]>(`/notify/conductor/${user.bus_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPassengers(res.data);
    } catch (err) {
      console.error('Fetch passengers error:', err);
      setPassengers([]);
    }
  };

  // 🔹 Update status from waiting -> traveling -> completed
  const updateStatus = async (id: number) => {
    try {
      const passenger = passengers.find((p) => p.id === id);
      if (!passenger) return;

      let nextStatus: Passenger['status'];
      if (passenger.status === 'waiting') nextStatus = 'traveling';
      else if (passenger.status === 'traveling') nextStatus = 'completed';
      else return;

      await api.put(
        `/notify/markseen`,
        { notification_id: id, bus_id: passenger.bus_id, status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update locally
      setPassengers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
      );
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  // 🔹 Setup socket connection for real-time updates
  useEffect(() => {
    if (!user?.bus_id) return;

    // Step 1: connect socket
    socket = io('http://10.24.183.189:8801'); // replace with your backend IP

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
      socket?.emit('joinBusRoom', { bus_id: user.bus_id }); // join the correct bus room
    });

    // Step 2: listen for new notification
    socket.on('receiveNotification', (data: Passenger) => {
      console.log('📩 New real-time passenger:', data);

      // Show optional toast popup
      Toast.show({
        type: 'info',
        text1: '🧍 New Passenger Booked',
        text2: `${data.passenger_name} at ${data.bus_stop_name}`,
        position: 'top',
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
      socket?.off('receiveNotification');
      socket?.disconnect();
    };
  }, [user]);

  // Fetch once when user logs in
  useEffect(() => {
    fetchPassengers();
  }, [user]);

  return (
    <PassengerContext.Provider value={{ passengers, fetchPassengers, updateStatus }}>
      {children}
    </PassengerContext.Provider>
  );
};
