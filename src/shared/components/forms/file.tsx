/* eslint-disable @typescript-eslint/no-require-imports */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

type FilePickerProps = {
  onChange: (files: File[]) => void;
  placeholder?: string;
  selectedFiles?: File[];
  multiple?: boolean;
  style?: React.CSSProperties;
  type?: 'text' | 'password' | 'file' | 'dropdown' | 'file-image';
};

export default function FilePicker({
  onChange,
  placeholder = 'Choose Files',
  selectedFiles = [],
  multiple = true,
  type = 'text',
}: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!multiple && files.length > 1) {
      onChange([files[0]]);
    } else {
      onChange(files);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (type === 'file') {
    return (
      <View style={styles.filePicker}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button onClick={openFilePicker}>{placeholder ? require(placeholder) : 'Choose Files'}</button>
        {selectedFiles.length > 0 && (
          <Text>
            Selected Files: {selectedFiles.map((file) => file.name).join(', ')}
          </Text>
        )}
      </View>
    );
  }

  if (type === 'file-image') {
    return (
      <View style={styles.filePicker}>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <TouchableOpacity onPress={openFilePicker}>
          <Image
            source={require('../../assets/icons/addImage.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={styles.imageContainer}>
          {selectedFiles.length > 0 ? (
            selectedFiles.map((file, index) => (
              <Text key={index} style={styles.fileName}>{file.name}</Text>
            ))
          ) : ''
          }
        </View>
      </View>
    );
  }

  return null; // Return null for other types that aren't implemented yet
}

const styles = StyleSheet.create({
  filePicker: {
    margin: 16,
  },
  imageContainer: {
    marginTop: 10,
  },
  image: {
    width: 100,
    height: 100,
  },
  fileName: {
    marginTop: 5,
  }
});
