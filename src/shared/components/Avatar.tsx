import { Avatar } from "@mui/material";
import { Avatar as PaperAvatar } from 'react-native-paper';
import { getAvatarURL } from "shared/api/config";

export default function AvatarComponent({ avatar, username, sx, style, size }: { avatar: string | null | undefined, username: string | null, sx?: any, style?: any, size?: number}) {
    if (!avatar) avatar = "https://via.placeholder.com/150"
    else avatar = getAvatarURL(avatar);

    if (size) {
        return (
            <PaperAvatar.Image 
                source={{ uri: avatar! }}
                size={size}
                style={style}
            />
        )
    }
    return (
        <Avatar
            alt={username || "Display Name Unavailable"}
            src={avatar!}
            sx={sx}
            style={style}
        />
    )
}