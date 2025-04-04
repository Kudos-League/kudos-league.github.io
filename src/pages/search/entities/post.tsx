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
} from "react-native";
import { createDMChannel, createHandshake, getPostDetails } from "shared/api/actions";
import { Ionicons } from "@expo/vector-icons";
import { ChannelDTO, CreateHandshakeDTO, PostDTO } from "shared/api/types";
import { useAppSelector } from "redux_store/hooks";
import AvatarComponent from "shared/components/Avatar";
import { useAuth } from "shared/hooks/useAuth";
import MapDisplay from "shared/components/Map";
import { getEndpointUrl } from "shared/api/config";
import MessageList from "shared/components/messages/MessageList";
import Chat from "shared/components/messages/Chat";
import type { Post as PostType } from "index";
import Logger from "../../../Logger";
import ChatModal from "shared/components/ChatModal";

const Post = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { user, isLoggedIn } = useAuth();

  const [postDetails, setPostDetails] = useState<PostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAllHandshakes, setShowAllHandshakes] = useState(false);
  const [creatingHandshake, setCreatingHandshake] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingRecipientID, setPendingRecipientID] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);

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

  const displayedHandshakes = showAllHandshakes
    ? postDetails?.handshakes
    : postDetails?.handshakes.slice(0, 2);
  const displayedOffers = postDetails?.rewardOffers || [];

  const handleAcceptHandshake = (index: number) => {
    console.log(`Accepted handshake at index ${index}`);
    const updatedHandshakes = [...displayedHandshakes || []];
    updatedHandshakes[index].status = "Pending";
    
    // Open chat with the handshake sender
    if (displayedHandshakes && displayedHandshakes[index]?.sender?.id) {
      startDMChat(displayedHandshakes[index]?.sender?.id);
    }
  };

  const startDMChat = async (recipientId: string) => {
    if (!token) {
      console.error("No token found");
      return;
    }
  
    try {
      if (user && recipientId) {
        // Don't create a DM channel yet, just open the chat modal
        setIsChatOpen(true);
        setPendingRecipientID(recipientId);
      }
    } catch (error) {
      console.error("Error preparing DM chat:", error);
    }
  };

  const handleSubmitHandshake = () => {
    if (!token) {
      console.error("No token. Please register or log in.");
      return;
    }
  
    if (!postDetails) {
      console.error("Post details are not loaded.");
      return;
    }
  
    // Don't create handshake yet, just open chat
    startDMChat(postDetails.sender?.id || "0");
  };

  // This function will be called when a channel is created after sending a message
  const handleChannelCreated = async (channel: ChannelDTO) => {
    if (!token || !postDetails || !pendingRecipientID) {
      console.error("Missing required data to create handshake");
      return;
    }
  
    setCreatingHandshake(true);
    
    try {
      // Now create the handshake after successful message and channel creation
      const handshakeData: CreateHandshakeDTO = {
        postID: parseInt(postDetails.id),
        senderID: user?.id || 0,
        receiverID: pendingRecipientID,
        type: postDetails.type,
        status: 'new'
      };
  
      const response = await createHandshake(handshakeData, token);
      const newHandshake = response.data;
  
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        handshakes: [...(prevDetails?.handshakes || []), newHandshake],
      }));
  
      console.log("Handshake created successfully after message sent:", newHandshake);
      
      // Clear the pending recipient
      setPendingRecipientID(null);
      
    } catch (error) {
      console.error("Error creating handshake:", error);
    } finally {
      setCreatingHandshake(false);
    }
  };

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

          <View style={styles.mapContainer}>
            <MapDisplay
              showAddressBar={false}
              regionID={postDetails.location?.regionID ?? undefined}
              exactLocation={false}
              width={300}
              height={300}
            />
          </View>

          <View style={styles.card}>
            <MessageList
              title='Comments'
              messages={postDetails?.messages || []}
              callback={(response) => {
                setPostDetails((prevDetails) => ({
                  ...prevDetails!,
                  messages: [...(prevDetails?.messages || []), response],
                }));
              }}
              postID={parseInt(postDetails.id)}
            />
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
                      User Kudos: {handshake.sender?.kudos}
                    </Text>
                  </View>
                  {(handshake.status === "new" && user?.id === parseInt(postDetails.sender?.id)) && (
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
      {isChatOpen && (
        <ChatModal 
          isChatOpen={isChatOpen} 
          setIsChatOpen={setIsChatOpen} 
          recipientID={pendingRecipientID || ""} 
          selectedChannel={selectedChannel}
          onChannelCreated={handleChannelCreated}
        />
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
    display: "flex",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  mapContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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