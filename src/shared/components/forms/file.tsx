import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";

type FilePickerProps = {
  onChange: (files: File[]) => void;
  placeholder?: string;
  selectedFiles?: File[];
};

export default function FilePicker({
  onChange,
  placeholder = "Choose Files",
  selectedFiles = [],
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onChange(files);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <View style={styles.filePicker}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button onClick={openFilePicker}>{placeholder}</button>
      {selectedFiles.length > 0 && (
        <Text>
          Selected Files: {selectedFiles.map((file) => file.name).join(", ")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filePicker: {
    margin: 16,
  },
});
