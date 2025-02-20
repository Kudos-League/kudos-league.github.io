import { Avatar } from "@mui/material";
import { getEndpointUrl } from "shared/api/config";

export default function AvatarComponent({ avatar, username, sx, style }: { avatar: string | null, username: string | null, sx?: any, style?: any}) {
    return (
        <Avatar
            alt={username || "Display Name Unavailable"}
            src={avatar ? `${getEndpointUrl()}${avatar}` : "https://via.placeholder.com/150"}
            sx={sx}
            style={style}
        />
    )
}