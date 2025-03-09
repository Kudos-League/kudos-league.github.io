// TODO: Replace all these types with shared types if/when we factor API types into a codebase shared by FE/BE

export type CreatePostDTO = {
  title: string;
  body: string;
  tags: string[];
  type: string;
  files?: File[];
};

export type PostDTO = {
  id: number;
  senderId: string;
  title: string;
  body: string;
  isRequest: boolean;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
};

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
  authorID: string;
  postID?: string;
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
  postId: number;
  amount: number;
  currency: string;
};

export type RewardOfferDTO = {
  id: number;
  postId: number;
  senderId: number;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateHandshakeDTO = {
  postID: string;
  senderID: string;
  receiverID: string;
  type: string;
  status: string;
};

export type HandshakeDTO = {
  id: number;
  postId: number;
  offerId: number;
  senderId: number;
  recipientId: number;
  createdAt: Date;
  updatedAt: Date;
};


export type ChannelDTO = {
  id: number;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}