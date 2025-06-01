// TODO: Replace all these types with shared types if/when we factor API types into a codebase shared by FE/BE

import { MapCoordinates } from '@/components/Map';

export type CreatePostDTO = {
    title: string;
    body: string;
    tags: string[];
    type: string;
    files?: File[];
    categoryID: number;
};

export type LocationDTO = {
    id?: number;
    name?: string | null;
    regionID: string | null;
    global?: boolean;
};

export type PostDTO = {
    id: number;
    senderId: number;
    title: string;
    body: string;
    isRequest: boolean;
    images?: string[];
    type: 'request' | 'gift';
    isActive: boolean;
    kudos?: number;
    createdAt: Date;
    updatedAt: Date;
    location: LocationDTO;
    category: CategoryDTO;
};
export interface CustomFile extends File {
    uri: string;
}

export type ProfileFormValues = {
    about?: string;
    email: string;
    avatar: File[];
    avatarURL?: string;
    location: MapCoordinates;
    tags?: string[];
    mapCoordinates?: {
        latitude: number;
        longitude: number;
    };
};

export interface Feat {
    location: string;
    date: Date;
    placement: number;
    description: string;
}

export type UserLoginRequestSchemaDTO = {
    username: string;
    password: string;
};

export type UserLoginResponseDTO = {
    token: string;
    user: {
        username: string;
    };
};

export type CreateUserDTO = {
    username: string;
    email: string;
    password: string;
};

export interface MessageDTO {
    id: number;
    authorID: number;
    postID?: number;
    channelID?: number;
    replyToMessageID?: number;
    handshakeID?: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    readAt?: Date;
    //TODO: Stuff is missing
    author?: UserDTO;
}

export type CreateMessageDTO = Partial<MessageDTO>;

export interface SendCommentDTO {
    content: string;
}

export type CreateRewardOfferDTO = {
    postID: number;
    amount: number;
    currency: string;
    kudos: number;
};

export type RewardOfferDTO = {
    id: number;
    postId: number;
    senderId: number;
    amount: number;
    currency: string; //TODO: what?
    createdAt: Date;
    updatedAt: Date;
};

export type CreateHandshakeDTO = {
    postID: number;
    senderID: number;
    receiverID: string;
    type: string;
    status: string;
};

export type HandshakeDTO = {
    receiverID: any;
    id: number;
    postID: number;
    offerID: number;
    senderID: number;
    recipientID: number;
    sender?: UserDTO;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    post: PostDTO;
};

export type ChannelDTO = {
    id: number;
    name: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    users?: any[]; // Array of users in the channel
    otherUser?: any; // The other user in a DM channel
    lastMessage?: any; // The last message in the channel
};

export type EventDTO = {
    id: number;
    title: string;
    description: string;
    isGlobal: boolean;
    locationID: number | null;
    startTime: string;
    endTime: string;
    creatorID: number | null;
    createdAt: string;
    updatedAt: string;
    content?: string;
    participants?: UserDTO[];
    location?: LocationDTO | null;
};

export type CreateEventDTO = {
    title: string;
    description: string;
    locationID?: string | null;
    startTime: Date;
    endTime?: Date | null;
    content?: string;
    location: LocationDTO | null;
};

export type CategoryDTO = {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
};

export interface UserTagDTO {
    name: string;
    description?: string;
    userCount?: number;
    postCount?: number;
    users?: string[];
    posts?: string[];
}

export interface UserTagRequestDTO {
    name: string;
    description?: string;
}

export interface UserSettingsDTO {
    userID: number;
    skills: string[];
    about: string;
    tags: string[];
    blockedUsers: number[];
    invitationToken: string;
    invitationCreatedAt: string;
    invitationSentAt: string;
    invitationAcceptedAt: string;
    invitationLimit: number;
    invitedByType: string;
    invitedByID: number;
    invitationsCount: number;
    id: number;
    createdAt: string;
    updatedAt: string;
}

export interface TopTagDTO {
    id: string;
    name: string;
    count: number;
}

export interface Post {
    id: string;
    sender: UserDTO;
    rewardOffer: {
        kudos: number;
        status: string;
        body: string;
        kudosFinal: number;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    tags: Tag[];
    location: LocationDTO;
    title: string;
    type: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    status: string;
    kudos: number; // TODO: Get this from post
    rewardOffers: any[]; // TODO
    messages: any[]; // TODO
    // location: any; // TODO
    handshakes: any[]; // TODO
    images: string[]; // TODO
    category: CategoryDTO;
}

interface Badge {
    id: number;
    name: string;
    image: string;
}

export interface Tag {
    id: number;
    name: string;
}

export interface UserDTO {
    id: number;
    username: string;
    email: string;
    avatar?: string | null;
    admin: boolean;
    kudos: number;
    isEmailVerified?: boolean;
    password?: string | null;
    locationID: number | null;
    tags: Tag[];
    badges: Badge[];
    location?: MapCoordinates;
    settings?: UserSettingsDTO | null;
}
