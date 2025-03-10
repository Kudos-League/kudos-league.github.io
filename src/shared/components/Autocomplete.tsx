import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  LayoutChangeEvent
} from "react-native";
import { Portal } from "react-native-portalize";
import { getEndpointUrl } from "shared/api/config";

interface AutocompleteProps {
  endpoint: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: any) => void;
  onSubmitEditing?: () => void;
  inputStyle?: object;
}

const Autocomplete: React.FC<AutocompleteProps> = ({
  endpoint,
  value,
  onChangeText,
  onSelect,
  onSubmitEditing,
  inputStyle
}) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputLayout, setInputLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!isTyping || value.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${getEndpointUrl()}${endpoint}?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error fetching autocomplete results:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, isTyping]);

  const handleSelect = (item: any) => {
    onChangeText(item.name || item.label || item.value);
    setShowDropdown(false);
    setIsTyping(false);
    onSelect(item);
  };

  const handleChangeText = (text: string) => {
    setIsTyping(true);
    onChangeText(text);
  };

  const measureInput = (event: LayoutChangeEvent) => {
    if (inputRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        setInputLayout({ x: pageX, y: pageY, width, height });
      });
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText} 
        style={[styles.input, inputStyle]}
        placeholder="Enter tag and press Add"
        returnKeyType="done"
        onSubmitEditing={onSubmitEditing}
        onLayout={measureInput}
      />
      {loading && <ActivityIndicator style={styles.loader} size="small" color="#3B82F6" />}

      <Portal>
        {showDropdown && results.length > 0 && inputLayout && (
          <View
            style={[
              styles.dropdown,
              {
                position: "absolute",
                top: inputLayout.y + inputLayout.height,
                left: inputLayout.x,
                width: inputLayout.width,
              },
            ]}
          >
            <FlatList
              data={results}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                  <Text style={styles.itemText}>{item.name || item.label || item.value}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: "white",
  },
  loader: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  dropdown: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    maxHeight: 200,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 9999,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default Autocomplete;
