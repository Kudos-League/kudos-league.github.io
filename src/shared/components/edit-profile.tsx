import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import globalStyles from "shared/styles";
import Input from "./forms/input";
import { launchImageLibrary } from "react-native-image-picker";

interface EditProfileProps {
    form: any;
    targetUser: any;
    setEditProfile: any;
    showFeedback: boolean;
    feedbackMessage: string;
    setFeedbackMessage: any;
    setShowFeedback: any;
    loading: boolean;
    onSubmit: any;
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
    return (
      <ScrollView style={globalStyles.profileContainer}>
        <View style={globalStyles.profileHeader}>
          {/* Back button */}
          <TouchableOpacity 
            style={globalStyles.backButton}
            onPress={() => setEditProfile(false)}
          >
            <Text style={globalStyles.backButtonText}>← Back to Profile</Text>
          </TouchableOpacity>
          
          <Text style={globalStyles.editTitle}>Edit Profile</Text>
          {targetUser.avatar && 
            <Image 
              source={{ uri: form.watch("avatar")?.length > 0 
                ? form.watch("avatar")[0].uri 
                : targetUser.avatar }} 
              style={globalStyles.profilePicture} 
            />
          }
          
          <Text style={globalStyles.userName}>{targetUser.username}</Text>
          <Text style={globalStyles.userKudos}>{targetUser.kudos.toLocaleString()} Kudos</Text>
          
          {/* Feedback message */}
          {showFeedback && (
            <View style={globalStyles.feedbackContainer}>
              <Text style={globalStyles.feedbackText}>{feedbackMessage}</Text>
            </View>
          )}
        </View>
        
        <View style={globalStyles.editFormContainer}>
          {/* Email Input */}
          <View style={globalStyles.inputContainer}>
            <Text style={globalStyles.inputLabel}>Email Address</Text>
            <Input
              name="email"
              form={form}
              registerOptions={{ required: true }}
              placeholder="Enter your email"
              label="Email"
            />
          </View>
          
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
          
          {/* Update Profile Button */}
          <TouchableOpacity
            style={globalStyles.updateButton}
            onPress={form.handleSubmit(onSubmit)}
            disabled={loading}
          >
            <Text style={globalStyles.updateButtonText}>
              {loading ? "Updating..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
          
          {error && <Text style={globalStyles.errorText}>{error}</Text>}
          
          {/* Cancel Button */}
          <TouchableOpacity
            style={globalStyles.cancelButton}
            onPress={() => setEditProfile(false)}
          >
            <Text style={globalStyles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
}

export default EditProfile;