import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';

interface ChatModalProps {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  recipientID?: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ 
  isChatOpen, 
  setIsChatOpen, 
  recipientID = "0" 
}) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message to messages array
      setMessages(prevMessages => [...prevMessages, message]);
      
      // Here you would typically also send the message via your chat service
      
      // Clear input after sending
      setMessage('');
    }
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
          }}>Direct Message</Text>
          <TouchableOpacity onPress={() => setIsChatOpen(false)}>
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
        <View style={{ 
          maxHeight: 200, 
          marginBottom: 15,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          padding: 10,
          borderRadius: 5
        }}>
          {messages.map((msg, index) => (
            <Text key={index} style={{ marginBottom: 5 }}>
              {msg}
            </Text>
          ))}
        </View>

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
            value={message}
            onChangeText={setMessage}
            multiline={true}
            numberOfLines={3}
          />
          <TouchableOpacity 
            onPress={handleSendMessage}
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

export default ChatModal;