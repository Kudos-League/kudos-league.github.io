import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "shared/hooks/useAuth";
import { createEvent } from "shared/api/actions";
import { CreateEventDTO, LocationDTO } from "shared/api/types";
import UniversalDatePicker from "shared/components/DatePicker"; 
import MapDisplay from "shared/components/Map";

export default function CreateEvent() {
  const navigation = useNavigation();
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [global, setGlobal] = useState(false);
  const [location, setLocation] = useState<LocationDTO | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [loading, setLoading] = useState(false);

  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  const onSubmit = async () => {
    setErrorMessages([]);

    if (!token) {
      setErrorMessages(["You must be logged in to create an event."]);
      return;
    }

    if (!title.trim() || !description.trim()) {
      setErrorMessages(["Title and description are required."]);
      return;
    }

    setLoading(true);

    const payload: CreateEventDTO = {
      title,
      description,
      location: { 
        ...location,
        regionID: location?.regionID ?? null,
        global
      },
      startTime: startDate,
      endTime: endDate
    };

    try {
      await createEvent(payload, token);
      setLoading(false);

      navigation.navigate("Home");
    } catch (error: any) {
      setLoading(false);

      if (error.response?.data?.message?.errors) {
        const zodErrors = error.response.data.message.errors;
        const msgs = zodErrors.map((err: any) => `${err.field}: ${err.message}`);
        setErrorMessages(msgs);
        return;
      }

      setErrorMessages(["Failed to create event. Please try again."]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Create Event</Text>

      {/* Title / Description */}
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter event title"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter event description"
        multiline
      />

      {/* Global Switch */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Is Global?</Text>
        <Switch value={global} onValueChange={setGlobal} />
      </View>

      {/* If not global, pick a location */}
      {!global && (
        <View style={{ height: 300 }}>
          <Text style={styles.label}>Pick a Location</Text>
          <MapDisplay
            showAddressBar
            onLocationChange={(data) => {
              setLocation({ regionID: data.placeID, name: data.name });
            }}
            width="100%"
            height="100%"
          />
        </View>
      )}

      {/* Start/End Date */}
      <UniversalDatePicker date={startDate} onChange={setStartDate} label="Start Time" />
      <UniversalDatePicker date={endDate} onChange={setEndDate} label="End Time" />

      {/* The Submit Button */}
      <TouchableOpacity
        onPress={onSubmit}
        style={[styles.button, loading && { opacity: 0.7 }]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Event"}</Text>
      </TouchableOpacity>

      {/* Display error messages below the button */}
      {errorMessages.length > 0 && (
        <View style={styles.errorContainer}>
          {errorMessages.map((msg, idx) => (
            <Text key={idx} style={styles.errorText}>
              {msg}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center"
  },
  label: {
    marginTop: 12,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginTop: 4,
    borderRadius: 4
  },
  textArea: {
    height: 80,
    textAlignVertical: "top"
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12
  },
  button: {
    marginTop: 24,
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 6,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700"
  },
  errorContainer: {
    marginTop: 12,
    backgroundColor: "#f8d7da",
    padding: 8,
    borderRadius: 4
  },
  errorText: {
    color: "#721c24"
  }
});
