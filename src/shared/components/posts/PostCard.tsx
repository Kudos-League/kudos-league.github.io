import { Box, Typography, Avatar, Stack } from "@mui/material";
import { TouchableOpacity } from "react-native";
import Tags, { Tag } from "../Tags";

interface Props {
  sender: {
    id: string;
    email: string;
    username: string;
    kudos: number;
    avatar: string | null;
  };
  rewardOffer: {
    kudos: number;
    status: string;
    body: string;
    kudosFinal: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  tags: Tag[];
  title: string;
  type: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  kudos: number; // TODO: Get this from post
  rewardOffers: any[]; // TODO
}

export default function PostCard(props: Props & { onPress: () => void }) {
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
          <Avatar
            alt={props.sender?.username}
            src={props.sender?.avatar || "https://via.placeholder.com/150"}
            sx={{ width: 64, height: 64, marginRight: 2 }}
          />
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
