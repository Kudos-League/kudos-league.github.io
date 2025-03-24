import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DatePicker from "react-native-date-picker";

type UniversalDatePickerProps = {
  date: Date;
  onChange: (newDate: Date) => void;
  label?: string;
};

export default function UniversalDatePicker({
  date,
  onChange,
  label = "Select Date",
}: UniversalDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.buttonText}>
          {date.toLocaleString()}
        </Text>
      </TouchableOpacity>

      <DatePicker
        modal
        mode="datetime"
        open={open}
        date={date}
        onConfirm={(selectedDate) => {
          setOpen(false);
          onChange(selectedDate);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  dateButton: {
    backgroundColor: "#f2f2f2",
    padding: 10,
    borderRadius: 4,
  },
  buttonText: {
    color: "#333",
  },
});
