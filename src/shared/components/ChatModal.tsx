import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppSelector } from 'redux_store/hooks';
import { getMessages, getUserDetails, sendDirectMessage } from 'shared/api/actions';
import { ChannelDTO, CreateMessageDTO, MessageDTO } from 'shared/api/types';
import { useAuth } from 'shared/hooks/useAuth';
import { useWebSocket } from 'shared/hooks/useWebSocket';

// Message time formatter
const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface ChatModalProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  recipientID?: string;
  selectedChannel?: ChannelDTO | null;
  onChannelCreated?: (channel: ChannelDTO) => void; // Optional callback when a new channel is created
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  isChatOpen, 
  setIsChatOpen, 
  recipientID = "0",
  selectedChannel: initialSelectedChannel,
  onChannelCreated
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(initialSelectedChannel || null);
  
  const flatListRef = useRef<FlatList>(null);
  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAuth();
  const { joinChannel, leaveChannel } = useWebSocket(token, messages, setMessages);

  // Only fetch existing channel when modal opens, don't create one yet
  useEffect(() => {
    if (isChatOpen && recipientID && recipientID !== "0") {
      fetchExistingChannel(recipientID);
    } else if (isChatOpen && initialSelectedChannel) {
      setSelectedChannel(initialSelectedChannel);
      fetchMessages(initialSelectedChannel.id);
    }
  }, [isChatOpen, recipientID, initialSelectedChannel]);

  // Join channel only when it's a real channel (not pending)
  useEffect(() => {
    if (selectedChannel && selectedChannel.id !== 'pending') {
      joinChannel(selectedChannel.id);
      
      // Clean up on unmount or channel change
      return () => {
        leaveChannel(selectedChannel.id);
      };
    }
  }, [selectedChannel]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Only fetch existing DM channel with recipient, don't create one yet
  const fetchExistingChannel = async (recipientId: string) => {
    if (!token) {
      throw new Error('No token found');
    }
    
    setLoading(true);
    
    try {
      // Try to find an existing DM channel with this user
      const userDetails = await getUserDetails('me', token, { dmChannels: true });
      
      let channel = userDetails.dmChannels.find(ch => 
        ch.users.some(u => u.id === recipientId)
      );
      
      // If an existing channel is found, load its messages
      if (channel) {
        // Find the other user in the channel
        const otherUser = channel.users.find(u => u.id !== user.id);
        if (otherUser) {
          // Add otherUser property to match the expected format
          channel = {
            ...channel,
            otherUser
          };
        }
        
        setSelectedChannel(channel);
        fetchMessages(channel.id);
      } else {
        // Just set recipient ID and wait for first message to create channel
        // We're not creating a channel yet, just preparing for one to be created
        setSelectedChannel({
          id: 'pending', // Temporary ID until channel is created
          users: [
            user,
            { id: recipientId } // We don't have full user details yet
          ],
          lastMessage: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as ChannelDTO);
        
        // No channel to fetch messages from yet
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
      setLoading(false);
    }
  };

  // Fetch messages for a channel
  const fetchMessages = async (channelId: string) => {
    if (!token) {
      throw new Error('No token found');
    }
    
    setLoading(true);
    
    try {
      const messagesData = await getMessages(channelId, token);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Validate message before sending
  const validateMessage = (message: string): boolean => {
    // Basic validation - check if the message is not just whitespace
    if (!message.trim()) return false;
    
    // You can add more validation rules here if needed
    // For example, check minimum/maximum length
    if (message.trim().length < 1) return false;
    if (message.trim().length > 1000) return false;
    
    // Check for inappropriate content, spam patterns, etc.
    // const containsSpam = /buy now|click here/i.test(message);
    // if (containsSpam) return false;
    
    return true;
  };

  // Send message in the selected channel or create a new one
  const sendMessage = async () => {
    if (!token) {
      throw new Error('No token found');
    }

    // Validate the message before sending
    if (!validateMessage(messageInput)) {
      // Handle invalid message (you could show a warning to the user)
      console.warn("Message validation failed");
      return;
    }

    try {
      setLoading(true);
      
      if (!selectedChannel || selectedChannel.id === 'pending') {
        // We're creating a new channel with the first message
        if (!recipientID || recipientID === "0") {
          throw new Error('No valid recipient found');
        }
        
        const newMessage: CreateMessageDTO = {
          content: messageInput,
        };
        
        // This will create a new channel and send the first message
        const response = await sendDirectMessage(recipientID, newMessage, token);
        
        // Update our selected channel with the new real channel
        if (response.channel) {
          const newChannel = response.channel;
          
          // Find the other user in the channel
          const otherUser = newChannel.users.find(u => u.id !== user.id);
          if (otherUser) {
            // Add otherUser property to match the expected format
            newChannel.otherUser = otherUser;
          }
          
          setSelectedChannel(newChannel);
          joinChannel(newChannel.id); // Only join after a message is sent and channel created
          
          // Notify parent component that a new channel was created
          if (onChannelCreated) {
            onChannelCreated(newChannel);
          }
        }
        
        // Add the message to our list
        const messageWithUser = {
          ...response,
          author: {
            ...response.author,
            username: response.author?.username || user.username,
            id: response.author?.id || user.id
          },
          status: 'sent'
        };
        
        setMessages([messageWithUser]);
      } else {
        // Normal case - channel already exists
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
      }
      
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      display: isChatOpen ? 'flex' : 'none'
    }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          width: '90%',
          maxWidth: 500,
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5
        }}
      >
        {/* Modal Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0',
          paddingBottom: 10
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            {selectedChannel?.otherUser?.username || 'Direct Message'}
          </Text>
          <TouchableOpacity onPress={() => {
            // Leave the channel when closing
            if (selectedChannel && selectedChannel.id !== 'pending') {
              leaveChannel(selectedChannel.id);
            }
            setIsChatOpen(false);
            setSelectedChannel(null);
            setMessages([]);
          }}>
            <Text style={{ color: 'red' }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Explanation Text */}
        <Text style={{
          color: '#666',
          textAlign: 'center',
          marginBottom: 15
        }}>
          You are now in a direct conversation with this user. 
          Messages sent here are private between both of you.
        </Text>

        {/* Message List */}
        {loading ? (
          <View style={{
            height: 200,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ActivityIndicator size="large" color="#007BFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item, index) => item.id || index.toString()}
            style={{ 
              height: 200, 
              marginBottom: 15,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              padding: 10,
              borderRadius: 5
            }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#888', padding: 20 }}>
                No messages yet. Start the conversation!
              </Text>
            }
          />
        )}

        {/* Message Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              borderRadius: 5,
              padding: 10,
              marginRight: 10
            }}
            placeholder="Type your message..."
            value={messageInput}
            onChangeText={setMessageInput}
            multiline={true}
            numberOfLines={3}
          />
          <TouchableOpacity 
            onPress={sendMessage}
            disabled={!validateMessage(messageInput) || loading}
            style={{
              backgroundColor: validateMessage(messageInput) && !loading ? '#007BFF' : '#CCCCCC',
              padding: 10,
              borderRadius: 5
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={{ color: 'white' }}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// Styles (you would typically have these in a separate styles file)
const styles = {
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  ownMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
  },
};

export default ChatModal;