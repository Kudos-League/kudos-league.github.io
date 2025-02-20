import { Box, Typography, Stack } from "@mui/material";
import { TouchableOpacity } from "react-native";
import Tags, { Tag } from "../Tags";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { getEndpointUrl } from "shared/api/config";
import AvatarComponent from "../Avatar";

type RootStackParamList = {
  Home: undefined;
  Post: { id: string };
  UserProfile: { id: string };
};

type NavigationProps = StackNavigationProp<RootStackParamList, "UserProfile">;

export default function PostCard(props: Post & { onPress: () => void }) {
  const navigation = useNavigation<NavigationProps>();

  const handleAvatarPress = () => {
    if (props.sender?.id) {
      navigation.navigate("UserProfile", { id: props.sender.id });
    }
  };

  return (
    <TouchableOpacity onPress={props.onPress}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: "#333",
          padding: 2,
          borderRadius: 3,
          color: "#fff",
          border: "1px solid #333",
          overflow: "hidden",
          marginRight: 1,
        }}
      >
        <Stack spacing={0.5} margin={1}>
          <TouchableOpacity onPress={handleAvatarPress}>
            <AvatarComponent
              username={props.sender?.username}
              avatar={props.sender?.avatar}
              sx={{ width: 64, height: 64, marginRight: 2 }}
            />
          </TouchableOpacity>
          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.sender?.username}
          </Typography>
          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.rewardOffer?.kudosFinal || 0} kudos
          </Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
            {props.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.type}
          </Typography>
          {props.tags?.length ? <Tags tags={props.tags} /> : null}
          <Typography variant="body2" sx={{ color: "#bbb" }}>
            {props.body}
          </Typography>
        </Stack>
      </Box>
    </TouchableOpacity>
  );
}
