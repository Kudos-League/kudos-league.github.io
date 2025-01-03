import { View, Text, ScrollView, StyleSheet } from "react-native";
// import GoogleMapsComponent from "./GoogleMapsComponent";
// import CommentsComponent from "./CommentsComponent";
import Avatar from "@mui/material/Avatar";
import { Box } from "@mui/material";
import Tags from "../Tags";

const PostDetails = () => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Avatar
          src="https://via.placeholder.com/150" // Replace with actual image link
          sx={{ width: 56, height: 56, marginRight: 2 }}
        />
        <View>
          <Text style={styles.username}>USERNAME</Text>
          <Text style={styles.kudos}>KUDOS</Text>
        </View>
      </View>

      <Text style={styles.title}>TITLE</Text>
      <Text style={styles.subTitle}>REQUEST/GIFT</Text>

      <Tags tags={["tag1", "tag2"]} />

      <Text style={styles.body}>
        (post body) Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem
        Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum,
        Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem
        Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum,
        Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem Ipsum, Lorem
        Ipsum.
      </Text>

      <Box>
        {/* Google Maps Component */}
        {/* <GoogleMapsComponent /> */}
      </Box>

      <Box>
        {/* Comments Component */}
        {/* <CommentsComponent /> */}
      </Box>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  kudos: {
    color: "#888",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 8,
  },
  subTitle: {
    color: "#888",
    marginBottom: 16,
  },
  tags: {
    marginBottom: 16,
  },
  body: {
    marginBottom: 24,
    lineHeight: 24,
  },
});

export default PostDetails;
