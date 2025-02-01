import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { usePosts } from "shared/hooks/usePosts";
import PostsContainer from "shared/components/posts/PostsContainer";
import globalStyles from "shared/styles";

export default function Feed() {
  const { posts, fetchPosts, loading, error } = usePosts();

  useEffect(() => {
    fetchPosts();
  }, []);

  if (loading) return <Text>Loading...</Text>;
  if (error) return <Text>{error}</Text>;

  return (
    <View style={globalStyles.container}>
      <PostsContainer posts={posts} />
    </View>
  );
}
