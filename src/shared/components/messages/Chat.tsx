import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { TextInput, Avatar, IconButton, Surface, Badge } from 'react-native-paper';
import { useAppSelector } from 'redux_store/hooks';
import { getUserDetails, sendDirectMessage } from 'shared/api/actions';
import { getAvatarURL, getEndpointUrl } from 'shared/api/config';
import { ChannelDTO, CreateMessageDTO, MessageDTO } from 'shared/api/types';
import { useAuth } from 'shared/hooks/useAuth';
import { useWebSocket } from 'shared/hooks/useWebSocket';

// Message time formatter
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Message grouping by date
const groupMessagesByDate = (messages: MessageDTO[]) => {
  const groups: {[key: string]: MessageDTO[]} = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt);
    const dateKey = date.toLocaleDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(message);
  });
  
  return Object.entries(groups).map(([date, messages]) => ({
    date,
    messages
  }));
};

// Message status component
const MessageStatus = ({ status }: { status: 'sent' | 'delivered' | 'read' }) => {
  let color = '#999';
  let name = 'check';
  
  if (status === 'delivered') {
    name = 'check-all';
  } else if (status === 'read') {
    name = 'check-all';
    color = '#34B7F1';
  }
  
  return <IconButton icon={name} size={12} color={color} />;
};

