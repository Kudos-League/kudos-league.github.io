import { Box, Typography, Avatar, Stack } from "@mui/material";
import { TouchableOpacity } from "react-native";
import Tags from "../Tags";

interface Props {
  username: string;
  title: string;
  body: string;
  type: string;
  kudos: number;
  tags: string[]; // Add tags prop
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
            alt={props.username}
            src="https://via.placeholder.com/150"
            sx={{ width: 64, height: 64, marginRight: 2 }}
          />
          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.username}
          </Typography>
          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.kudos} kudos
          </Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff" }}>
            {props.title}
          </Typography>

          <Typography variant="body2" sx={{ color: "#ccc" }}>
            {props.type}
          </Typography>
          {props.tags && props.tags.length > 0 && <Tags tags={props.tags} />}
          <Typography variant="body2" sx={{ color: "#bbb" }}>
            {props.body}
          </Typography>
        </Stack>
      </Box>
    </TouchableOpacity>
  );
}
