import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { TextInput, Tooltip } from 'react-native-paper';
import { useAppSelector } from 'redux_store/hooks';
import { getMessages, getUserDetails, sendDirectMessage } from 'shared/api/actions';
import { getEndpointUrl } from 'shared/api/config';
import { ChannelDTO, CreateMessageDTO, MessageDTO } from 'shared/api/types';
import { useAuth } from 'shared/hooks/useAuth';
import { useWebSocket } from 'shared/hooks/useWebSocket';

const Chat = ({ onClose }) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAuth();
  const { joinChannel, leaveChannel, messages: socketMessages } = useWebSocket(token);

  useEffect(() => {
    fetchChannels();
  }, []);

  // Merge local messages + WebSocket messages
  useEffect(() => {
    if (socketMessages.length > 0) {
      setMessages((prev) => [...prev, ...socketMessages]);
    }
  }, [socketMessages]);

  // Fetch DM channels
  const fetchChannels = async () => {
    if (!token) {
      throw new Error('No token found');
    }
    try {
      const response = await getUserDetails('me', token, { dmChannels: true });
      const formattedChannels = response.dmChannels.map((channel) => {
        const otherUser = channel.users.find((u) => u.id !== user.id);
        return otherUser ? { ...channel, otherUser } : null;
      }).filter(Boolean);

      setChannels(formattedChannels);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  // Select a chat (channel)
  const selectChannel = async (channel: ChannelDTO) => {
    setSelectedChannel(channel);
    setLoading(true);

    if (!token) {
      throw new Error('No token found');
    }

    try {
      const messagesData = await getMessages(channel.id, token);
      setMessages(messagesData);

      if (selectedChannel) {
        leaveChannel(selectedChannel.id);
      }
      joinChannel(channel.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message in the selected channel
  const sendMessage = async () => {
    if (!token) {
      throw new Error('No token found');
    }
  
    if (!messageInput.trim() || !selectedChannel) return;
  
    try {
      // Get the other user in the DM channel (excluding the logged-in user)
      const receiver = selectedChannel.users.find(u => u.id !== user.id);
      if (!receiver) {
        throw new Error('No valid recipient found');
      }
  
      const newMessage: CreateMessageDTO = {
        content: messageInput,
      };
  
      const response = await sendDirectMessage(receiver.id, newMessage, token);
      // TODO: response doesnt return attached user so the username is blank.. also didnt show up on refresh so might be an issue with attaching the user entirely
      setMessages([...messages, response]);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <View style={styles.chatContainer}>
      <View style={styles.leftColumn}>
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Tooltip title={item.otherUser.username}>
              <TouchableOpacity onPress={() => selectChannel(item)} style={styles.userItem}>
                <Image source={{ uri: `${getEndpointUrl()}${item.otherUser.avatar}` }} style={styles.avatar} />
              </TouchableOpacity>
            </Tooltip>
          )}
        />
      </View>

      <View style={styles.rightColumn}>
        <View style={styles.chatHeader}>
          {selectedChannel && (
            <Text style={styles.chatTitle}>{selectedChannel.otherUser.username}</Text>
          )}
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✖</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#4a90e2" />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Text style={styles.message}>{item.author?.username}: {item.content}</Text>
            )}
          />
        )}

        {selectedChannel && (
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
    overflow: 'hidden',
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
});

export default Chat;
