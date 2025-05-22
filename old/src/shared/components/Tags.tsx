import { Box, Chip } from "@mui/material";

export type Tag = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
};
interface Props {
  tags: Tag[];
}

export default function Tags(props: Props) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", marginTop: 1 }}>
      {props.tags.map((tag, index) => (
        <Chip
          key={index}
          label={tag.name}
          sx={{
            backgroundColor: "#444", // Dark background to match overall theme
            color: "#fff", // Light text for contrast
            borderRadius: 2,
          }}
        />
      ))}
    </Box>
  );
}
