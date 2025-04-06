// TODO: Replace all these types with shared types if/when we factor API types into a codebase shared by FE/BE

import { UserDTO } from "index";

export type CreatePostDTO = {
  title: string;
  body: string;
  tags: string[];
  type: string;
  files?: File[];
};

export type LocationDTO = {
  id?: number;
  name?: string | null;
  regionID: string | null;
  global?: boolean;
}

export type PostDTO = {
  id: number;
  senderId: number;
  title: string;
  body: string;
  isRequest: boolean;
  images?: string[];
  type: "request" | "gift"
  isActive: boolean;
  kudos?: number;
  createdAt: Date;
  updatedAt: Date;
  location: LocationDTO;
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

export type UserSettingsDTO = {
  about?: string;
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
  author?: UserDTO
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
  status: string;
  createdAt: Date;
  updatedAt: Date;
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
}

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
};

export type CreateEventDTO = {
  title: string;
  description: string;
  locationID?: string | null;
  startTime: Date;
  endTime: Date;
  content?: string;
  location: LocationDTO | null;
};
