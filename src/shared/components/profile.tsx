import { useEffect, useState } from "react";
import { View, Text, Button, TextInput, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useForm } from "react-hook-form";
import { launchImageLibrary } from "react-native-image-picker";
import { Tooltip } from "react-native-paper";
import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";
import { Feat, HandshakeDTO, PostDTO } from "shared/api/types";
import Chat from "./messages/Chat";
import { useAuth } from "shared/hooks/useAuth";
import { getEndpointUrl } from "shared/api/config";
import { createDMChannel } from "shared/api/actions";
import { UserDTO } from "index";

type ProfileFormValues = {
  email: string;
  avatar: File[];
  avatarUrl?: string;
};

type ProfileProps = {
  user: UserDTO;
  handleUpdate: (data: FormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  posts: PostDTO[];
  handshakes: HandshakeDTO[];
};

interface PostCardProps {
    post: PostDTO;
}

const PostCard = ({ post }: PostCardProps) => {
    return (
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
    );
};



export default function Profile({
  user: targetUser,
  handleUpdate,
  loading,
  error,
  posts,
  handshakes
}: ProfileProps) {
  const { user: loggedInUser, isLoggedIn, token } = useAuth();
  const [editProfile, setEditProfile] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      email: targetUser.email,
      avatar: [],
    },
  });

  const sameUser = targetUser?.id === loggedInUser?.id; // Determines if the edit profile should be allowed

  const onSubmit = async (data: ProfileFormValues) => {
    const formData = new FormData();
    let hasChanges = false;
    let changes = [];
  
    if (data.email !== targetUser.email) {
      formData.append("email", data.email);
      hasChanges = true;
      changes.push("Email updated");
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

  const pickAvatar = () => {
    const options = {
      mediaType: "photo",
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7,
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorMessage) {
        console.error("ImagePicker Error:", response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0].uri;
        form.setValue("avatar", [{ uri: selectedImage }]);
        setFeedbackMessage("Image selected");
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    });
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
      if (loggedInUser) 
        await createDMChannel(Number.parseInt(loggedInUser.id), Number.parseInt(targetUser.id), token);
      setIsChatOpen(true);
    } catch (error) {
      console.error("Error creating DM channel:", error);
    }
  };

  if (!targetUser) {
    return <Text>Loading...</Text>
  }

  const actionButtons = (
    <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
            <Text>👤</Text>
        </TouchableOpacity>
        {!sameUser && isLoggedIn && (
            <TouchableOpacity style={styles.actionButton} onPress={() => startDMChat()}>
                <Text>💬</Text>
            </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
            <Text>📊</Text>
        </TouchableOpacity>
        {sameUser && (
            <TouchableOpacity style={styles.actionButton} onPress={() => setEditProfile(!editProfile)}>
                <Text>⚙️</Text>
            </TouchableOpacity>
        )}
    </View>
  );

  if (editProfile) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setEditProfile(false)}
          >
            <Text style={styles.backButtonText}>← Back to Profile</Text>
          </TouchableOpacity>
          
          <Text style={styles.editTitle}>Edit Profile</Text>
          
          {targetUser.avatar && 
            <Image 
              source={{ uri: form.watch("avatar")?.length > 0 
                ? form.watch("avatar")[0].uri 
                : targetUser.avatar }} 
              style={styles.profilePicture} 
            />
          }
          
          <Text style={styles.userName}>{targetUser.username}</Text>
          <Text style={styles.userKudos}>{targetUser.kudos.toLocaleString()} Kudos</Text>
          
          {/* Feedback message */}
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.editFormContainer}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <Input
              name="email"
              form={form}
              registerOptions={{ required: true }}
              placeholder="Enter your email"
            />
          </View>
          
          {/* Avatar Upload & Preview */}
          <View style={styles.avatarEditContainer}>
            <Text style={styles.inputLabel}>Profile Picture</Text>
            
            {/* Upload Button */}
            <TouchableOpacity style={styles.uploadButton} onPress={pickAvatar}>
              <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <Text style={styles.orText}>OR</Text>
            
            {/* URL-based Avatar Input */}
            <Input
              name="avatarUrl"
              form={form}
              placeholder="Paste an image URL"
            />
          </View>
          
          {/* Update Profile Button */}
          <TouchableOpacity
            style={styles.updateButton}
            onPress={form.handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>
              {loading ? "Updating..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
          
          {error && <Text style={styles.errorText}>{error}</Text>}
          
          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setEditProfile(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }  
  
  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        {targetUser.avatar && <Image source={{ uri: targetUser.avatar }} style={styles.profilePicture} />}
        <Text style={styles.userTitle}>{getUserTitle()}</Text>
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
        {/* TODO: Not a real thing yet */}
        <Text style={styles.userDescription}>{(targetUser as any).description || 'Test Description'}</Text>
        
        {/* Interest Tags */}
        <View style={styles.interestContainer}>
        {/* TODO: Not a real thing yet */}
            {(targetUser as any).interests?.map((interest, index) => (
                <View key={index} style={styles.interestPill}>
                    <Text style={styles.interestText}>{interest}</Text>
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
      </View>
      
      {/* Posts Section */}
      {filter !== 'handshakes' ? (
      <View style={styles.postsContainer}>
          {posts
              .filter(post => filter === 'all' || post.type === filter)
              .map(post => (
                  <PostCard key={post.id} post={post} />
              ))
          }
      </View>
      ): (
        <View style={styles.postsContainer}>
          {handshakes.map(handshake => (
            // <HandshakeCard key={handshake.id} handshake={handshake} /> //TODO
            <></>
          ))
          }
        </View>
      )}

      {isChatOpen && <Chat onClose={() => setIsChatOpen(false)} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  userTitle: {
      fontSize: 14,
      color: "#666",
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
  actionButtons: {
      flexDirection: "row",
      marginBottom: 20,
      width: "80%",
      justifyContent: "space-between",
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
  // Edit profile styles
  backButton: {
      position: "absolute",
      top: 10,
      left: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: "#E2E8F0",
      borderRadius: 20,
      zIndex: 1,
  },
  backButtonText: {
      color: "#2D3748",
      fontWeight: "600",
  },
  editTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#2D3748",
      marginBottom: 20,
  },
  editFormContainer: {
      backgroundColor: "#fff",
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 25,
      marginHorizontal: 15,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
  },
  inputContainer: {
      marginBottom: 20,
  },
  inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: "#4A5568",
      marginBottom: 8,
  },
  avatarEditContainer: {
      marginBottom: 25,
  },
  uploadButton: {
      backgroundColor: "#3182CE",
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
      marginBottom: 15,
  },
  uploadButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
  },
  orText: {
      fontSize: 16,
      color: "#718096",
      textAlign: "center",
      marginVertical: 10,
  },
  updateButton: {
      backgroundColor: "#38A169",
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 15,
  },
  updateButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "bold",
  },
  cancelButton: {
      borderWidth: 1,
      borderColor: "#E53E3E",
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: "center",
  },
  cancelButtonText: {
      color: "#E53E3E",
      fontSize: 16,
      fontWeight: "600",
  },
  errorText: {
      color: "#E53E3E",
      marginVertical: 10,
      textAlign: "center",
  },
  feedbackContainer: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: "#C6F6D5",
      borderRadius: 20,
      marginTop: 10,
  },
  feedbackText: {
      color: "#2F855A",
      fontWeight: "600",
  },
});