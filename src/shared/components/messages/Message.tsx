import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MessageDTO } from "shared/api/types";
import AvatarComponent from "../Avatar";
import { getAvatarURL } from "shared/api/config";

interface AlertProps {
  message: MessageDTO;
}

const Message: React.FC<AlertProps> = ({ message }) => {
  return (
    <View key={message.id} style={styles.message}>
        {message.author?.avatar && <AvatarComponent
            username={message.author?.username || "Anonymous"}
            avatar={getAvatarURL(message.author?.avatar)}
            style={styles.avatar}
        />}
        <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
            <Text style={styles.username}>{message.author?.username}</Text>
            <Text style={styles.timestamp}>{new Date(message.createdAt).toDateString()}</Text>
        </View>
        <Text style={styles.kudos}>
            Kudos: {message.author?.kudos}
        </Text>
        <Text style={styles.messageText}>{message.content}</Text>
        </View>
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
});


export default Message;
