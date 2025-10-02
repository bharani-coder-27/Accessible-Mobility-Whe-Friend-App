// app/conductor/PassengerList.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { PassengerContext } from '../../src/contexts/PassengerContext';

export default function PassengerList({ status }: { status: 'waiting' | 'traveling' | 'completed' }) {
  const { passengers, updateStatus } = useContext(PassengerContext);
  const filtered = passengers.filter((p) => p.status === status);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>Passengers: {filtered.length}</Text>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.statusTitle}>
          {status.charAt(0).toUpperCase() + status.slice(1)} Passengers
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View>
              <Text style={styles.name}>{item.passenger_name}</Text>
              <Text style={styles.details}>
                Stop: {item.bus_stop_name} | Time: {item.timing}
              </Text>
            </View>

            {status === 'waiting' && (
              <TouchableOpacity style={styles.button} onPress={() => updateStatus(item.id)}>
                <Text style={styles.buttonText}>Start Travel</Text>
              </TouchableOpacity>
            )}

            {status === 'traveling' && (
              <TouchableOpacity style={styles.button} onPress={() => updateStatus(item.id)}>
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text>No passengers</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8ff', paddingTop: 30 },
  headerSection: { alignItems: 'flex-end', padding: 10 },
  countContainer: {
    width: 130,
    height: 45,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
  },
  countText: { fontSize: 16, fontWeight: '400', letterSpacing: 0.5 },
  titleSection: { alignItems: 'center', padding: 10 },
  statusTitle: { fontSize: 22, fontWeight: '600' },
  item: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: { fontSize: 16, fontWeight: '500' },
  details: { fontSize: 14, color: '#555' },
  button: {
    backgroundColor: '#624be4ff',
    padding: 8,
    borderRadius: 6,
    alignContent: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff' },
  empty: { marginTop: 50, alignItems: 'center' },
});
