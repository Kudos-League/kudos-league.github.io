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
  authorID: number;
  threadID: number;
  replyToMessageID?: number;
  handshakeID?: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  //TODO: Stuff is missing
}

export type CreateMessageDTO = Partial<MessageDTO>;

export interface SendCommentDTO {
  content: string;
}
