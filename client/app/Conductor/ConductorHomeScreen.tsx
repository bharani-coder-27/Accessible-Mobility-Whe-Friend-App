import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../src/contexts/AuthContext';
import api from '../../src/services/api';

interface Notification {
  id: number;
  bus_id: number;
  bus_stop_id: number;
  user_id: number;
  timing: string;
  status: 'pending' | 'seen';
  message: string;
  created_at: string;
  bus_stop_name: string;
  passenger_name: string;
}

export default function ConductorHomeScreen() {
  const { logout, user, token } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications for conductor's bus_id
  const fetchNotifications = async () => {
    if (!user?.id || !user?.bus_id) {
      setError('User not authenticated or no bus assigned.');
      Alert.alert('Error', 'User not authenticated or no bus assigned.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching notifications for bus_id: ${user.bus_id}`);
      const res = await api.get<Notification[]>(`/notify/conductor/${user.bus_id}`);
      console.log('Notifications response:', res.data);
      setNotifications(res.data);
    } catch (err: any) {
      console.error('Fetch notifications error:', err);
      if (err.response?.status === 401) {
        Alert.alert('Error', 'Session expired. Please log in again.', [
          { text: 'OK', onPress: logout },
        ]);
      } else if (err.response?.status === 403) {
        Alert.alert('Error', 'Access denied: You must be a conductor with an assigned bus.');
        setError('Access denied: You must be a conductor with an assigned bus.');
      } else {
        // Treat 404 or other errors as "no notifications"
        console.log('No notifications found, setting empty array');
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as seen
  const markAsSeen = async (notificationId: number) => {
    try {
      console.log(`Marking notification ${notificationId} as seen`);
      const res = await api.put(`/notify/markseen`, {
            notification_id: notificationId,
            bus_id: notifications.find(n => n.id === notificationId)?.bus_id
        });
        /* {
          seen: true
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // 🔑 attach token here
            "Content-Type": "application/json",
          }
        } */
      console.log(`Notification ${notificationId} marked as seen`, res.data);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, ...res.data.notification } : notif
        )
      );
      Alert.alert('Success', 'Notification marked as seen');
      fetchNotifications();
    } catch (err: any) {
      console.error('Mark as seen error:', err);
      if (err.response?.status === 404) {
        Alert.alert('Error', 'Notification not found or you are not authorized.');
      } else {
        Alert.alert('Error', 'Could not mark notification as seen. Please try again.');
      }
    }
  };

  // Poll for notifications every 2 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Welcome, {user && user.name ? user.name : 'Conductor'}!
      </Text>
      <Text style={styles.subtitle}>
        Bus ID: {user && user.bus_id ? user.bus_id : 'Not Assigned'}
      </Text>

      <TouchableOpacity style={styles.refreshButton} onPress={fetchNotifications}>
        <Text style={styles.buttonText}>Refresh Notifications</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : loading ? (
        <Text style={styles.loadingText}>Loading notifications...</Text>
      ) : notifications.length === 0 ? (
        <Text style={styles.noNotifications}>No passengers are waiting for this bus</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <Text style={styles.notificationText}>{item.message}</Text>
              <Text style={styles.notificationDetails}>
                Passenger: {item.passenger_name}
              </Text>
              <Text style={styles.notificationDetails}>
                Stop: {item.bus_stop_name} | Time: {item.timing}
              </Text>
              <Text style={styles.notificationStatus}>Status: {item.status}</Text>
              {item.status === 'pending' && (
                <TouchableOpacity
                  style={styles.seenButton}
                  onPress={() => markAsSeen(item.id)}
                >
                  <Text style={styles.buttonText}>Mark as Seen</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          style={styles.notificationList}
        />
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  welcome: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 15,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    color: '#34495e',
  },
  refreshButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#e74c3c',
  },
  noNotifications: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#7f8c8d',
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 5,
  },
  notificationDetails: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
  },
  notificationStatus: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  seenButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});