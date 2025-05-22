import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { SubmitHandler } from "react-hook-form";
import { useAppSelector } from "redux_store/hooks";
import { Ionicons } from "@expo/vector-icons";

import { CreateMessageDTO, MessageDTO } from "shared/api/types";
import Message from "./Message";
import { sendMessage } from "shared/api/actions";
import { useAuth } from "shared/hooks/useAuth";

interface AlertProps {
  messages: MessageDTO[];
  title?: string;
  callback?: (data: any) => void;
  postID?: number;
  showSendMessage?: boolean; //IMPORTANT: Whether to show the send message input
}

interface FormValuesMessage {
    content: string;
    senderID: number;
    postID: number;
    // threadID: number;
    // replyToMessageID?: number;
    handshakeID?: number;
    readAt?: Date;
}

const MessageList: React.FC<AlertProps> = ({ messages, title, callback, postID, showSendMessage}) => {
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState("");

    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);

    const handleSubmitMessage = () => {
        if (!messageContent.trim()) {
          console.error("Message content cannot be empty");
          return;
        }
      
        const messageData: FormValuesMessage = {
          content: messageContent,
          senderID: user?.id|| 0,
          postID: postID || 0,
        };
      
        onSubmitMessage(messageData);
        setMessageContent("");
    };  

    const onSubmitMessage: SubmitHandler<FormValuesMessage> = async (data) => {
    if (!token) {
        console.error("No token. Please register or log in.");
        return;
    }
    
    const request: CreateMessageDTO = {
        content: data.content,
        authorID: data?.senderID,
        postID: data?.postID,
    };
    
    try {
        const response = await sendMessage(request, token);
        
        callback?.(response); // Callback to update state outside or something     
        } catch (e) {
            console.error("Error trying to send message:", e);
        }
    };

    const displayedMessages = showAllMessages
        ? messages
        : messages.slice(0, 3);
    
  return (
    <View>
        {title && <Text style={styles.sectionTitle}>{title}</Text>}
        <ScrollView style={styles.messagesContainer}>
        {messages?.length === 0 && (
          <Text style={styles.errorMessage}>No comments yet</Text>
        )}
        {displayedMessages?.map((message) => (
            <Message key={message.id} message={message} />
        ))}
        </ScrollView>

        {showSendMessage && (
        <View style={styles.messageInputContainer}>
            <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                value={messageContent}
                onChangeText={setMessageContent}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSubmitMessage}>
                <Ionicons name="send" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
        )}
        {(messages?.length && messages?.length > 3 && !showAllMessages) ? (
            <TouchableOpacity
                onPress={() => setShowAllMessages(true)}
                style={styles.showMoreButton}
            >
                <Text style={styles.showMoreText}>Show more messages</Text>
            </TouchableOpacity>
        ) : ''}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  errorMessage: {
    fontSize: 16,
    color: "red",
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: "#4a90e2",
    borderRadius: 5,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  kudos: {
    fontSize: 14,
    color: "#666",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  messageContent: {
    flex: 1,
    marginLeft: 10,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  messageText: {
    fontSize: 14,
    marginTop: 5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  messagesContainer: {
    maxHeight: 300,
    marginTop: 10,
  },
  message: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  titleContainer: {
    flex: 1,
    marginBottom: 10,
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff",
  },
  messageInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  sendButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  showMoreButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#505050",
    borderRadius: 5,
    alignItems: "center",
  },
  showMoreText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
});


export default MessageList;
