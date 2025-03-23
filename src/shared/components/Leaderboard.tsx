import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { fetchLeaderboard } from "shared/api/actions";
import { useAuth } from "shared/hooks/useAuth";

type LeaderboardUser = {
  id: number;
  username: string;
  totalKudos: number;
  location?: { name: string };
};

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "Last 24 Hours", value: "24h" },
  { label: "Last 7 Days", value: "week" },
  { label: "Last 30 Days", value: "month" },
  { label: "Last Year", value: "year" },
];

export default function Leaderboard() {
  const { user, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");

  useEffect(() => {
    loadLeaderboard();
  }, [useLocal, timeFilter]);

  async function loadLeaderboard() {
    if (!token) {
      setError("Must be logged in.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchLeaderboard(token, useLocal, timeFilter);
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Toggle for Global vs Local */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !useLocal && styles.selected]}
          onPress={() => setUseLocal(false)}
        >
          <Text style={styles.toggleText}>Global</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, useLocal && styles.selected]}
          onPress={() => setUseLocal(true)}
        >
          <Text style={styles.toggleText}>Local</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown (Picker) for Time Filters */}
      <Picker
        selectedValue={timeFilter}
        onValueChange={(value) => setTimeFilter(value)}
        style={styles.picker}
      >
        {TIME_FILTERS.map((f) => (
          <Picker.Item key={f.value} label={f.label} value={f.value} />
        ))}
      </Picker>

      {loading && <Text>Loading...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.entry}>
            <Text style={styles.rank}>{index + 1}.</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.kudos}>{item.totalKudos} Kudos</Text>
            {item.location && <Text style={styles.region}>Region: {item.location.name}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  toggleContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
  },
  selected: {
    backgroundColor: "#3182CE",
  },
  toggleText: {
    color: "white",
    fontWeight: "bold",
  },
  picker: {
    backgroundColor: "#FFF",
    marginVertical: 10,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rank: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  kudos: {
    fontSize: 16,
    color: "#2D3748",
  },
  region: {
    fontSize: 12,
    color: "#555",
    marginLeft: 10,
  },
});
