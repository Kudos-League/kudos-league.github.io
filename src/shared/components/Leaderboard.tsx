import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Switch } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { fetchLeaderboard } from "shared/api/actions";
import { useAuth } from "shared/hooks/useAuth";
import AvatarComponent from "./Avatar";

type LeaderboardUser = {
  id: number;
  username: string;
  totalKudos: number;
  location?: { name: string };
  avatar?: string;
};

const TIME_FILTERS = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" }
];

export default function Leaderboard() {
  const { user, token } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocal, setUseLocal] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

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

  const getTimeFilterLabel = () => {
    const filter = TIME_FILTERS.find(f => f.value === timeFilter);
    return filter ? filter.label : "All Time";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>High Score Board</Text>
      
      <View style={styles.filtersContainer}>
        <View style={styles.filterSection}>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowTimeDropdown(!showTimeDropdown)}
          >
            <Text style={styles.dropdownText}>{getTimeFilterLabel()}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
          
          {showTimeDropdown && (
            <View style={styles.dropdownMenu}>
              {TIME_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.dropdownItem,
                    timeFilter === filter.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setTimeFilter(filter.value);
                    setShowTimeDropdown(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.dropdownItemText,
                      timeFilter === filter.value && styles.dropdownItemTextSelected
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{user?.location?.name || "Local"}</Text>
          <Switch 
            value={!useLocal} 
            onValueChange={(val) => setUseLocal(!val)}
            trackColor={{ false: "#E2E8F0", true: "#E2E8F0" }}
            thumbColor={!useLocal ? "#6366F1" : "#9CA3AF"}
            ios_backgroundColor="#E2E8F0"
          />
          <Text style={styles.filterLabel}>Global</Text>
        </View>
      </View>
      
      <View style={styles.leaderboardContent}>
        {loading && <Text style={styles.statusText}>Loading...</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.entry}>
              <AvatarComponent avatar={item.avatar} style={styles.avatar} username={item.username} />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.location}>{item.location?.name || "Unknown"}</Text>
              </View>
              <Text style={styles.kudos}>{item.totalKudos.toLocaleString()} Kudos</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFFFFF",
    paddingTop: 30
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20
  },
  filtersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
    zIndex: 20
  },
  leaderboardContent: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 10
  },
  filterSection: {
    position: "relative",
    zIndex: 10,
  },
  dropdownButton: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 120,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 12,
    color: "#6B7280",
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    backgroundColor: "white",
    minWidth: 150,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#374151",
    textAlign: "center",
  },
  dropdownItemTextSelected: {
    fontWeight: "600",
    color: "#4F46E5",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginHorizontal: 8,
  },
  listContent: {
    paddingBottom: 20
  },
  statusText: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F7F8FA",
    borderRadius: 16,
    marginBottom: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    marginRight: 8
  },
  userInfo: {
    flex: 1,
    marginLeft: 16
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827"
  },
  location: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 2
  },
  kudos: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "right"
  }
});
