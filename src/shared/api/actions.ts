import { getEndpointUrl } from "./config";
import {
  CreateHandshakeDTO,
  CreateMessageDTO,
  CreatePostDTO,
  CreateRewardOfferDTO,
  CreateUserDTO,
  HandshakeDTO,
  PostDTO,
  RewardOfferDTO,
  SendCommentDTO,
  UserLoginRequestSchemaDTO,
  UserLoginResponseDTO,
} from "./types";
import axios from "axios";

const instance = axios.create({
  baseURL: getEndpointUrl(),
  withCredentials: true,
  responseType: "json",
});

/**
 * Converts a DTO object into a FormData object.
 * Supports nested fields and array data types.
 */
function toFormData(dto: Record<string, any>): FormData {
  const formData = new FormData();

  for (const key in dto) {
    const value = dto[key];

    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
    } else if (value !== null && typeof value === 'object' && !(value instanceof Blob) && !(value instanceof File)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  }

  return formData;
}

// TODO: Type all request/response values if/when we factor API types into a codebase shared by FE/BE

/** @throws {AxiosError} */
export async function createPost(request: CreatePostDTO, token: string) {
  const formData = toFormData(request);
  const response = await instance.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/** @throws {AxiosError} */
export async function register(
  request: CreateUserDTO
): Promise<{ data: UserLoginResponseDTO }> {
  return instance.post(`/users/register`, request);
}

/** @throws {AxiosError} */
export async function login(
  request: UserLoginRequestSchemaDTO
): Promise<{ data: UserLoginResponseDTO }> {
  return instance.post(`/users/login`, request);
}

/** @throws {AxiosError} */
export async function getPosts({
  includeTags = false,
  includeSender = false,
} = {}): Promise<{ data: PostDTO[] }> {
  const response = await instance.get(
    `/posts?includeTags=${includeTags}&includeSender=${includeSender}`
  );
  return response.data;
}

/** @throws {AxiosError} */
export async function getPostDetails(id: string) {
  const response = await instance.get(`/posts/${id}`);
  return response.data;
}

/** @throws {AxiosError} */
export async function getUserDetails(id: string = "me", token: string) {
  const response = await instance.get(`/users/${id}`, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/** @throws {AxiosError} */
export async function updateUser(
  request: Partial<UserDTO>,
  id: string = "me",
  token: string
) {
  if (!token) throw Error("Invalid token");
  const response = await instance.patch(`/users/${id}`, request, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/** @throws {AxiosError} */
export async function sendMessage(
  request: CreateMessageDTO,
  token: string
): Promise<{ data: any }> {
  if (!token) throw Error("Invalid token");
  const response = await instance.post("/messages", request, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

export async function createRewardOffer(
  request: CreateRewardOfferDTO,
  token: string
): Promise<{ data: RewardOfferDTO }> {
  if (!token) throw Error("Invalid token");
  return instance.post("/reward-offers", request, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function createHandshake(
  request: CreateHandshakeDTO,
  token: string
): Promise<{ data: HandshakeDTO }> {
  if (!token) throw Error("Invalid token");
  return instance.post("/handshakes", request, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function searchPosts(query: string, sort?: 'date' | 'tags' | 'location', userLat?: number, userLon?: number) {
  try {
    const response = await instance.get('/posts/search', {
      params: {
        query,
        ...(sort && { sort }),
        ...(userLat && { userLat }),
        ...(userLon && { userLon }),
      },
    });

    return response.data;
  } catch (error) {
    console.error('Search API Error:', error);
    throw error;
  }
}
