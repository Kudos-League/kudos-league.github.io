import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import AvatarComponent from "../Avatar";
import Tags from "../Tags";
import { getAvatarURL, getEndpointUrl } from "shared/api/config";

type RootStackParamList = {
  Home: undefined;
  Post: { id: string };
  UserProfile: { id: string };
};

type NavigationProps = StackNavigationProp<RootStackParamList, "UserProfile">;

type Post = {
  id: string;
  title: string;
  body: string;
  type: string;
  images?: string[];
  tags?: Array<{ id: string; name: string }>;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
    kudos: number;
  };
  rewardOffer?: {
    kudosFinal: number;
  };
  onPress: () => void;
};

export default function PostCard(props: Post) {
  const navigation = useNavigation<NavigationProps>();

  const handleAvatarPress = () => {
    if (props.sender?.id) {
      navigation.navigate("UserProfile", { id: props.sender.id });
    }
  };

  // The "fake" property is to handle the test data if the db seeding doesn't work
  const image = (props as any).fake ? (props.images?.[0] || '') : getEndpointUrl() + (props.images?.[0] || '');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cardContainer} onPress={props.onPress}>
        <View style={styles.contentContainer}>
          <View style={styles.mainContent}>
            <Text style={styles.title}>{props.title}</Text>
            

            <TouchableOpacity onPress={handleAvatarPress}>
              <View style={styles.userInfoContainer}>
                  {props.sender && (
                    <AvatarComponent
                      username={props.sender.username}
                      avatar={props.sender.avatar}
                      sx={{ width: 32, height: 32 }}
                    />
                  )}
                <View>
                  <Text style={styles.username}>{props.sender?.username}</Text>
                  <Text style={styles.kudos}>{props.sender?.kudos|| 0} Kudos</Text>
                </View>

              </View>
            </TouchableOpacity>
          </View>
          
          {props.images && props.images.length > 0 ? (
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.bodyTextContainer}>
              <Text style={styles.bodyText} numberOfLines={3}>{props.body}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "#ddd",
    borderStyle: "solid",
    borderWidth: 1,
    borderRadius: 8,
  },
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  contentContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
    marginRight: 12,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginLeft: 8,
  },
  kudos: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  bodyTextContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    justifyContent: "center",
    padding: 8,
  },
  bodyText: {
    fontSize: 12,
    color: "#666",
  }
});