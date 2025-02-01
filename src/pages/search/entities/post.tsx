import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { BACKEND_URI } from "@env";
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Button } from "react-native-paper";
import { getPostDetails, sendMessage } from "shared/api/actions";
import { Ionicons } from "@expo/vector-icons";
import { create } from "tailwind-rn";
import { CreateMessageDTO } from "shared/api/types";
import { SubmitHandler } from "react-hook-form";
import { useAppSelector } from "redux_store/hooks";

//TODO: Refactor this, looks like shit, also call the API

const mockMessages = [
  {
    id: "1",
    user: { avatar: "https://placehold.co/50", name: "Alice", kudos: 120 },
    content: "This is a great post! Thanks for sharing.",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    user: { avatar: "https://placehold.co/50", name: "Bob", kudos: 80 },
    content: "Can you provide more details about the location?",
    timestamp: "3 hours ago",
  },
  {
    id: "3",
    user: { avatar: "https://placehold.co/50", name: "Charlie", kudos: 45 },
    content: "Interesting offer. I'll think about it.",
    timestamp: "5 hours ago",
  },
  {
    id: "4",
    user: { avatar: "https://placehold.co/50", name: "Dave", kudos: 30 },
    content: "Thanks! Really helpful post.",
    timestamp: "6 hours ago",
  },
];

const mockHandshakes = [
  {
    id: "1",
    sender: { avatar: "https://placehold.co/50", name: "Eve", kudos: 100 },
    status: "Pending",
  },
  {
    id: "2",
    sender: { avatar: "https://placehold.co/50", name: "Frank", kudos: 50 },
    status: "Accepted",
  },
  {
    id: "3",
    sender: { avatar: "https://placehold.co/50", name: "Ivy", kudos: 70 },
    status: "Pending",
  },
  {
    id: "4",
    sender: { avatar: "https://placehold.co/50", name: "Jack", kudos: 90 },
    status: "Accepted",
  },
];

const mockOffers = [
  {
    id: "1",
    sender: { avatar: "https://placehold.co/50", name: "Grace", kudos: 200 },
    body: "I offer 200 kudos.",
    kudosFinal: 250,
  },
  {
    id: "2",
    sender: { avatar: "https://placehold.co/50", name: "Hank", kudos: 150 },
    body: "Let's negotiate.",
    kudosFinal: null,
  },
  {
    id: "3",
    sender: { avatar: "https://placehold.co/50", name: "Olivia", kudos: 300 },
    body: "Great post!",
    kudosFinal: 350,
  },
  {
    id: "4",
    sender: { avatar: "https://placehold.co/50", name: "Paul", kudos: 180 },
    body: "I'll offer more if needed.",
    kudosFinal: 200,
  },
  {
    id: "5",
    sender: { avatar: "https://placehold.co/50", name: "Eve", kudos: 250 },
    body: "This is my offer.",
    kudosFinal: 275,
  },
  {
    id: "6",
    sender: { avatar: "https://placehold.co/50", name: "Jack", kudos: 220 },
    body: "Can we talk?",
    kudosFinal: null,
  },
  {
    id: "7",
    sender: { avatar: "https://placehold.co/50", name: "Alice", kudos: 190 },
    body: "Here’s my final offer.",
    kudosFinal: 210,
  },
  {
    id: "8",
    sender: { avatar: "https://placehold.co/50", name: "Frank", kudos: 170 },
    body: "I offer 170 kudos.",
    kudosFinal: null,
  },
  {
    id: "9",
    sender: { avatar: "https://placehold.co/50", name: "Charlie", kudos: 260 },
    body: "I can add more if needed.",
    kudosFinal: 280,
  },
  {
    id: "10",
    sender: { avatar: "https://placehold.co/50", name: "Sophia", kudos: 240 },
    body: "Let's finalize the deal.",
    kudosFinal: 260,
  },
  {
    id: "11",
    sender: { avatar: "https://placehold.co/50", name: "Leo", kudos: 210 },
    body: "Looking forward to this.",
    kudosFinal: null,
  },
  {
    id: "12",
    sender: { avatar: "https://placehold.co/50", name: "Mia", kudos: 230 },
    body: "This is a great opportunity.",
    kudosFinal: 250,
  },
  {
    id: "13",
    sender: { avatar: "https://placehold.co/50", name: "Noah", kudos: 280 },
    body: "Can I increase my offer?",
    kudosFinal: 300,
  },
  {
    id: "14",
    sender: { avatar: "https://placehold.co/50", name: "Liam", kudos: 270 },
    body: "Let’s make this happen.",
    kudosFinal: null,
  },
  {
    id: "15",
    sender: { avatar: "https://placehold.co/50", name: "Emma", kudos: 250 },
    body: "I’m very interested!",
    kudosFinal: 275,
  },
  {
    id: "16",
    sender: { avatar: "https://placehold.co/50", name: "Ava", kudos: 290 },
    body: "Best offer so far.",
    kudosFinal: 310,
  },
];

