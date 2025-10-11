import { apiGet, apiMutate } from '@/shared/api/apiClient';

export async function getMyUserSettings() {
    return apiGet('/usersettings/me');
}

export async function blockUser(userID: number) {
    return apiMutate(`/usersettings/${userID}/block`, 'patch');
}

export async function unblockUser(userID: number) {
    return apiMutate(`/usersettings/${userID}/unblock`, 'patch');
}