// Main WhatsApp Clone Component
const Chat = ({ onClose }) => {
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [noDMs, setNoDMs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAuth();
  const { joinChannel, leaveChannel } = useWebSocket(token, messages, setMessages);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages?.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Fetch DM channels
  const fetchChannels = async () => {
    if (!token) {
      throw new Error('No token found');
    }
    try {
      const response = await getUserDetails(user.id, token, { dmChannels: true });
      const formattedChannels = response.dmChannels.map((channel) => {
        const otherUser = channel.users.find((u) => u.id !== user.id);
        
        // Add last message summary and timestamp for channel list
        const lastMessage = channel.lastMessage ? {
          content: channel.lastMessage.content,
          timestamp: new Date(channel.lastMessage.createdAt).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          isUnread: !channel.lastMessage.readBy?.includes(user.id)
        } : null;
        
        return otherUser ? { 
          ...channel, 
          otherUser,
          lastMessage
        } : null;
      }).filter(Boolean);

      setChannels(formattedChannels);
      if (formattedChannels?.length === 0) {
        setNoDMs(true);
      } else {
        setNoDMs(false);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  // Select a chat (channel)
  const selectChannel = async (channel: ChannelDTO) => {
    setSelectedChannel(channel);
    setLoading(true);
    setShowChannels(false);

    if (!token) {
      throw new Error('No token found');
    }

    try {
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
      // Adding user info to prevent blank username
      const messageWithUser = {
        ...response,
        author: {
          ...response.author,
          username: response.author?.username || user.username,
          id: response.author?.id || user.id
        },
        status: 'sent'
      };
      
      setMessages([...messages, messageWithUser]);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Filter channels by search query
  const filteredChannels = channels.filter(channel => 
    channel.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render message item
  const renderMessageItem = ({ item }: { item: MessageDTO }) => {
    const isOwnMessage = item.author?.id === user.id;
    
    return (
      <View style={[
        styles.messageBubble, 
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Text style={styles.messageText}>{item.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>
            {formatMessageTime(item.createdAt)}
          </Text>
          {isOwnMessage && (
            <MessageStatus status={item.status || 'sent'} />
          )}
        </View>
      </View>
    );
  };

  // Render date separator
  const renderDateSeparator = (date: string) => (
    <View style={styles.dateSeparator}>
      <Surface style={styles.datePill}>
        <Text style={styles.dateText}>{date}</Text>
      </Surface>
    </View>
  );

  // Return to channel list
  const goBackToChannels = () => {
    setShowChannels(true);
    if (selectedChannel) {
      leaveChannel(selectedChannel.id);
      setSelectedChannel(null);
    }
  };

  // Render channel list or chat screen based on state
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="rgb(57, 86, 255)" barStyle="light-content" />
      
      {showChannels ? (
        // Channels List Screen
        <View style={styles.channelsContainer}>
          
          <View style={styles.searchContainer}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              left={<TextInput.Icon name="magnify" color="rgb(57, 86, 255)" />}
              style={styles.searchInput}
              mode="outlined"
              outlineColor="#E5E5E5"
              activeOutlineColor="rgb(57, 86, 255)"
            />
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="rgb(57, 86, 255)" style={styles.loader} />
          ) : noDMs ? (
            <Text style={styles.noDmsText}>No conversations yet</Text>
          ) : (
            <FlatList
              data={filteredChannels}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => selectChannel(item)} 
                  style={styles.channelItem}
                >
                  <View style={styles.avatarContainer}>
                    <Avatar.Image 
                      source={{ uri: getAvatarURL(item.otherUser.avatar) || "" }} 
                      size={50} 
                    />
                    {item.lastMessage?.isUnread && (
                      <Badge style={styles.unreadBadge}>1</Badge>
                    )}
                  </View>
                  
                  <View style={styles.channelInfo}>
                    <View style={styles.channelHeader}>
                      <Text style={styles.username}>{item.otherUser.username}</Text>
                      {item.lastMessage && (
                        <Text style={styles.timestamp}>{item.lastMessage.timestamp}</Text>
                      )}
                    </View>
                    
                    {item.lastMessage ? (
                      <Text 
                        style={[
                          styles.lastMessage,
                          item.lastMessage.isUnread && styles.unreadMessage
                        ]}
                        numberOfLines={1}
                      >
                        {item.lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={styles.lastMessage}>Start a conversation</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
          
          <View style={styles.fab}>
            <IconButton
              icon="message-plus"
              color="white"
              size={24}
              style={styles.fabIcon}
              onPress={() => {}}
            />
          </View>
        </View>
      ) : (
        // Individual Chat Screen
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chatScreen}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <IconButton 
                icon="arrow-left" 
                color="white" 
                onPress={goBackToChannels} 
              />
              
              {selectedChannel && (
                <>
                  <Avatar.Image 
                    source={{ uri: `${getEndpointUrl()}${selectedChannel.otherUser.avatar}` }}
                    size={40}
                    style={styles.chatHeaderAvatar}
                  />
                  <View>
                    <Text style={styles.chatHeaderUsername}>
                      {selectedChannel.otherUser.username}
                    </Text>
                    <Text style={styles.chatHeaderStatus}>online</Text>
                  </View>
                </>
              )}
            </View>
            
            <View style={styles.chatHeaderRight}>
            </View>
          </View>
          
          <View style={styles.chatBackground}>
            {loading ? (
              <ActivityIndicator size="large" color="rgb(57, 86, 255)" />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messagesContainer}
                ListEmptyComponent={
                  <Text style={styles.emptyChat}>
                    No messages yet. Say hello!
                  </Text>
                }
              />
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <IconButton icon="emoticon" color="#505050" size={24} />
              <TextInput
                value={messageInput}
                onChangeText={setMessageInput}
                placeholder="Message"
                style={styles.input}
                multiline
                mode="flat"
                underlineColor="transparent"
              />
              <IconButton icon="paperclip" color="#505050" size={24} />
              <IconButton icon="camera" color="#505050" size={24} />
            </View>
            
            <TouchableOpacity 
              onPress={sendMessage} 
              style={styles.sendButton}
              disabled={!messageInput.trim()}
            >
              <IconButton
                icon={messageInput.trim() ? "send" : "microphone"}
                color="white"
                size={24}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  channelsContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'rgb(57, 86, 255)',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: 'white',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  noDmsText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
    marginTop: 50,
  },
  channelItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: 'rgb(57, 86, 255)',
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  username: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    maxWidth: '90%',
  },
  unreadMessage: {
    color: '#000',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fabIcon: {
    backgroundColor: '',
  },
  
  // Chat screen styles
  chatScreen: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: 'rgb(120, 140, 255)',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    marginRight: 10,
  },
  chatHeaderUsername: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatHeaderStatus: {
    color: '#E5E5E5',
    fontSize: 12,
  },
  chatHeaderRight: {
    flexDirection: 'row',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#E5DDD5',
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 8,
    padding: 8,
    marginVertical: 5,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyChat: {
    textAlign: 'center',
    color: '#888',
    marginTop: 50,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 10,
  },
  datePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 245, 254, 0.8)',
    elevation: 1,
  },
  dateText: {
    fontSize: 12,
    color: 'rgb(120, 140, 255)',
  },
  encryptionNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  encryptionText: {
    fontSize: 12,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#F0F0F0',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: 'rgb(57, 86, 255)',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Chat;