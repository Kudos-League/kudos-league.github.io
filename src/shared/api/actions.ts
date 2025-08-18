import { MessageDTO, UpdateMessageDTO, UserDTO } from '@/shared/api/types';
import { getEndpointUrl } from './config';
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
    TopTagDTO,
    UserLoginRequestSchemaDTO,
    UserLoginResponseDTO
} from './types';
import axios from 'axios';
import { withRateLimit } from './rateLimitQueue';

const instance = axios.create({
    baseURL: getEndpointUrl(),
    withCredentials: true,
    responseType: 'json'
});

/**
 * Converts a DTO object into a FormData object.
 * Supports nested fields and array data types.
 */
function toFormData(dto: Record<string, any>): FormData {
    const fd = new FormData();

    for (const key in dto) {
        const val = dto[key];

        if (
            Array.isArray(val) &&
            val.length > 0 &&
            (val[0] instanceof File || val[0] instanceof Blob)
        ) {
            val.forEach((f) => fd.append(key, f));
        }
        else if (
            Array.isArray(val) &&
            typeof val[0] !== 'object'
        ) {
            // Primitive array (e.g., tags: string[])
            fd.append(key, JSON.stringify(val)); // Send as JSON string
        }
        else if (
            val !== null &&
            typeof val === 'object' &&
            !(val instanceof File || val instanceof Blob)
        ) {
            fd.append(key, JSON.stringify(val));
        }
        else if (val !== undefined && val !== null) {
            fd.append(key, val);
        }
    }

    return fd;
}

/**
 * Converts an object into a query string for GET requests
 */
