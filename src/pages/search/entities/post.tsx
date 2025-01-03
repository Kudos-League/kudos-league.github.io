import { useRoute } from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const renderTags = (tags) =>
  tags.map((tag, index) => (
    <Text key={index} style={styles.tag}>
      {tag.name}
    </Text>
  ));

const renderList = (title, items, keyExtractor) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.length > 0 ? (
      items.map((item, index) => (
        <Text key={keyExtractor(item, index)}>{JSON.stringify(item)}</Text>
      ))
    ) : (
      <Text>No items</Text>
    )}
  </View>
);

const Post = () => {
  const route = useRoute();
  const { id } = route.params as { id: string };

  const [postDetails, setPostDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPostDetails = async (postId: string) => {
    try {
      console.log(`Fetching post details for ID: ${postId}`);
      const response = await fetch(
        `${process.env.BACKEND_URI}/posts/${postId}`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Fetched post details:", data);
      setPostDetails(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch post details:", err);
      setError("Failed to load post details. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails(id);
  }, [id]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorMessage}>{error}</Text>}
      {!loading && !error && postDetails && (
        <View>
          {/* Title, Subtitle, and Body */}
          <Text style={styles.title}>{postDetails.title}</Text>
          <Text style={styles.subtitle}>Type: {postDetails.type}</Text>
          <Text style={styles.body}>{postDetails.body}</Text>

          {/* Location */}
          {postDetails.location && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text>{JSON.stringify(postDetails.location)}</Text>
            </View>
          )}

          {/* Tags */}
          {postDetails.tags && postDetails.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              {renderTags(postDetails.tags)}
            </View>
          )}

          {/* Messages */}
          {renderList(
            "Messages",
            postDetails.messages || [],
            (item, index) => `message-${index}`
          )}

          {/* Reward Offers */}
          {renderList(
            "Reward Offers",
            postDetails.rewardOffers || [],
            (item, index) => `offer-${index}`
          )}

          {/* Handshakes */}
          {renderList(
            "Handshakes",
            postDetails.handshakes || [],
            (item, index) => `handshake-${index}`
          )}

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Status</Text>
            <Text>{postDetails.status}</Text>
          </View>

          {/* Images */}
          {postDetails.images && postDetails.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {postDetails.images.map((image: string, index: number) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default Post;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    padding: 16,
    alignItems: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
    marginBottom: 16,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 8,
  },
  tag: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    marginRight: 5,
    borderRadius: 3,
    fontSize: 14,
    color: "#333",
  },
  errorMessage: {
    fontSize: 16,
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 16,
  },
  imageWrapper: {
    width: "48%",
    marginBottom: 8,
    marginRight: "4%",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
});
