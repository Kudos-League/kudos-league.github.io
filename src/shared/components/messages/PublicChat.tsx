import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useWebSocket } from 'shared/hooks/useWebSocket';
import { getMessages, getPublicChannels, sendMessage as sendChatMessage } from 'shared/api/actions';
import { useAuth } from 'shared/hooks/useAuth';
import { ChannelDTO, MessageDTO } from 'shared/api/types';

const PublicChat = () => {
  const { token } = useAuth();
  const { joinChannel, leaveChannel, messages: socketMessages } = useWebSocket(token);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (socketMessages.length > 0 && selectedChannel) {
      setMessages((prev) => [...prev, ...socketMessages]);
    }
  }, [socketMessages]);

  // Fetch available public channels
  const fetchChannels = async () => {
    if (!token) return;

    try {
      const publicChannels = await getPublicChannels(token);
      setChannels(publicChannels);

      // Automatically select the first available public chat if none is selected
      if (publicChannels.length > 0 && !selectedChannel) {
        selectChannel(publicChannels[0]);
      }
    } catch (error) {
      console.error('Error fetching public channels:', error);
    }
  };

  // Select a public channel
  const selectChannel = async (channel: ChannelDTO) => {
    setSelectedChannel(channel);
    setLoading(true);

    if (!token) return;

    try {
      const messagesData = await getMessages(channel.id, token);
      setMessages(messagesData);

      if (selectedChannel && selectedChannel.id !== channel.id) {
        leaveChannel(selectedChannel.id);
      }
      joinChannel(channel.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message to selected channel
  const sendMessage = async () => {
    if (!token || !messageInput.trim() || !selectedChannel) return;

    try {
      const newMessage = await sendChatMessage({ channelID: selectedChannel.id, content: messageInput }, token);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  console.log('selected', selectedChannel);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flexContainer} 
    >
      <View style={styles.chatContainer}>
        {/* Left Column: List of Public Channels */}
        <View style={styles.leftColumn}>
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectChannel(item)} style={styles.channelItem}>
                <Text style={[styles.channelName, selectedChannel?.id === item.id && styles.selectedChannel]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
  
        {/* Right Column: Chat Messages */}
        <View style={styles.rightColumn}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>
              {selectedChannel ? selectedChannel.name : 'Select a Public Chat'}
            </Text>
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
              contentContainerStyle={{ paddingBottom: 60 }}
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
    </KeyboardAvoidingView>
  );    
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  leftColumn: {
    width: 120,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    alignItems: 'center',
  },
  channelItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    alignItems: 'center',
  },
  selectedChannel: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  channelName: {
    fontSize: 16,
  },
  rightColumn: {
    flex: 1,
    padding: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noMessagesText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 20,
  },
  message: {
    paddingVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0, 
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  flexContainer: {
    flex: 1,
  },
});

export default PublicChat;
