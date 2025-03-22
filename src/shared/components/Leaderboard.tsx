import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { fetchGlobalLeaderboard, fetchRegionalLeaderboard } from "shared/api/actions";
import { useAuth } from "shared/hooks/useAuth";
import { Post } from "index";

export default function Leaderboard() {
    const { user, token } = useAuth();
    const [leaderboard, setLeaderboard] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useRegional, setUseRegional] = useState(false);

    useEffect(() => {
        loadLeaderboard();
    }, [useRegional]);

    async function loadLeaderboard() {
        if (!token) return setError("Must be logged in.");

        setLoading(true);
        setError(null);

        try {
            const data = useRegional && user?.locationID 
                ? await fetchRegionalLeaderboard(token, user.locationID)
                : await fetchGlobalLeaderboard(token);
            setLeaderboard(data);
        } catch (err) {
            setError("Failed to load leaderboard");
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.toggleContainer}>
                <TouchableOpacity 
                    style={[styles.toggleButton, !useRegional && styles.selected]}
                    onPress={() => setUseRegional(false)}
                >
                    <Text style={styles.toggleText}>Global</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.toggleButton, useRegional && styles.selected]}
                    onPress={() => setUseRegional(true)}
                >
                    <Text style={styles.toggleText}>Local</Text>
                </TouchableOpacity>
            </View>

            {loading && <Text>Loading...</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.entry}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text>{item.rewardOffers[0].kudos} Kudos</Text>
                        <Text style={styles.region}>Region: {item.location?.name}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
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
    errorText: {
        color: "red",
        textAlign: "center",
        marginBottom: 10,
    },
    entry: {
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
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    region: {
        color: "#555",
        fontSize: 12,
    },
});
