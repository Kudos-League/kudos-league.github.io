import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  FlatList
} from 'react-native';
import { useAppSelector } from 'redux_store/hooks';
import { sendDirectMessage } from 'shared/api/actions';
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
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  isChatOpen, 
  setIsChatOpen, 
  recipientID = "0",
  selectedChannel
}) => {
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const token = useAppSelector((state) => state.auth.token);
  const { user } = useAuth();
  const { joinChannel, leaveChannel } = useWebSocket(token, messages, setMessages);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

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
            if (selectedChannel) {
              leaveChannel(selectedChannel.id);
            }
            setIsChatOpen(false);
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
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          style={{ 
            maxHeight: 200, 
            marginBottom: 15,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            padding: 10,
            borderRadius: 5
          }}
        />

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
            style={{
              backgroundColor: '#007BFF',
              padding: 10,
              borderRadius: 5
            }}
          >
            <Text style={{ color: 'white' }}>Send</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#888',
  },
};

export default ChatModal;