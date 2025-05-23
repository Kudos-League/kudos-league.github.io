import { useNavigation, useRoute } from "@react-navigation/native";
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
import { createDMChannel, createHandshake, getPostDetails, likePost, reportPost, updateHandshake } from "shared/api/actions";
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
import { StackNavigationProp } from "@react-navigation/stack";

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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [liked, setLiked] = useState<null | boolean>(null);
  const token = useAppSelector((state) => state.auth.token);

  type RootStackParamList = {
    Home: undefined;
    Post: { id: string };
    UserProfile: { id: string };
  };

  type NavigationProps = StackNavigationProp<RootStackParamList, "UserProfile">;

  const navigation = useNavigation<NavigationProps>();

  const handleAvatarPress = () => {
    if (postDetails?.sender?.id) {
      navigation.navigate("UserProfile", { id: postDetails.sender.id });
    }
  };

  const fetchPostDetails = async (postID: string) => {
    if (!token) {
      setError("No token found. Please log in.");
      setLoading(false);
      return;
    }
      try {
      const data = await getPostDetails(token, postID);
      setPostDetails(data);

      const userLike = data.likes?.[0]?.like ?? null;
      setLiked(userLike);

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

  const handleAcceptHandshake = async (index: number) => {
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      const handshake = displayedHandshakes?.[index];
      if (!handshake) {
        console.error("Handshake not found");
        return;
      }

      setLoading(true);
      
      // Update handshake status to 'accepted'
      const response = await updateHandshake(
        handshake.id,
        { status: 'accepted' },
        token
      );

      // Update the UI with the updated handshake
      const updatedHandshakes = [...displayedHandshakes || []];
      updatedHandshakes[index] = response.data;
      
      // Update the post details with the updated handshakes
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        handshakes: updatedHandshakes,
      }));

      // Open chat with the handshake sender
      startDMChat(handshake.sender?.id || "0");
      
      console.log(`Handshake ${handshake.id} accepted successfully`);
    } catch (error) {
      console.error("Error accepting handshake:", error);
    } finally {
      setLoading(false);
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

  const handleMessageSent = async () => {
    if (!token || !postDetails) {
      console.error("Missing required data to create handshake:", { token: !!token, postDetails: !!postDetails });
      return;
    }
    
    // Get the recipient ID (should be the same as pendingRecipientID)
    const recipientId = pendingRecipientID;
    if (!recipientId) {
      console.error("Could not find recipient ID");
      return;
    }

    console.log("Creating handshake from message sent callback with:", { 
      postID: parseInt(postDetails.id),
      senderID: user?.id,
      recipientId,
      type: postDetails.type
    });
    
    setCreatingHandshake(true);
    
    try {
      // Create the handshake after message is sent
      const handshakeData: CreateHandshakeDTO = {
        postID: parseInt(postDetails.id),
        senderID: user?.id || 0,
        receiverID: recipientId.toString(),
        type: postDetails.type,
        status: 'new'
      };

      console.log("Sending handshake data:", handshakeData);
      const response = await createHandshake(handshakeData, token);
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        console.error("Invalid response from createHandshake:", response);
        throw new Error("Invalid response from server");
      }
      
      const newHandshake = response.data;

      console.log("Handshake created successfully:", newHandshake);
      
      // Update the post details with the new handshake
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        handshakes: [...(prevDetails?.handshakes || []), newHandshake],
      }));
      
      // Show feedback to the user
      alert("Handshake created successfully! You can now coordinate the details with the post owner.");
      
      // Close the chat after handshake is created
      setIsChatOpen(false);
      
      // Clear the pending recipient
      setPendingRecipientID(null);
      
      // Refresh the post details to show the new handshake
      fetchPostDetails(id);
      
    } catch (error) {
      console.error("Error creating handshake:", error);
      alert("Failed to create handshake. Please try again.");
    } finally {
      setCreatingHandshake(false);
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
    if (!token || !postDetails) {
      console.error("Missing required data to create handshake:", { token: !!token, postDetails: !!postDetails });
      return;
    }
    
    // Get the recipient ID from the channel users
    const recipientId = channel.users?.find(u => u.id !== user?.id)?.id;
    if (!recipientId) {
      console.error("Could not find recipient ID in channel users");
      return;
    }
  
    console.log("Creating handshake with:", { 
      postID: parseInt(postDetails.id),
      senderID: user?.id,
      recipientId,
      type: postDetails.type
    });
    
    setCreatingHandshake(true);
    
    try {
      // Now create the handshake after successful message and channel creation
      const handshakeData: CreateHandshakeDTO = {
        postID: parseInt(postDetails.id),
        senderID: user?.id || 0,
        receiverID: recipientId.toString(),
        type: postDetails.type,
        status: 'new'
      };
  
      console.log("Sending handshake data:", handshakeData);
      const response = await createHandshake(handshakeData, token);
      
      // Check if response has the expected structure
      if (!response || !response.data) {
        console.error("Invalid response from createHandshake:", response);
        throw new Error("Invalid response from server");
      }
      
      const newHandshake = response.data;
  
      console.log("Handshake created successfully:", newHandshake);
      
      // Update the post details with the new handshake
      setPostDetails((prevDetails) => ({
        ...prevDetails!,
        handshakes: [...(prevDetails?.handshakes || []), newHandshake],
      }));
      
      // Show feedback to the user
      alert("Handshake created successfully! You can now coordinate the details with the post owner.");
      
      // Clear the pending recipient
      setPendingRecipientID(null);
      
      // Refresh the post details to show the new handshake
      fetchPostDetails(id);
      
    } catch (error) {
      console.error("Error creating handshake:", error);
      alert("Failed to create handshake. Please try again.");
    } finally {
      setCreatingHandshake(false);
    }
  };

  const handleLike = async (likeValue: boolean) => {
    if (!token || !postDetails) return;
  
    try {
      await likePost(parseInt(postDetails.id), likeValue, token);
      setLiked(likeValue);
      setPostDetails(prev => prev ? {
        ...prev,
        likes: [{ like: likeValue, userID: user?.id, postID: parseInt(prev.id) }]
      } : null);
    } catch (e) {
      console.error("Failed to like/dislike:", e);
    }
  };
  
  const handleReport = async () => {
    if (!token || !postDetails) return;
  
    if (!reportReason.trim()) {
      alert("Please enter a reason for reporting.");
      return;
    }
  
    try {
      await reportPost(parseInt(postDetails.id), reportReason.trim(), token);
      alert("Post reported successfully.");
      setReportModalVisible(false);
      setReportReason('');
    } catch (e) {
      console.error("Failed to report:", e);
      alert("Failed to submit report. Try again later.");
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
              <TouchableOpacity
                onPress={() => {
                  handleAvatarPress();
                }}
              >
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

              </TouchableOpacity>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>{postDetails.title}</Text>
              {postDetails.category?.name && (
                <Text style={styles.categoryText}>
                  Category: {postDetails.category.name}
                </Text>
              )}

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

            <View style={{ flexDirection: 'row', gap: 20, marginTop: 8 }}>
              <TouchableOpacity disabled={liked === true}  onPress={() => handleLike(true)}>
              <Ionicons
                name="thumbs-up-outline"
                size={24}
                color={liked === true ? "#2ecc71" : "#ccc"}
              />
              </TouchableOpacity>
              <TouchableOpacity disabled={liked === false}  onPress={() => handleLike(false)}>
              <Ionicons
                name="thumbs-down-outline"
                size={24}
                color={liked === false ? "#e74c3c" : "#ccc"}
              />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setReportModalVisible(true)}>
                <Ionicons name="warning-outline" size={24} color="#f0ad4e" />
              </TouchableOpacity>
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
              messages={postDetails?.messages || ['']}
              callback={(response) => {
                setPostDetails((prevDetails) => ({
                  ...prevDetails!,
                  messages: [...(prevDetails?.messages || []), response],
                }));
              }}
              postID={parseInt(postDetails.id)}
              showSendMessage={user?.id !== postDetails?.sender?.id}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Handshakes</Text>
            { displayedHandshakes && displayedHandshakes.length > 0 ? ( // HACK: sometimes you need to compare stuff twice I guess
            <ScrollView style={styles.handshakesContainer}>
              {displayedHandshakes && displayedHandshakes.length > 0 ? (
                displayedHandshakes?.map((handshake, index) => (
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
              ))
              ): (
              <View>
                <Text style={styles.errorMessage}>No handshakes yet</Text>
              </View>
              )}
            </ScrollView>)
            : (
              <View>
                <Text style={styles.errorMessage}>No handshakes yet</Text>
              </View>
            )}

            {(user?.id !== postDetails?.sender?.id && !displayedHandshakes?.map(h => h.sender?.id).includes(user?.id)) && ( //TODO: Check for length and all 3 cases
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
            )}

            {(displayedHandshakes?.length && displayedHandshakes.length > 2 && !showAllHandshakes) ? (
              <TouchableOpacity
                onPress={() => setShowAllHandshakes(true)}
                style={styles.showMoreButton}
              >
                <Text style={styles.showMoreText}>Show more handshakes</Text>
              </TouchableOpacity>
            ): ""}
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
          initialMessage="Hello! I've created a handshake for your post. Let's coordinate the details."
          onMessageSent={handleMessageSent}
        />
      )}
      <Modal
        visible={reportModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Post</Text>
            <Text style={{ marginBottom: 10 }}>Why are you reporting this post?</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter reason..."
              multiline
              value={reportReason}
              onChangeText={setReportReason}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} style={[styles.modalButton, { backgroundColor: '#ccc' }]}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReport} style={styles.modalButton}>
                <Text style={{ color: 'white' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  categoryText: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalButton: {
    padding: 10,
    backgroundColor: "#4a90e2",
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  input: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    textAlignVertical: "top",
  },  
});
