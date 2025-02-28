import { useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import PostCard from "./PostCard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Alert from "../Alert";

// TODO: Move this to a better location
type RootStackParamList = {
  DrawerNavigator: undefined; // Main drawer
  Success: undefined;
  Cancel: undefined;
  Post: { id: string };
  NotFound: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "Post">;

// Example data structure
// interface Props {
//   username: string;
//   title: string;
//   body: string;
//   type: string;
//   kudos: number;
//   tags: string[]; // Add tags prop
// }

export default function PostsContainer({ posts }) {
  const navigation = useNavigation<NavigationProps>();
  const [loading, setLoading] = useState(false);

  const handlePostPress = (id: string) => {
    navigation.navigate("Post", { id });
  };

  // Fetch more communities
  const fetchMoreCommunities = () => {
    if (loading) return;

    setLoading(true);

    /*
    // Simulate API call with a timeout
    setTimeout(() => {
      const newUsers = [
        {
          id: `${users.length + 1}`,
          username: "user1",
          title: "First Post",
          body: "This is the body of the first post.",
          type: "gift",
          kudos: 10,
          tags: ["intro", "welcome"],
        },
      ];

      setUsers((prevUsers) => [...prevUsers, ...newUsers]);
      setLoading(false);
    }, 1500);
    */
  };

  // interface Props {
  //   username: string;
  //   title: string;
  //   body: string;
  //   type: string;
  //   kudos: number;
  //   tags: string[]; // Add tags prop
  // }

  if (!posts?.length) {
    return <Alert type="danger" message="No posts found." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            {...item}
            kudos={Number.parseInt(item.kudos || "-1")}
            onPress={() => handlePostPress(item.id)}
          />
        )}
        onEndReached={fetchMoreCommunities}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={true}
        ListFooterComponent={loading ? <Text>Loading more...</Text> : null}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    width: "100%",
  },
});
