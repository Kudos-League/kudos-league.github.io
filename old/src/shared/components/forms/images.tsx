import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Icon } from "react-native-paper";

type ImagePickerProps = {
  onChange: (files: File[]) => void;
  placeholder?: string;
  selectedFiles?: File[];
  multiple?: boolean;
  style?: React.CSSProperties;
};

export default function ImagePicker({
  onChange,
  placeholder = "Choose Images",
  selectedFiles: selectedImages = [],
  multiple = true,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!multiple && files.length > 1) {
      onChange([files[0]]);
    } else {
      onChange(files);
    }
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <View style={styles.imagePicker}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <TouchableOpacity onPress={openImagePicker}>
        <Icon source={require("../../assets/icons/addImage.png")} size={72} />
      </TouchableOpacity>
      {selectedImages.length > 0 && (
        <Text>
          Selected Images: {selectedImages.map((image) => image.name).join(", ")}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imagePicker: {
    margin: 16,
  },
});
