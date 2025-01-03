import { useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import PostCard from "./PostCard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";

// TODO: Move this to a better location
type RootStackParamList = {
  DrawerNavigator: undefined; // Main drawer
  Success: undefined;
  Cancel: undefined;
  PostDetails: { id: string }; // Ensure this exists
  NotFound: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "PostDetails">;

// Example data structure
// interface Props {
//   username: string;
//   title: string;
//   body: string;
//   type: string;
//   kudos: number;
//   tags: string[]; // Add tags prop
// }
const usersResponse = [
  {
    id: "1",
    username: "user1",
    title: "First Post",
    body: "This is the body of the first post.",
    type: "request",
    kudos: 10,
    tags: ["intro", "welcome"],
  },
  {
    id: "2",
    username: "user2",
    title: "React Tips",
    body: "Here are some useful tips for working with React.",
    type: "gift",
    kudos: 25,
    tags: ["react", "development", "tips"],
  },
  {
    id: "3",
    username: "user3",
    title: "TypeScript in Action",
    body: "Exploring the benefits of TypeScript in JavaScript development.",
    type: "request",
    kudos: 15,
    tags: ["typescript", "javascript", "development"],
  },
];

export default function PostsContainer() {
  const navigation = useNavigation<NavigationProps>();

  const [users, setUsers] = useState<any>(usersResponse);
  const [loading, setLoading] = useState(false);

  const handlePostPress = (id: string) => {
    navigation.navigate("PostDetails", { id });
  };

  // Fetch more communities
  const fetchMoreCommunities = () => {
    if (loading) return;

    setLoading(true);

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
  };

  // interface Props {
  //   username: string;
  //   title: string;
  //   body: string;
  //   type: string;
  //   kudos: number;
  //   tags: string[]; // Add tags prop
  // }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            username={item.username}
            title={item.title}
            body={item.body}
            type={item.type}
            kudos={Number.parseInt(item.kudos || "-1")}
            tags={item.tags}
            onPress={() => handlePostPress(item.id)}
          />
        )}
        onEndReached={fetchMoreCommunities}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={true}
        ListFooterComponent={loading ? <Text>Loading more...</Text> : null}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />} // Add space between each item
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10, // Add padding to the container for a consistent layout
    width: "100%",
  },
});
