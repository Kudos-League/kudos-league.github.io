import { useState } from "react";
import { FlatList, Text, View, StyleSheet } from "react-native";
import PostCard from "./PostCard";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import Alert from "../Alert";

// TODO: Move this to a better location
type RootStackParamList = {
  DrawerNavigator: undefined;
  Success: undefined;
  Cancel: undefined;
  Post: { id: string };
  NotFound: undefined;
};

type NavigationProps = StackNavigationProp<RootStackParamList, "Post">;

export default function PostsContainer({ posts }) {
  const navigation = useNavigation<NavigationProps>();
  const [loading, setLoading] = useState(false);

    //DEV: Velasco's fake data
    if (!posts?.length) posts = [
      {
        fake: true,
        id: "1",
        title: "TV to give away",
        body: "I have a 42-inch Samsung TV that I no longer need. It's in good condition, just a few years old. First come, first served! Can arrange pickup in downtown area.",
        type: "gift",
        images: ["https://picsum.photos/id/0/400/300"],
        tags: [
          { id: "1", name: "electronics" },
          { id: "2", name: "home" }
        ],
        sender: {
          id: "user1",
          username: "Brandi Spoin",
          avatar: "https://randomuser.me/api/portraits/women/44.jpg",
          kudos: 100,
        },
        rewardOffer: {
          kudosFinal: 2342
        },
        createdAt: new Date().toISOString()
      },
      {
        fake: true,
        id: "2",
        title: "baby clothes",
        body: "Giving away gently used baby clothes. Size 3-6 months, both gender neutral and boy clothes. All washed and in good condition, some still have tags!",
        type: "gift",
        images: ["https://picsum.photos/id/1/400/300"],
        tags: [
          { id: "3", name: "baby" },
          { id: "4", name: "clothes" }
        ],
        sender: {
          id: "user2",
          username: "Bobby Miller",
          avatar: "https://randomuser.me/api/portraits/men/22.jpg",
          kudos: 100,
        },
        rewardOffer: {
          kudosFinal: 51352
        },
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        fake: true,
        id: "3",
        title: "Who wants my treadmill?",
        body: "Moving out and can't take my treadmill with me. It's a NordicTrack T6.5S, about 2 years old and works perfectly. You'll need to pick it up and it's heavy!",
        type: "gift",
        images: ["https://picsum.photos/id/2/400/300"],
        tags: [
          { id: "5", name: "fitness" },
          { id: "6", name: "equipment" }
        ],
        sender: {
          id: "user3",
          username: "Sandra Doay",
          avatar: "https://randomuser.me/api/portraits/women/68.jpg",
          kudos: 100,
        },
        rewardOffer: {
          kudosFinal: 6426
        },
        createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        fake: true,
        id: "4",
        title: "Looking for a dining table",
        body: "Just moved to a new apartment and looking for a dining table for 4-6 people. Would really appreciate if someone has one they don't need anymore!",
        type: "request",
        images: [],
        tags: [
          { id: "7", name: "furniture" },
          { id: "8", name: "home" }
        ],
        sender: {
          id: "user4",
          username: "Marcus Johnson",
          avatar: "https://randomuser.me/api/portraits/men/32.jpg",
          kudos: 100
        },
        rewardOffer: {
          kudosFinal: 1250
        },
        createdAt: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      },
      {
        fake: true,
        id: "5",
        title: "Offering children's books",
        body: "My kids have outgrown these books. I have about 30 children's books in excellent condition, suitable for ages 3-7. Mix of educational and fun stories.",
        type: "gift",
        images: ["https://picsum.photos/id/3/400/300"],
        tags: [
          { id: "9", name: "books" },
          { id: "10", name: "children" }
        ],
        sender: {
          id: "user5",
          username: "Alicia Gomez",
          avatar: "https://randomuser.me/api/portraits/women/55.jpg",
          kudos: 100
        },
        rewardOffer: {
          kudosFinal: 8734
        },
        createdAt: new Date(Date.now() - 345600000).toISOString() // 4 days ago
      },
      {
        fake: true,
        id: "6",
        title: "Kitchen appliances available",
        body: "Downsizing and have several kitchen appliances to give away: blender, toaster, electric kettle, and a rice cooker. All working perfectly, just don't have the space anymore.",
        type: "gift",
        images: ["https://picsum.photos/id/4/400/300"],
        tags: [
          { id: "11", name: "kitchen" },
          { id: "12", name: "appliances" }
        ],
        sender: {
          id: "user6",
          username: "Ryan Torres",
          avatar: "https://randomuser.me/api/portraits/men/43.jpg",
          kudos: 100
        },
        rewardOffer: {
          kudosFinal: 4215
        },
        createdAt: new Date(Date.now() - 432000000).toISOString() // 5 days ago
      }
    ];
    //End of Velasco's fake data

  const handlePostPress = (id: string) => {
    navigation.navigate("Post", { id });
  };

  // Fetch more communities
  const fetchMoreCommunities = () => {
    if (loading) return;
    setLoading(true);

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
        // ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
