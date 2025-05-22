import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import Input from "./forms/input";
import { launchImageLibrary } from "react-native-image-picker";
import Map from './Map';
import useLocation from "shared/hooks/useLocation";
import AvatarComponent from "./Avatar";

interface EditProfileProps {
  form: any;
  targetUser: any;
  setEditProfile: (show: boolean) => void;
  showFeedback: boolean;
  feedbackMessage: string;
  setFeedbackMessage: (message: string) => void;
  setShowFeedback: (show: boolean) => void;
  loading: boolean;
  onSubmit: (data: any) => void;
  error: string | null;
}

const EditProfile = ({ form, 
    targetUser, 
    setEditProfile, 
    showFeedback, 
    feedbackMessage,
    setFeedbackMessage, 
    setShowFeedback,
    loading,
    onSubmit,
    error
 }: EditProfileProps) => {
  const { location, setLocation } = useLocation();
  const [showMap, setShowMap] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pickAvatar = () => {
    const options = {
      mediaType: 'photo' as const,
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7 as const,
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorMessage) {
        console.error("ImagePicker Error:", response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        form.setValue("avatar", [selectedImage]);
        // If we picked a new image, clear any avatarUrl
        form.setValue("avatarUrl", "");
        
        setFeedbackMessage("Image selected");
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    });
  };

  // Handle form submission using the parent component's onSubmit handler
  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      
      // Feedback will be handled by the parent component
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setFeedbackMessage(error.message || "Failed to update profile");
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine what avatar URL to display
  const getAvatarUrl = () => {
    if (form.watch("avatar")?.length > 0) {
      return form.watch("avatar")[0].uri;
    } else if (form.watch("avatarUrl")) {
      return form.watch("avatarUrl");
    } else if (targetUser.avatar) {
      return targetUser.avatar;
    }
    return null;
  };

  return (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setEditProfile(false)}
        >
          <Text style={styles.backButtonText}>← Back to Profile</Text>
        </TouchableOpacity>
        
        <Text style={styles.editTitle}>Edit Profile</Text>

        <AvatarComponent
          username={targetUser.username}
          avatar={targetUser.avatar}
          style={styles.profilePicture}
        />
        
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
            label="Email"
          />
        </View>
        
        {/* Description Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <Input
            name="description"
            form={form}
            placeholder="Enter a description"
            label="Description"
            multiline={true}
          />
          <Text style={styles.inputHelp}>
            Share a brief bio about yourself that others will see on your profile
          </Text>
        </View>

        {/* Tags Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tags</Text>
          <Input
            name="tags"
            form={form}
            placeholder="Enter tags semarated by commas" 
            label="tags"
          />
          <Text style={styles.inputHelp}>
            Add tags to your profile so we can know about your interests. Use commas to separate multiple tags.
          </Text>
        </View>

        
        {/* Avatar Upload & Preview */}
        <View style={styles.avatarEditContainer}>
          {/* Avatar Upload & Preview */}
          <View style={globalStyles.avatarEditContainer}>
            <Text style={globalStyles.inputLabel}>Profile Picture</Text>
            
            {/* Upload Button */}
            <TouchableOpacity style={globalStyles.uploadButton} onPress={pickAvatar}>
              <Text style={globalStyles.uploadButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <Text style={globalStyles.orText}>OR</Text>
            
            {/* URL-based Avatar Input */}
            <Input
              name="avatarUrl"
              form={form}
              placeholder="Paste an image URL"
              label="Paste an Image URL"
            />
          </View>

          <Text style={globalStyles.inputTitle}>
              Location 
            </Text>
            <View style={{ alignItems: 'center' }}>
              <Map
                showAddressBar={true}
                exactLocation={false}
                regionID={targetUser.location?.regionID}
                coordinates={location}
                width={300}
                height={300}
                onLocationChange={(data) => {
                  if (data.coordinates) {
                    setLocation(data.coordinates);
                    form.setValue("location", { ... data.coordinates, name: data.name });
                  }
                }}
              />
            </View>
          
          <Text style={styles.orText}>OR</Text>
          
          {/* URL-based Avatar Input */}
          <Input
            name="avatarUrl"
            form={form}
            placeholder="Paste an image URL"
            label="Paste an Image URL"
          />
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Update Profile Button */}
          <TouchableOpacity
            style={styles.updateButton}
            onPress={form.handleSubmit(handleFormSubmit)}
            disabled={loading || isSubmitting}
          >
            <Text style={styles.updateButtonText}>
              {isSubmitting ? "Updating..." : "Save Changes"}
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
      </View>
    </ScrollView>
  );
};

// Styles remain the same as your original component
const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  profileHeader: {
    alignItems: "center",
    padding: 20,
    position: "relative",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
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
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  inputHelp: {
    fontSize: 12,
    color: "#718096",
    marginTop: 4,
    fontStyle: "italic",
  },
  actionButtonsContainer: {
    marginTop: 10,
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
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  avatarEditContainer: {
    marginBottom: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
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
  errorText: {
    color: "#E53E3E",
    marginVertical: 10,
    textAlign: "center",
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
  // Map styles
  mapToggleButton: {
    backgroundColor: "#4299E1",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  mapToggleText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mapContainer: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  coordinatesText: {
    fontSize: 12,
    color: "#4A5568",
    textAlign: "center",
    marginTop: 5,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    position: "absolute",
    bottom: 5,
    alignSelf: "center",
  },
});

const globalStyles = StyleSheet.create({
  avatarEditContainer: {
    marginBottom: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A5568",
    marginBottom: 8,
  },
});

export default EditProfile;