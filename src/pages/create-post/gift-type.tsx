import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ensure you have this installed

const GiftType = ({ selected, onSelect }) => {
  const options = ['Gift', 'RAK', 'Donation'];

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segment,
            selected === option && styles.selectedSegment,
            index === 0 && styles.firstSegment,
            index === options.length - 1 && styles.lastSegment
          ]}
          onPress={() => onSelect(option)} // Call the parent function
        >
          {selected === option && (
            <MaterialCommunityIcons name="check" size={16} color="#444" style={styles.checkIcon} />
          )}
          <Text style={[styles.text, selected === option && styles.selectedText]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 50,
    overflow: 'hidden'
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  selectedSegment: {
    backgroundColor: '#EAE2F8', // Light purple
  },
  firstSegment: {
    borderTopLeftRadius: 50,
    borderBottomLeftRadius: 50,
  },
  lastSegment: {
    borderTopRightRadius: 50,
    borderBottomRightRadius: 50,
  },
  text: {
    color: '#444',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedText: {
    color: '#222',
  },
  checkIcon: {
    position: 'absolute',
    left: 8,
  },
};

export default GiftType;
