import { UserDTO } from "index";
import { getEndpointUrl } from "./config";
import {
  CategoryDTO,
  CreateEventDTO,
  CreateHandshakeDTO,
  CreateMessageDTO,
  CreatePostDTO,
  CreateRewardOfferDTO,
  CreateUserDTO,
  EventDTO,
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

/**
 * Converts an object into a query string for GET requests
 */
function toQueryParams(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  return query ? `?${query}` : "";
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
export async function getBannedTags() {
  const response = await instance.get(`/tags/`);
  return response.data;
}

/** @throws {AxiosError} */
export async function getUserDetails(id: string = "me", token: string, options: { dmChannels?: boolean; dmChannel?: boolean } = {}) {
  const queryString = toQueryParams(options);

  const response = await instance.get(`/users/${id}${queryString}`, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/** @throws {AxiosError} */
export async function getUserPosts(id: string = "me", token: string) {
  const response = await instance.get(`/users/${id}/posts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}


/** @throws {AxiosError} */
export async function getUserSettings(token: string) {
  const response = await instance.get(`/usersettings/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Update user settings
 * @param settingsData - User settings data to update
 * @param token - Authentication token
 */
export async function updateUserSettings(settingsData: any, token: string) {
  if (!token) throw Error("Invalid token");
  
  console.log("Updating user settings with data:", settingsData);
  
  try {
    // Convert to FormData since the endpoint expects multipart/form-data
    const formData = toFormData(settingsData);
    
    const response = await instance.put(`/usersettings/me`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("User settings update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
}


/** @throws {AxiosError} */
export async function getUserHandshakes(id: string = "me", token: string) {
  // Fetch sent handshakes
  const sentResponse = await instance.get(`/handshakes/by-sender/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // Fetch received handshakes
  const receivedResponse = await instance.get(`/handshakes/by-receiver/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  // Combine both arrays
  return [...sentResponse.data, ...receivedResponse.data];
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
  return instance.post("/offers", request, {
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
  
  console.log("Creating handshake with request:", request);
  
  try {
    const response = await instance.post("/handshakes", request, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log("Handshake created successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error creating handshake:", error);
    throw error;
  }
}

/** @throws {AxiosError} */
export async function updateHandshake(
  handshakeId: number,
  updateData: Partial<HandshakeDTO>,
  token: string
): Promise<{ data: HandshakeDTO }> {
  if (!token) throw Error("Invalid token");
  return instance.patch(`/handshakes/${handshakeId}`, updateData, {
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

/** @throws {AxiosError} */
export async function sendDirectMessage(
  receiverID: number,
  message: CreateMessageDTO,
  token: string
): Promise<{
  author: any;
  channel: any; data: any 
}> {
  if (!token) throw Error("Invalid token");
  
  const response = await instance.post(`/users/${receiverID}/dm`, message, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/** @throws {AxiosError} */
export async function getUserDMs(userID: number, token: string): Promise<{ data: any }> {
  if (!token) throw Error("Invalid token");

  const response = await instance.get(`/users/${userID}/dms`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/** @throws {AxiosError} */
export async function getMessages(channelID: number, token: string) {
  if (!token) throw Error("Invalid token");

  const response = await instance.get(`/channels/${channelID}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/** @throws {AxiosError} */
export async function createDMChannel(user1ID: number, user2ID: number, token: string) {
  if (!token) throw Error("Invalid token");
  console.log("Creating DM channel with user IDs:", user1ID, user2ID);

  const response = await instance.post(
    "/channels",
    {
      name: `DM: User ${user1ID} & User ${user2ID}`,
      channelType: "dm",
      userIDs: [user1ID, user2ID],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log("DM channel created successfully:", response.data);

  return response.data;
}

export const getPublicChannels = async (token: string) => {
  try {
    const response = await instance.get('/channels', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data
  } catch (error) {
    console.error('Error fetching public channels:', error);
    return [];
  }
};

/** @throws {AxiosError} */
export async function fetchLeaderboard(
  token: string,
  local: boolean,
  time: string // 'all' | '24h' | 'week' | 'month' | 'year'
) {
  if (!token) throw new Error("Invalid token");

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.append("local", String(local)); 
  // "true" or "false"
  queryParams.append("time", time); 
  // e.g. "all", "24h", "week"

  const res = await instance.get(`/leaderboard?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
}

/** @throws {AxiosError} */
export async function createEvent(request: CreateEventDTO, token: string): Promise<{ data: EventDTO }> {
  if (!token) throw Error("Invalid token");

  return instance.post("/events", request, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function deleteEvent(eventId: number, token: string): Promise<{ data: EventDTO }> {
  if (!token) throw Error("Invalid token");

  return instance.delete(`/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function joinEvent(eventId: number, token: string): Promise<{ data: { success: boolean } }> {
  if (!token) throw Error("Invalid token");

  return instance.post(`/events/${eventId}/join`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function leaveEvent(eventId: number, token: string): Promise<{ data: { success: boolean } }> {
  if (!token) throw Error("Invalid token");

  return instance.post(`/events/${eventId}/leave`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/** @throws {AxiosError} */
export async function getEvents(filters?: {
  startDate?: string;
  endDate?: string;
  location?: string;
  all?: 'true' | 'false';
}): Promise<EventDTO[]> {
  const queryString = filters ? toQueryParams(filters) : '';
  const response = await instance.get(`/events${queryString}`);
  return response.data;
}

/** @throws {AxiosError} */
export async function getEventDetails(eventId: number): Promise<{ data: EventDTO }> {
  return instance.get(`/events/${eventId}`);
}

/** @throws {AxiosError} */
export async function getCategories(): Promise<CategoryDTO[]> {
  const response = await instance.get('/categories');
  return response.data;
}
