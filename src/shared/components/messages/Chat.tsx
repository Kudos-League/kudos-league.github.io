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
import AvatarComponent from '../Avatar';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';

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

  type RootStackParamList = {
    Home: undefined;
    Post: { id: string };
    UserProfile: { id: string };
  };

  type NavigationProps = StackNavigationProp<RootStackParamList, "UserProfile">;
  const navigation = useNavigation<NavigationProps>();

  const handleAvatarPress = (userId) => {
    if (userId) {
      navigation.navigate("UserProfile", { id: userId });
    }
  };

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
                    <AvatarComponent
                      username={item.otherUser.username}
                      avatar={item.otherUser.avatar}
                      size={50}
                    />

                    {item.lastMessage?.isUnread && (
                      <Badge style={styles.unreadBadge}>1</Badge>
                    )}
                  
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
                <View style={styles.chatHeaderAvatar}>
                  <TouchableOpacity onPress={() => handleAvatarPress(selectedChannel?.otherUser.id)}>
                    <AvatarComponent
                      username={selectedChannel?.otherUser.username}
                      avatar={selectedChannel?.otherUser.avatar}
                      size={40}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleAvatarPress(selectedChannel?.otherUser.id)}>
                    <View>
                      <Text style={styles.chatHeaderUsername}>
                        {selectedChannel.otherUser.username}
                      </Text>
                      <Text style={styles.chatHeaderStatus}>online</Text>
                    </View>
                  </TouchableOpacity>
                </View>
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
              <TextInput
                value={messageInput}
                onChangeText={setMessageInput}
                placeholder="Message"
                style={styles.input}
                multiline
                mode="flat"
                underlineColor="transparent"
              />
            </View>
            
            <TouchableOpacity 
              onPress={sendMessage} 
              style={styles.sendButton}
              disabled={!messageInput.trim()}
            >
              <IconButton
                icon={messageInput.trim() ? "send" : "send"}
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
    backgroundColor: '#F8F9FA', // Softer background
  },
  channelsContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#7FB2EF', // Softer blue instead of bright green
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerTitle: {
    color: '#F8F9FA',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: '#F8F9FA',
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  noDmsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6C757D', // Softer gray
    marginTop: 50,
  },
  channelItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF', // Lighter border
    alignItems: 'center',
    gap: 8
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: -5,
    backgroundColor: '#7FB2EF', // Softer notification color
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
    color: '#212529', // Dark but not pure black
  },
  timestamp: {
    fontSize: 12,
    color: '#6C757D',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6C757D',
    maxWidth: '90%',
  },
  unreadMessage: {
    color: '#212529',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fabIcon: {
    backgroundColor: '#7FB2EF', // Match header color
    // Match header color
  },
  
  // Chat screen styles
  chatScreen: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: '#5F92CF', // Match header color
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
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  chatHeaderUsername: {
    color: '#F8F9FA',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatHeaderStatus: {
    color: '#DEE2E6',
    fontSize: 12,
  },
  chatHeaderRight: {
    flexDirection: 'row',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: '#EDF2F7', // Softer chat background
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
    backgroundColor: '#DBE4FF', // Soft blue for own messages
    borderTopRightRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    color: '#343A40', // Softer than black
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#6C757D',
  },
  emptyChat: {
    textAlign: 'center',
    color: '#6C757D',
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
    backgroundColor: 'rgba(222, 226, 230, 0.8)', // Softer date pill
    elevation: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#7FB2EF', // Match header color
  },
  encryptionNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  encryptionText: {
    fontSize: 12,
    color: '#6C757D',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    backgroundColor: '#E9ECEF', // Softer input area
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    fontSize: 16,
    maxHeight: 50,
  },
  sendButton: {
    backgroundColor: '#8FB2FF', // Match header color
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Chat;