function toQueryParams(params: Record<string, any>): string {
    const query = Object.entries(params)
        .filter(([_, value]) => value !== undefined)
        .map(
            ([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join('&');

    return query ? `?${query}` : '';
}

// TODO: Type all request/response values if/when we factor API types into a codebase shared by FE/BE

/** @throws {AxiosError} */
export async function createPost(request: CreatePostDTO, token: string) {
    const formData = toFormData(request);
    const response = await instance.post('/posts', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
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
    includeSender = false
} = {}): Promise<{ data: PostDTO[] }> {
    const response = await instance.get(
        `/posts?includeTags=${includeTags}&includeSender=${includeSender}`
    );
    return response.data;
}

/** @throws {AxiosError} */
export async function getPostDetails(token: string, id: number) {
    const response = await instance.get(`/posts/${id}`, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/** @throws {AxiosError} */
export async function getBannedTags() {
    const response = await instance.get(`/tags/`);
    return response.data;
}

/** @throws {AxiosError} */
export async function getUserDetails(
    id: number | string = 'me',
    token: string,
    options: {
        dmChannels?: boolean;
        dmChannel?: boolean;
        settings?: boolean;
    } = {}
) {
    const queryString = toQueryParams(options);

    return withRateLimit(`/users/${id}${queryString}`, async () => {
        const response = await instance.get(`/users/${id}${queryString}`, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        });

        return response.data;
    });
}

/** @throws {AxiosError} */
export async function getUserPosts(id: number | string = 'me', token: string) {
    const response = await instance.get(`/users/${id}/posts`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/** @throws {AxiosError} */
export async function getUserSettings(token: string) {
    const response = await instance.get(`/usersettings/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/**
 * Update user settings
 * @param settingsData - User settings data to update
 * @param token - Authentication token
 */
export async function updateUserSettings(settingsData: any, token: string) {
    if (!token) throw Error('Invalid token');

    console.log('Updating user settings with data:', settingsData);

    try {
        // Convert to FormData since the endpoint expects multipart/form-data
        const formData = toFormData(settingsData);

        const response = await instance.put(`/usersettings/me`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`
            }
        });

        console.log('User settings update response:', response.data);
        return response.data;
    }
    catch (error) {
        console.error('Error updating user settings:', error);
        throw error;
    }
}

/** @throws {AxiosError} */
export async function getUserHandshakes(id: number | string = 'me', token: string) {
    // Fetch sent handshakes
    const sentResponse = await instance.get(`/handshakes/by-sender/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    // Fetch received handshakes
    const receivedResponse = await instance.get(
        `/handshakes/by-receiver/${id}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    // Combine both arrays
    return [...sentResponse.data, ...receivedResponse.data];
}

export async function getUserEvents(
    id: string | number = 'me',
    token: string,
    filters?: {
		startDate?: string;
		endDate?: string;
		location?: string;
		filter?: 'all' | 'ongoing' | 'upcoming' | 'past';
	}
): Promise<EventDTO[]> {
    const queryString = filters ? toQueryParams(filters) : '';
    const response = await instance.get(`/users/${id}/events${queryString}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/** @throws {AxiosError} */
export async function updateUser(
    request: Partial<UserDTO>,
    id = 'me',
    token: string
) {
    if (!token) throw Error('Invalid token');
    const formData = toFormData(request);
    const response = await instance.patch(`/users/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/**
 * Adds a tag to a user
 * @param userId The ID of the user (defaults to "me" for the current user)
 * @param tag The tag to add
 * @param token Authentication token
 * @returns The updated user data
 * @throws {AxiosError}
 */

export async function addTagToUser(
    tagName: string,
    userId = 'me',
    token: string
) {
    if (!token) throw new Error('Invalid token');

    // Ensure we're sending a properly formatted JSON object
    const response = await instance.post(
        `/users/${userId}/tags`,
        { name: tagName, description: '' }, // Make sure this is a proper JSON object
        {
            headers: {
                'Content-Type': 'application/json', // Explicitly set content type
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

/** @throws {AxiosError} */
export async function sendMessage(
    request: CreateMessageDTO,
    token: string
): Promise<MessageDTO> {
    if (!token) throw Error('Invalid token');
    const response = await instance.post('/messages', request, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}


/** @throws {AxiosError} */
export async function updateMessage(
    id: number,
    request: UpdateMessageDTO,
    token: string
): Promise<MessageDTO> {
    if (!token) throw Error('Invalid token');
    const response = await instance.put(`/messages/${id}`, request, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/** @throws {AxiosError} */
export async function deleteMessage(
    id: number,
    token: string
): Promise<MessageDTO> {
    if (!token) throw Error('Invalid token');
    const response = await instance.delete(`/messages/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}


export async function createRewardOffer(
    request: CreateRewardOfferDTO,
    token: string
): Promise<{ data: RewardOfferDTO }> {
    if (!token) throw Error('Invalid token');
    return instance.post('/offers', request, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function createHandshake(
    request: CreateHandshakeDTO,
    token: string
): Promise<{ data: HandshakeDTO }> {
    if (!token) throw Error('Invalid token');

    console.log('Creating handshake with request:', request);

    try {
        const response = await instance.post('/handshakes', request, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Handshake created successfully:', response.data);
        return response;
    }
    catch (error) {
        console.error('Error creating handshake:', error);
        throw error;
    }
}

/** @throws {AxiosError} */
export async function updateHandshake(
    handshakeId: number,
    updateData: Partial<HandshakeDTO>,
    token: string
): Promise<{ data: HandshakeDTO }> {
    if (!token) throw Error('Invalid token');
    return instance.patch(`/handshakes/${handshakeId}`, updateData, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function deleteHandshake(handshakeID: number, token: string) {
    if (!token) throw Error('Invalid token');

    return instance.delete(`/handshakes/${handshakeID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function searchPosts(
    query: string,
    sort?: 'date' | 'tags' | 'location',
    userLat?: number,
    userLon?: number
) {
    try {
        const response = await instance.get('/posts/search', {
            params: {
                query,
                ...(sort && { sort }),
                ...(userLat && { userLat }),
                ...(userLon && { userLon })
            }
        });

        return response.data;
    }
    catch (error) {
        console.error('Search API Error:', error);
        throw error;
    }
}

/** @throws {AxiosError} */
export async function sendDirectMessage(
    receiverID: number,
    message: CreateMessageDTO,
    token: string
): Promise<MessageDTO> {
    if (!token) throw Error('Invalid token');

    const response = await instance.post(`/users/${receiverID}/dm`, message, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function getUserDMs(
    userID: number,
    token: string
): Promise<{ data: any }> {
    if (!token) throw Error('Invalid token');

    const response = await instance.get(`/users/${userID}/dms`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function getMessages(channelID: number, token: string) {
    if (!token) throw Error('Invalid token');

    const response = await instance.get(`/channels/${channelID}/messages`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function createDMChannel(
    user1ID: number,
    user2ID: number,
    token: string
) {
    if (!token) throw Error('Invalid token');
    console.log('Creating DM channel with user IDs:', user1ID, user2ID);

    const response = await instance.post(
        '/channels',
        {
            name: `DM: User ${user1ID} & User ${user2ID}`,
            channelType: 'dm',
            userIDs: [user1ID, user2ID]
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        }
    );

    console.log('DM channel created successfully:', response.data);

    return response.data;
}

export const getPublicChannels = async (token: string) => {
    try {
        const response = await instance.get('/channels', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        return response.data;
    }
    catch (error) {
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
    if (!token) throw new Error('Invalid token');

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('local', String(local));
    // "true" or "false"
    queryParams.append('time', time);
    // e.g. "all", "24h", "week"

    const res = await instance.get(`/leaderboard?${queryParams.toString()}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return res.data;
}

/** @throws {AxiosError} */
export async function createEvent(
    request: CreateEventDTO,
    token: string
): Promise<{ data: EventDTO }> {
    if (!token) throw Error('Invalid token');

    return instance.post('/events', request, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function deleteEvent(
    eventId: number,
    token: string
): Promise<{ data: EventDTO }> {
    if (!token) throw Error('Invalid token');

    return instance.delete(`/events/${eventId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function joinEvent(
    eventId: number,
    token: string
): Promise<{ data: { success: boolean } }> {
    if (!token) throw Error('Invalid token');

    return instance.post(`/events/${eventId}/join`, null, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function leaveEvent(
    eventId: number,
    token: string
): Promise<{ data: { success: boolean } }> {
    if (!token) throw Error('Invalid token');

    return instance.post(`/events/${eventId}/leave`, null, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function getEvents(filters?: {
	startDate?: string;
	endDate?: string;
	location?: string;
	filter?: 'all' | 'ongoing' | 'upcoming' | 'past';
}): Promise<EventDTO[]> {
    const queryString = filters ? toQueryParams(filters) : '';
    const response = await instance.get(`/events${queryString}`);
    return response.data;
}

/** @throws {AxiosError} */
export async function getEventDetails(
    eventId: number
): Promise<{ data: EventDTO }> {
    return instance.get(`/events/${eventId}`);
}

/** @throws {AxiosError} */
export async function getCategories(): Promise<CategoryDTO[]> {
    const response = await instance.get('/categories');
    return response.data;
}

/** @throws {AxiosError} */
export async function getTopTags(
    query: string,
    token: string
): Promise<{ data: TopTagDTO[] }> {
    if (!token) throw Error('Invalid token');

    return instance.get('/tags/top', {
        params: { q: query },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
}

/** @throws {AxiosError} */
export async function getReports(token: string) {
    const response = await instance.get('/admin/reports', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function updatePost(
    postID: number,
    updates: Partial<PostDTO>,
    token: string
) {
    const formData = toFormData(updates);
    const response = await instance.put(`/posts/${postID}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function likePost(postID: number, like: boolean, token: string) {
    const response = await instance.put(
        `/posts/${postID}/like`,
        { like },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

/** @throws {AxiosError} */
export async function removeLike(postID: number, token: string) {
    const response = await instance.delete(`/posts/${postID}/like`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

/** @throws {AxiosError} */
export async function reportPost(
    postID: number,
    reason: string,
    token: string
) {
    const response = await instance.put(
        `/posts/${postID}/report`,
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

/** @throws {AxiosError} */
export async function deleteReport(reportID: number, token: string) {
    const response = await instance.delete(`/admin/reports/${reportID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response.data;
}

/** @throws {AxiosError} */
export async function updateReportStatus(
    reportID: number,
    status: 'ignored' | 'resolved',
    token: string
) {
    const response = await instance.put(
        `/admin/reports/${reportID}`,
        { status },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data;
}

/** @throws {AxiosError} */
export async function getGeocodedLocation(query: string, token: string) {
    const response = await instance.get('/maps/proxy/geocode/json', {
        params: { address: query },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response.data;
}

export async function fetchNotifications(token: string, limit = 50) {
    const res = await instance.get('/notifications', {
        params: { limit },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    });
    return res.data;
}

export async function markAllNotificationsRead(token: string) {
    await instance.post('/notifications/mark-all-read', null, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
    });
}