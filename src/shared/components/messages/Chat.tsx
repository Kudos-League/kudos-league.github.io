import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet } from 'react-native';
import { TextInput, Tooltip } from 'react-native-paper';
import { useAppSelector } from 'redux_store/hooks';
import { useAuth } from 'shared/hooks/useAuth';

const fakeUsers = [
  { id: 1, name: 'Alice', avatar: 'https://media.discordapp.net/attachments/1318039115207278612/1347761565054664734/79337643af4ad3d7ed3ea88918aab465.png?ex=67ce51c5&is=67cd0045&hm=5bf9565b253475f6f864d319d0a49d711644a8838ffed4cac7394135eb8ba97d&=&format=webp&quality=lossless&width=461&height=461' },
  { id: 2, name: 'Bob', avatar: 'https://media.discordapp.net/attachments/1318039115207278612/1347761565054664734/79337643af4ad3d7ed3ea88918aab465.png?ex=67ce51c5&is=67cd0045&hm=5bf9565b253475f6f864d319d0a49d711644a8838ffed4cac7394135eb8ba97d&=&format=webp&quality=lossless&width=461&height=461' },
  { id: 3, name: 'Charlie', avatar: 'https://media.discordapp.net/attachments/1318039115207278612/1347761565054664734/79337643af4ad3d7ed3ea88918aab465.png?ex=67ce51c5&is=67cd0045&hm=5bf9565b253475f6f864d319d0a49d711644a8838ffed4cac7394135eb8ba97d&=&format=webp&quality=lossless&width=461&height=461' },
];

const fakeMessages = {
  1: [
    { id: 1, text: 'Hey!', sender: 'Alice' },
    { id: 2, text: 'How are you?', sender: 'Alice' },
  ],
  2: [
    { id: 1, text: 'Hello!', sender: 'Bob' },
  ],
  3: [
    { id: 1, text: 'What\'s up?', sender: 'Charlie' },
  ],
};

const Chat = ({ onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAuth();

  const sendMessage = () => {
    if (!messageInput.trim() || !selectedUser) return;
    fakeMessages[selectedUser.id] = [
      ...fakeMessages[selectedUser.id],
      { id: Date.now(), text: messageInput, sender: 'Me' },
    ];
    setMessageInput('');
  };

  return (
    <View style={styles.chatContainer}>
      <View style={styles.leftColumn}>
        <FlatList
          data={fakeUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Tooltip
              title={item.name}
              enterTouchDelay={0}
              leaveTouchDelay={50}
            >
              <TouchableOpacity onPress={() => setSelectedUser(item)} style={styles.userItem}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              </TouchableOpacity>
            </Tooltip>
          )}
        />
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.chatHeader}>
          {selectedUser && <Text style={styles.chatTitle}>{selectedUser.name}</Text>}
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✖</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={selectedUser ? fakeMessages[selectedUser.id] : []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Text style={styles.message}>{item.sender}: {item.text}</Text>
          )}
        />

        {selectedUser && (
          <View style={styles.inputContainer}>
            <TextInput
              value={messageInput}
              onChangeText={setMessageInput}
              placeholder="Type a message..."
              style={styles.input}
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    position: 'absolute',
    bottom: -100,
    right: 100,
    width: 400,
    height: 500,
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  leftColumn: {
    width: 80,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  userItem: {
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden', // Ensure overflow is compatible with ImageStyle
  },
  rightColumn: {
    flex: 1,
    padding: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 18,
    color: 'red',
  },
  message: {
    paddingVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
  },
  sendButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  sendText: {
    color: 'white',
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
  },
});

export default Chat;
