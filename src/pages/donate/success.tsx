import React from "react";
import { View, Text, StyleSheet } from "react-native";

// TODO: Show sidebar

export default function SuccessPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thank You!</Text>
      <Text>Your donation was successful.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
