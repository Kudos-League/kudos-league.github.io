import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { createHandshake, getPostDetails, sendMessage } from "shared/api/actions";
import { Ionicons } from "@expo/vector-icons";
import { CreateHandshakeDTO, CreateMessageDTO } from "shared/api/types";
import { SubmitHandler } from "react-hook-form";
import { useAppSelector } from "redux_store/hooks";
import AvatarComponent from "shared/components/Avatar";
import {useAuth} from "shared/hooks/useAuth";
import MapDisplay from "shared/components/Map";
import { getEndpointUrl } from "shared/api/config";

const Post = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { user } = useAuth();

  const [postDetails, setPostDetails] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [showAllHandshakes, setShowAllHandshakes] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [creatingHandshake, setCreatingHandshake] = useState(false);

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

  useEffect(() => {
    fetchPostDetails(id);
  }, [id]);

  const openImageModal = (image: string) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const displayedHandshakes = showAllHandshakes
    ? postDetails?.handshakes
    : postDetails?.handshakes.slice(0, 2);
  const displayedOffers = postDetails?.rewardOffers || [];

  const handleAcceptHandshake = (index: number) => {
    const updatedHandshakes = [...displayedHandshakes || []];
    updatedHandshakes[index].status = "Accepted";
  };

  interface FormValuesMessage {
    content: string;
    senderID: string;
    postID: string;
    // threadID: number;
    // replyToMessageID?: number;
    handshakeID?: number;
    readAt?: Date;
  }

  const handleSubmitMessage = () => {
    if (!messageContent.trim()) {
      console.error("Message content cannot be empty");
      return;
    }
  
    if (!postDetails) {
      console.error("Post details are not loaded");
      return;
    }
  
    const messageData: FormValuesMessage = {
      content: messageContent,
      senderID: user?.id|| "0",
      postID: postDetails?.id || "0",
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
  
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        messages: [...(prevDetails?.messages || []), response],
      }));
    } catch (e) {
      console.error("Error trying to send message:", e);
    }
  };
     
  const handleSubmitHandshake = async () => {
    if (!token) {
      console.error("No token. Please register or log in.");
      return;
    }
  
    if (!postDetails) {
      console.error("Post details are not loaded.");
      return;
    }
  
    setCreatingHandshake(true);
  
    const handshakeData: CreateHandshakeDTO = {
      postID: postDetails.id,
      senderID: user?.id || "0",
      receiverID: postDetails.sender?.id || "0",
      type: postDetails.type, // TODO: This might be redundant since the post has the type
      status: 'new' // TODO: Should be optional
    };
  
    try {
      const response = await createHandshake(handshakeData, token);
      const newHandshake = response.data;
  
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        handshakes: [...(prevDetails?.handshakes || []), newHandshake],
      }));
  
      console.log("Handshake created successfully:", newHandshake);
    } catch (error) {
      console.error("Error creating handshake:", error);
    } finally {
      setCreatingHandshake(false);
    }
  };

  const displayedMessages = showAllMessages
    ? postDetails?.messages
    : postDetails?.messages.slice(0, 3);

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
              <AvatarComponent
                username={postDetails.sender?.username || "Anonymous"}
                avatar={postDetails.sender?.avatar}
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
              source={{
                uri: `${getEndpointUrl()}${postDetails.images?.[0]}`,
              }}
              style={styles.bannerImage}
            />
          )}

          <View style={styles.descriptionContainer}>
            <Text style={styles.body}>{postDetails.body}</Text>
            {displayedOffers[0]?.kudosFinal && (
              <Text style={styles.finalKudos}>
                Final Kudos: {displayedOffers[0]?.kudosFinal}
              </Text>
            )}
          </View>

          <View style={styles.descriptionContainer}>
            <MapDisplay
              showAddressBar={false}
              regionID={postDetails.regionID}
              exactLocation={false}
              width={300}
              height={300}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comments</Text>
            <ScrollView style={styles.messagesContainer}>
              {displayedMessages?.map((message) => (
                <View key={message.id} style={styles.message}>
                  <AvatarComponent
                    username={message.author?.username || "Anonymous"}
                    avatar={message.author?.avatar}
                    style={styles.avatar}
                  />
                  <View style={styles.messageContent}>
                    <View style={styles.messageHeader}>
                      <Text style={styles.username}>{message.author?.username}</Text>
                      <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                    <Text style={styles.kudos}>
                      Kudos: {message.author?.kudos}
                    </Text>
                    <Text style={styles.messageText}>{message.content}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
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


            {displayedMessages?.length && displayedMessages?.length > 3 && !showAllMessages && (
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
              {displayedHandshakes?.map((handshake, index) => (
                <View key={handshake.id} style={styles.handshake}>
                  <AvatarComponent
                    username={handshake.sender?.username || "Anonymous"}
                    avatar={handshake.sender?.avatar}
                    style={styles.avatar}
                  />
                  <View style={styles.handshakeContent}>
                    <Text style={styles.username}>{handshake.sender?.username || "Display Name Unavailable"}</Text>
                    <Text style={styles.status}>
                      Status: {handshake.status}
                    </Text>
                    <Text style={styles.kudos}>
                      Kudos: {handshake.sender?.kudos}
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
              onPress={handleSubmitHandshake}
              disabled={creatingHandshake}
            >
              {creatingHandshake ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={24} color="#fff" />
              )}
            </TouchableOpacity>

            {displayedHandshakes?.length && displayedHandshakes.length > 2 && !showAllHandshakes && (
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
                  <AvatarComponent
                    username={offer.sender?.username || "Anonymous"}
                    avatar={offer.sender?.avatar}
                    style={styles.avatarSmall}
                  />
                  <View style={styles.offerCompactContent}>
                    <Text style={styles.username}>{offer.sender?.username || "Display Name Unavailable"}</Text>
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
