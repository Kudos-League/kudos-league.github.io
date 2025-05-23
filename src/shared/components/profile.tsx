import { useEffect, useState } from "react";
import { View, Text, Button, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useForm } from "react-hook-form";
import { launchImageLibrary } from "react-native-image-picker";
import { Tooltip } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";
import { Feat, HandshakeDTO, PostDTO, CreateRewardOfferDTO, ProfileFormValues, EventDTO } from "shared/api/types";
import Chat from "./messages/Chat";
import { useAuth } from "shared/hooks/useAuth";
import { getAvatarURL, getEndpointUrl } from "shared/api/config";
// import { createDMChannel, createRewardOffer, updateHandshake } from "shared/api/actions";
// import { getEndpointUrl } from "shared/api/config";
import { addTagToUser, createDMChannel, createRewardOffer, getUserDetails, getUserSettings, updateHandshake } from "shared/api/actions";
import { UserDTO } from "index";
import EditProfile from "./edit-profile";
import Map from "./Map";
import NavigationService from "../../navigation";

type NavigationProps = StackNavigationProp<RootStackParamList, "Post">;

type ProfileProps = {
  user: UserDTO;
  handleUpdate: (data: FormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  posts: PostDTO[];
  handshakes: HandshakeDTO[];
  events: EventDTO[];
};

interface PostCardProps {
    post: PostDTO;
}

const PostCard = ({ post }: PostCardProps) => {
    const navigation = useNavigation<NavigationProps>();
    
    const handlePostPress = () => {
        navigation.navigate("Post", { id: post.id.toString() });
    };
    
    return (
        <TouchableOpacity onPress={handlePostPress}>
            <View style={styles.postCard}>
                <View style={styles.postContent}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    <View style={[styles.tagPill, styles.tagDark]}>
                        <Text style={styles.tagText}>{post.type === 'gift' ? 'Gift' : 'ReQuest'}</Text>
                    </View>
                </View>
                {post.images && post.images.length > 0 ? (
                    <Image source={{ uri: post.images[0] }} style={styles.postImage} />
                ) : (
                    <Text style ={styles.noImageText}>{post.body}</Text>
                )}
                {post.isActive ? (
                    <Text style={styles.kudosText}>Active</Text>
                ): (
                    <Text style={styles.kudosText}>{post.kudos} Kudos</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const Logger = (message: any) => {
    console.log(message);
    return null
}

const HandshakeCard = ({ handshake, userId, token }: { handshake: HandshakeDTO; userId: string; token: string }) => {
  const navigation = useNavigation<NavigationProps>();
  const isSender = handshake.senderID.toString() === userId;
  const [kudosValue, setKudosValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(handshake.status);
  const [processing, setProcessing] = useState(false);
  const [senderUser, setSenderUser] = useState<UserDTO | null>(null);
  const [receiverUser, setReceiverUser] = useState<UserDTO | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      setLoadingUsers(true);
      try {
        // Fetch sender user data
        const senderResponse = await getUserDetails(handshake.senderID.toString(), token);
        setSenderUser(senderResponse);
        
        // Fetch receiver user data
        const receiverResponse = await getUserDetails(handshake.receiverID.toString(), token);
        setReceiverUser(receiverResponse);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUserData();
  }, [handshake.senderID, handshake.receiverID, token]);
  
  const handlePostPress = () => {
    navigation.navigate("Post", { id: handshake.postID.toString() });
  };
  
  const handleAcceptHandshake = async () => {
    if (status !== 'new' || processing) return;
    
    setProcessing(true);
    
    try {
      await updateHandshake(
        handshake.id,
        { status: 'accepted' },
        token || ""
      );
      
      setStatus('accepted');
      Alert.alert("Success", "Handshake accepted successfully");
    } catch (error) {
      console.error("Error accepting handshake:", error);
      Alert.alert("Error", "Failed to accept handshake. Please try again.");
    } finally {
      setProcessing(false);
    }
  };
  
  const handleSubmitKudos = async () => {
    if (!kudosValue || isNaN(Number(kudosValue))) {
      setError("Please enter a valid kudos value");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Create a reward offer with the kudos value
      const rewardOfferData: CreateRewardOfferDTO = {
        postID: handshake.postID,
        amount: Number(kudosValue),
        currency: "kudos",
        kudos: Number(kudosValue)
      };
      
      await createRewardOffer(rewardOfferData, token);
      
      // Update handshake status to completed
      await updateHandshake(
        handshake.id,
        { status: 'completed' },
        token || ""
      );
      
      // Update local status
      setStatus('completed');
      
      // Reset the input field
      setKudosValue("");
      
      // Show success message
      Alert.alert("Success", "Kudos value submitted successfully");
    } catch (error) {
      console.error("Error submitting kudos:", error);
      setError("Failed to submit kudos. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Button style and text based on status
  const getButtonStyle = () => {
    switch (status) {
      case 'new':
        return processing ? styles.pendingButton : styles.acceptButton;
      case 'accepted':
        return styles.acceptedButton;
      case 'completed':
        return styles.completedButton;
      default:
        return styles.acceptButton;
    }
  };
  
  const getButtonText = () => {
    if (processing) return "Pending...";
    
    switch (status) {
      case 'new':
        return "Accept";
      case 'accepted':
        return "Accepted";
      case 'completed':
        return "Completed";
      default:
        return "Accept";
    }
  };
  
  return (
    <View style={styles.handshakeCard}>
      <View style={styles.handshakeContent}>
        <View style={styles.handshakeHeader}>
          <Text style={styles.handshakeTitle}>
            {isSender ? 'You sent to' : 'Received from'}
          </Text>
          <View style={[
            styles.statusPillStyle,
            status === 'new' ? styles.statusNew : 
            status === 'accepted' ? styles.statusAccepted : 
            styles.statusCompleted
          ]}>
            <Text style={styles.statusTextStyle}>{status}</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={handlePostPress}>
          <Text style={styles.postReference}>
            Post Title: {handshake.post.title}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.userReference}>
          {loadingUsers ? (
            <ActivityIndicator size="small" color="#4a90e2" />
          ) : isSender
            ? `To: ${receiverUser?.username || 'Loading...'}`
            : `From: ${senderUser?.username || 'Loading...'}`}
        </Text>
        
        <Text style={styles.dateText}>
          Created: {new Date(handshake.createdAt).toLocaleDateString()}
        </Text>
        
        {/* Button to accept handshake (only show if you're the receiver and status is 'new') */}
        {!isSender && (
          <TouchableOpacity 
            style={[styles.handshakeButton, getButtonStyle()]}
            onPress={handleAcceptHandshake}
            disabled={status !== 'new' || processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>{getButtonText()}</Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Show kudos input for accepted handshakes */}
        {status === 'accepted' && ((handshake.post.type === 'request' && isSender) || (handshake.post.type === 'gift' && handshake.senderID.toString() === userId)) && (
          <View style={styles.kudosInputContainer}>
            <Text style={styles.kudosInputLabel}>Assign Kudos Value:</Text>
            <TextInput
              style={styles.kudosInput}
              value={kudosValue}
              onChangeText={setKudosValue}
              placeholder="Enter kudos value"
              keyboardType="numeric"
            />
            <TouchableOpacity 
              style={styles.kudosSubmitButton}
              onPress={handleSubmitKudos}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.kudosSubmitText}>Submit</Text>
              )}
            </TouchableOpacity>
            
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}
      </View>
    </View>
  );
};

const additionalStyles = {

};

export default function Profile({
  user: targetUser,
  handleUpdate,
  loading,
  error,
  posts = [],
  handshakes = [],
  events = []
}: ProfileProps) {

  const { user: loggedInUser, isLoggedIn, token } = useAuth();
  const [editProfile, setEditProfile] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [userSettings, setUserSettings] = useState<any | null>(null);
  const navigator = useNavigation<any>();
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!token) return;
      try {
        const settings = await getUserSettings(token);
        setUserSettings(settings);
        console.log("User settings:", settings);
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };
    fetchUserSettings();
  }, [targetUser.id, token]);

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      email: targetUser.email,
      avatar: [],
      location: targetUser.location || undefined
    },
  });

  const sameUser = targetUser?.id === loggedInUser?.id; // Determines if the edit profile should be allowed

  const onSubmit = async (data: ProfileFormValues) => {
    const formData = new FormData();
    let hasChanges = false;
    let changes: string[] = [];
  
    if (data.email !== targetUser.email) {
      formData.append("email", data.email);
      hasChanges = true;
      changes.push("Email updated");
    }

    if (data.tags && data.tags.length > 0) {
      try {
        const tagArray = data.tags.split(",").map((tag) => tag.trim());
        
        // Add each tag individually using the dedicated endpoint
        for (const tagName of tagArray) {
          await addTagToUser(
            tagName, // Send the tag as a CreateTagDTO object with a name property
            "me",
            token || ""
          );
        }
        
        hasChanges = true;
        changes.push("Tags updated");
      } catch (error) {
        console.error("Error adding tags:", error);
        // Handle error as appropriate
      }
    }
  
    if (data.avatar.length > 0) {
      const avatarFile = data.avatar[0];
      if (avatarFile.uri !== targetUser.avatar) {
        const response = await fetch(avatarFile.uri);
        const blob = await response.blob();
        formData.append("avatar", blob, "avatar.jpg");
        hasChanges = true;
        changes.push("Profile picture uploaded");
      }
    } else if (data.avatarUrl && data.avatarUrl !== targetUser.avatar) {
      formData.append("avatar", data.avatarUrl);
      hasChanges = true;
      changes.push("Profile picture updated");
    }

    if (
      data.location &&
      JSON.stringify(data.location) !== JSON.stringify(targetUser.location)
    ) {
      formData.append("location", JSON.stringify(data.location));
      hasChanges = true;
      changes.push("Location updated");
    }    
  
    if (!hasChanges) {
      setFeedbackMessage("No changes detected");
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
      return;
    }
  
    try {
      await handleUpdate(formData);
      setFeedbackMessage(changes.join(", ") + " successfully!");
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        setEditProfile(false);
      }, 2000);
    } catch (err) {
      setFeedbackMessage("Update failed. Please try again.");
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    }
  };

  const getUserTitle = () => {
      if (targetUser.kudos > 10000) {
          return "Questing Knight";
      } else if (targetUser.kudos > 5000) {
          return "Pro";
      } else {
          return "Novice";
      }
  };

  const getUserFeats = (): Feat[] => {
      return [
          {
              location: "Denver",
              date: new Date(2023, 11, 1), // December
              placement: 2,
              description: "Most Kudos in Dec"
          },
          {
              location: "Denver",
              date: new Date(2023, 4, 1), // May
              placement: 10,
              description: "Most Kudos in May"
          },
          {
              location: "Denver",
              date: new Date(2024, 0, 1), // 2024
              placement: 18,
              description: "Most Kudos in 2024"
          },
      ];
  };

  const startDMChat = async () => {
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      // Show loading state
      // setLoading(true);
      console.log("loading channel");
      
      if (loggedInUser) {
        // First create the channel
        const channel = await createDMChannel(loggedInUser.id, targetUser.id, token || "");
        
        // Then navigate with complete channel data
        NavigationService.navigateToChat();
      }
    } catch (error) {
      console.error("Error creating DM channel:", error);
    } finally {
      // setLoading(false);
      console.log("Channel creation ended");
    }
  };

  if (!targetUser) {
    return <Text>Loading...</Text>
  }

  const actionButtons = (
    <View style={styles.actionButtons}>
        {/* <TouchableOpacity style={styles.actionButton}>
            <Text>👤</Text>
        </TouchableOpacity> */}
        {!sameUser && isLoggedIn && (
            <TouchableOpacity style={styles.actionButton} onPress={() => startDMChat()}>
                <Text>💬</Text>
            </TouchableOpacity>
        )}
        {/* <TouchableOpacity style={styles.actionButton}>
            <Text>📊</Text>
        </TouchableOpacity> */}
        {sameUser && (
            <TouchableOpacity style={styles.actionButton} onPress={() => setEditProfile(!editProfile)}>
                <Text>⚙️</Text>
            </TouchableOpacity>
        )}
    </View>
  );

  if (editProfile) {
    return (
      <EditProfile form={form} targetUser={targetUser} setEditProfile={setEditProfile} showFeedback={showFeedback} setFeedbackMessage={setFeedbackMessage} feedbackMessage={feedbackMessage} setShowFeedback={setShowFeedback} loading={loading} onSubmit={onSubmit} error={error}/>
    )
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {targetUser.avatar && <Image source={{ uri: targetUser.avatar }} style={styles.profilePicture} />}
        <Text style={styles.userTitleStyle}>{getUserTitle()}</Text>
        <Text style={styles.userName}>{targetUser.username}</Text>
        <Text style={styles.userKudos}>{targetUser.kudos.toLocaleString()} Kudos</Text>

        {/* Badges Section */}
        {targetUser.badges && targetUser.badges.length > 0 && (
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.badgesContainer}>
                {targetUser.badges.map((badge, index) => (
                    <Tooltip key={index} title={badge.name} enterTouchDelay={300} leaveTouchDelay={150}>
                        <View style={styles.badgeItem}>
                            <Image source={{ uri: `${getEndpointUrl()}${badge.image}` }} style={styles.badgeImage} />
                        </View>
                    </Tooltip>
                ))}
            </ScrollView>
        )}
          
        {/* Action Buttons */}
        {actionButtons}
        
        {/* User Description */}
        <Text style={styles.userDescription}>{`${userSettings?.dataValues.about ? userSettings?.dataValues.about : "No bio available"}`}</Text>
        
        {/* User Location */}
        {(targetUser as any).location && (
          <View style={styles.locationContainer}>
            <Text style={styles.locationTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <Map
                showAddressBar={false}
                regionID={targetUser.location?.regionID}
                exactLocation={false}
                height={150}
              />
            </View>
          </View>
        )}
        
        {/* Interest Tags */}
        <View style={styles.interestContainer}>
            {targetUser.tags?.map((tag, index) => (
                <View key={index} style={styles.interestPill}>
                    <Text style={styles.interestText}>{tag.name}</Text>
                </View>
            ))}
        </View>
    </View>
      
      {/* Achievements Section */}
      <View style={styles.achievementsContainer}>
          {getUserFeats().map((feat, index) => (
              <View key={index} style={styles.achievementCard}>
                  <Text style={styles.achievementLocation}>{feat.location}</Text>
                  <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>
                          {feat.placement === 2 ? "2nd" : 
                            feat.placement === 10 ? "10th" : `${feat.placement}`}
                      </Text>
                  </View>
                  <Text style={styles.achievementDescription}>{feat.description}</Text>
              </View>
          ))}
      </View>
      
      {/* Posts Filter */}
      <View style={styles.filterContainer}>
          <TouchableOpacity 
              style={[styles.filterOption, filter === 'all' && styles.filterSelected]}
              onPress={() => setFilter('all')}
          >
              <Text style={styles.filterText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.filterOption, filter === 'gift' && styles.filterSelected]}
              onPress={() => setFilter('gift')}
          >
              <Text style={styles.filterText}>Gifts</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.filterOption, filter === 'request' && styles.filterSelected]}
              onPress={() => setFilter('request')}
          >
              <Text style={styles.filterText}>ReQuests</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.filterOption, filter === 'handshakes' && styles.filterSelected]}
              onPress={() => {setFilter('handshakes')}}
          >
              <Text style={styles.filterText}>Handshakes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.filterOption, filter === 'events' && styles.filterSelected]}
              onPress={() => {setFilter('events')}}
          >
              <Text style={styles.filterText}>Events</Text>
          </TouchableOpacity>
      </View>
      
      {/* Posts Section */}
      {/*TODO: HORRIBLE way of handling this, find a better strategy, maybe a function can deal with it */}
      {filter !== 'handshakes' && filter !== 'events' ? (
      <View style={styles.postsContainer}>
          {posts
              .filter(post => filter === 'all' || post.type === filter)
              .map(post => (
                  <PostCard key={post.id} post={post} />
              ))
          }
      </View>
      ): filter === 'handshakes' && handshakes.length > 0 ? (
      <View style={styles.postsContainer}>
        <Text style={styles.sectionTitle}>Sent Handshakes</Text>
        {
          handshakes.filter(h => h.senderID.toString() === targetUser.id.toString())
          .map(handshake => (
              <HandshakeCard 
                key={handshake.id} 
                handshake={handshake} 
                userId={targetUser.id.toString()} 
                token={token || ""}
              />
          ))
        }
        
        <Text style={styles.sectionTitle}>Received Handshakes</Text>
        {
          handshakes.filter(h => h.receiverID.toString() === targetUser.id.toString())
            .map(handshake => (
                <HandshakeCard 
                  key={handshake.id} 
                  handshake={handshake} 
                  userId={targetUser.id.toString()} 
                  token={token || ""}
                />
            ))
        }
        
        {handshakes.length === 0 && (
            <Text style={styles.emptyMessage}>No handshakes yet</Text>
        )}
      </View>
      ) : filter !== 'events' ? (
        <Text style={styles.emptyMessage}>No handshakes available</Text>
      ) : events.length > 0 ?(
        <View style={styles.postsContainer}>
          {events.map(event => (
            <TouchableOpacity key={event.id} style={styles.postCard} onPress={() => NavigationService.navigateToEvent(event.id.toString())}>
              <Text style={styles.postTitle}>{event.title}</Text>
              <Text style={styles.postContent}>{event.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyMessage}>No events available</Text>
      )}
      
      {/* Feedback Message */}

      {/* {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kudosInputContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  kudosInputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  kudosInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  kudosSubmitButton: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  kudosSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 5,
    fontSize: 12,
  },
  statusPillStyle: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusNew: {
    backgroundColor: '#f39c12',
  },
  statusAccepted: {
    backgroundColor: '#2ecc71',
  },
  statusCompleted: {
    backgroundColor: '#3498db',
  },
  statusTextStyle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userTitleStyle: {
      fontSize: 14,
      color: "#666",
      marginBottom: 5,
  },
  actionButtons: {
      flexDirection: "row",
      marginBottom: 20,
      width: "80%",
      justifyContent: "center",
  },
  actionButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: "#E2E8F0",
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 5,
  },
  actionIcon: {
      width: 24,
      height: 24,
  },
  userDescription: {
      fontSize: 16,
      color: "#4A5568",
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 20,
  },
  interestContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 20,
  },
  interestPill: {
      backgroundColor: "#E6FFEA",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      margin: 5,
  },
  interestText: {
      color: "#38A169",
      fontSize: 14,
  },
  achievementsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      marginBottom: 20,
  },
  achievementCard: {
      width: '30%',
      backgroundColor: "#EBF8FF",
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
      position: "relative",
  },
  achievementLocation: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 5,
  },
  rankBadge: {
      position: "absolute",
      top: -10,
      right: -10,
      backgroundColor: "#000",
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: "center",
      alignItems: "center",
  },
  rankText: {
      color: "#FFF",
      fontWeight: "bold",
      fontSize: 12,
  },
  achievementDescription: {
      fontSize: 12,
      textAlign: "center",
      color: "#4A5568",
  },
  filterContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 15,
  },
  filterOption: {
      paddingHorizontal: 20,
      paddingVertical: 10,
  },
  filterSelected: {
      borderBottomWidth: 2,
      borderBottomColor: "#3182CE",
  },
  filterText: {
      fontSize: 16,
      color: "#4A5568",
  },
  postsContainer: {
      paddingHorizontal: 15,
      marginBottom: 30,
  },
  postCard: {
      backgroundColor: "#FFF",
      borderRadius: 10,
      marginBottom: 15,
      padding: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      position: "relative",
  },
  postContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
  },
  postTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#2D3748",
      flex: 1,
  },
  tagPill: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 15,
  },
  tagDark: {
      backgroundColor: "#2D3748",
  },
  tagText: {
      color: "#FFF",
      fontSize: 12,
      fontWeight: "bold",
  },
  postImage: {
      width: "100%",
      height: 150,
      borderRadius: 8,
      marginBottom: 20,
  },
  kudosText: {
      position: "absolute",
      bottom: 10,
      right: 10,
      fontSize: 14,
      color: "#718096",
      marginTop: 10,
  },
  activeLabel: {
      position: "absolute",
      top: 10,
      right: 10,
      fontSize: 12,
      color: "#38A169",
  },
  noImageText: {
      fontSize: 16,
      color: "#718096",
      marginTop: 10,
  },
  badgesContainer: {
      flexDirection: "row",
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
      backgroundColor: "#F3F4F6",
      borderRadius: 10,
  },
  badgeItem: {
      marginRight: 10,
      alignItems: "center",
  },
  badgeImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 10,
    marginBottom: 15,
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#718096',
    marginTop: 20,
    marginBottom: 20,
  },
  handshakeCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  handshakeContent: {
    width: '100%',
  },
  handshakeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  handshakeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  postReference: {
    fontSize: 15,
    color: '#4A5568',
    marginBottom: 5,
  },
  userReference: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  handshakeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#4a90e2',
  },
  pendingButton: {
    backgroundColor: '#999',
  },
  acceptedButton: {
    backgroundColor: '#999',
  },
  completedButton: {
    backgroundColor: '#2ecc71',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  container: {
      flex: 1,
      backgroundColor: "#f8f9fa",
  },
  profileHeader: {
      alignItems: "center",
      padding: 20,
      position: "relative",
  },
  profilePicture: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 5,
  },
  userName: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#2D3748",
      marginBottom: 5,
  },
  userKudos: {
      fontSize: 18,
      color: "#718096",
      marginBottom: 15,
  },
  // Location styles
  locationContainer: {
    marginTop: 15,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A5568',
    marginBottom: 10,
  },
  mapContainer: {
    width: '90%',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});