const Post = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [postDetails, setPostDetails] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showAllHandshakes, setShowAllHandshakes] = useState(false);

  const token = useAppSelector((state) => state.auth.token);

  const fetchPostDetails = async (postID: string) => {
    try {
      const data = await getPostDetails(postID);
      setPostDetails(data);
      setLoading(false);
    } catch (err) {
      setError("Failed to load post details. Please try again.");
      setLoading(false);
    }
  };

  // const fetchPostMessages = async (postID: string) => {
  //   try{
  //     const data = await getPostMessages(postID);
  //   }
  // };

  useEffect(() => {
    fetchPostDetails(id);
  }, [id]);

  const openImageModal = (image: string) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const displayedHandshakes = showAllHandshakes
    ? mockHandshakes
    : mockHandshakes.slice(0, 2);
  const displayedOffers = mockOffers;

  const handleAcceptHandshake = (index: number) => {
    const updatedHandshakes = [...mockHandshakes];
    updatedHandshakes[index].status = "Accepted";
  };

  interface FormValuesMessage {
    content: string;
    authorID: number;
    threadID: number;
    replyToMessageID?: number;
    handshakeID?: number;
    readAt?: Date;
  }

  const onSubmitMessage: SubmitHandler<FormValuesMessage> = async (data) => {
    const request: CreateMessageDTO = {
      content: data.content,
      authorID: data.authorID,
      threadID: data.threadID,
      replyToMessageID: data.replyToMessageID,
      handshakeID: data.handshakeID,
      readAt: data.readAt,
    };
    try {
      if (!token) {
        throw new Error("No token. Please register or log in.");
      }
      await sendMessage(request, token);
      console.log("Message sent successfully.");
    } catch (e) {
      console.error("Error trying to send message:", e);
    }
  };
  const createNewMessage = () => {
    // TODO: Add logic
  };

  const displayedMessages = showAllMessages
    ? mockMessages
    : mockMessages.slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {loading && (
        <ActivityIndicator size="large" color="#4a90e2" style={styles.loader} />
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            onPress={() => fetchPostDetails(id)}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      {!loading && !error && postDetails && (
        <View>
          <View style={styles.userTitleRow}>
            <View style={styles.userProfile}>
              <Image
                source={{
                  uri: postDetails.sender?.avatar || "https://placehold.co/50",
                }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.username}>
                  {postDetails.sender?.username || "Anonymous"}
                </Text>
                <Text style={styles.kudos}>
                  Kudos: {postDetails.sender?.kudos || 0}
                </Text>
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{postDetails.title}</Text>
              <View style={styles.badgesRow}>
                <Text
                  style={[
                    styles.badge,
                    postDetails.type === "Request"
                      ? styles.requestBadge
                      : styles.giftBadge,
                  ]}
                >
                  {postDetails.type}
                </Text>
                <Text style={styles.stateBadge}>{postDetails.status}</Text>
              </View>
            </View>
          </View>

          {postDetails.images?.[0] && (
            <Image
              source={{ uri: `${BACKEND_URI}${postDetails.images?.[0]}` }}
              style={styles.bannerImage}
            />
          )}

          <View style={styles.descriptionContainer}>
            <Text style={styles.body}>{postDetails.body}</Text>
            {mockOffers[0].kudosFinal && (
              <Text style={styles.finalKudos}>
                Final Kudos: {mockOffers[0].kudosFinal}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <ScrollView style={styles.messagesContainer}>
              {displayedMessages.map((message) => (
                <View key={message.id} style={styles.message}>
                  <Image
                    source={{ uri: message.user.avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.username}>{message.user.name}</Text>
                      <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                    <Text style={styles.kudos}>
                      Kudos: {message.user.kudos}
                    </Text>
                    <Text style={styles.messageText}>{message.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.createNewButton}
              onPress={createNewMessage}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>

            {mockMessages.length > 3 && !showAllMessages && (
              <TouchableOpacity
                onPress={() => setShowAllMessages(true)}
                style={styles.showMoreButton}
              >
                <Text style={styles.showMoreText}>Show more messages</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Handshakes</Text>
            <ScrollView style={styles.handshakesContainer}>
              {displayedHandshakes.map((handshake, index) => (
                <View key={handshake.id} style={styles.handshake}>
                  <Image
                    source={{ uri: handshake.sender.avatar }}
                    style={styles.avatar}
                  />
                  <View style={styles.handshakeContent}>
                    <Text style={styles.username}>{handshake.sender.name}</Text>
                    <Text style={styles.status}>
                      Status: {handshake.status}
                    </Text>
                    <Text style={styles.kudos}>
                      Kudos: {handshake.sender.kudos}
                    </Text>
                  </View>
                  {handshake.status === "Pending" && (
                    <TouchableOpacity
                      onPress={() => handleAcceptHandshake(index)}
                      style={styles.acceptButton}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.createNewButton}
              onPress={createNewMessage}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>

            {mockHandshakes.length > 2 && !showAllHandshakes && (
              <TouchableOpacity
                onPress={() => setShowAllHandshakes(true)}
                style={styles.showMoreButton}
              >
                <Text style={styles.showMoreText}>Show more handshakes</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kudos votation</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.offersContainer}
            >
              {displayedOffers.map((offer) => (
                <TouchableOpacity key={offer.id} style={styles.offerCompact}>
                  <Image
                    source={{ uri: offer.sender.avatar }}
                    style={styles.avatarSmall}
                  />
                  <View style={styles.offerCompactContent}>
                    <Text style={styles.username}>{offer.sender.name}</Text>
                    <Text style={styles.kudos}>
                      Kudos: {(offer as any).kudos || 0}
                    </Text>
                    {offer.body && (
                      <Text style={styles.offerBody}>{offer.body}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <Image
                src={selectedImage || ""}
                /*style={styles.modalImage}*/
              />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                /*style={styles.closeButton}*/
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      )}
    </ScrollView>
  );
};

export default Post;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  card: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  contentContainer: {
    padding: 16,
  },
  loader: {
    marginTop: 100,
  },
  errorContainer: {
    alignItems: "center",
    marginTop: 50,
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
  userTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
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
  descriptionContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: 5,
  },
  badgesRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    color: "#fff",
    fontSize: 12,
    marginRight: 10,
  },
  requestBadge: {
    backgroundColor: "#4a90e2",
  },
  giftBadge: {
    backgroundColor: "#34c759",
  },
  stateBadge: {
    backgroundColor: "#666",
    color: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    fontSize: 12,
  },
  handshakesContainer: {
    maxHeight: 300,
    marginTop: 10,
  },
  handshake: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  handshakeContent: {
    flex: 1,
    marginLeft: 10,
  },
  acceptButton: {
    padding: 8,
    backgroundColor: "#4a90e2",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },

  status: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  offer: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
  },
  offerContent: {
    marginLeft: 10,
  },
  offerBody: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  finalKudos: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#4a90e2",
  },
  bannerImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  offersContainer: {
    maxHeight: 120,
    marginTop: 10,
  },
  offerCompact: {
    width: 150,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
  },
  offerCompactContent: {
    alignItems: "center",
  },
  expandButton: {
    marginTop: 5,
    padding: 5,
    backgroundColor: "#4a90e2",
    borderRadius: 5,
  },
  expandButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  createNewButton: {
    alignSelf: "center", // Centers the button horizontally
    padding: 10,
    backgroundColor: "#4a90e2",
    borderRadius: 50, // Makes it circular
    marginBottom: 10,
  },

  createNewText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
});
