import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import type { UserSettingsDTO } from '@/shared/api/types';

export const qkUserSettings = {
    me: ['usersettings', 'me'] as const
};

export async function getMyUserSettings(): Promise<UserSettingsDTO> {
    return apiGet<UserSettingsDTO>('/usersettings/me');
}

export function useMyUserSettingsQuery(enabled = true) {
    return useQuery<UserSettingsDTO>({
        queryKey: qkUserSettings.me,
        queryFn: getMyUserSettings,
        enabled,
        staleTime: 30_000
    });
}

export function useUpdateMyUserSettings() {
    const queryClient = useQueryClient();

    return useMutation<
        UserSettingsDTO,
        string[],
        Pick<UserSettingsDTO, 'emailNotificationsEnabled'>
    >({
        mutationFn: (payload) =>
            apiMutate<
                UserSettingsDTO,
                Pick<UserSettingsDTO, 'emailNotificationsEnabled'>
            >('/usersettings/me', 'put', payload),
        onSuccess: (settings) => {
            queryClient.setQueryData(qkUserSettings.me, settings);
            queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
        }
    });
}

export async function blockUser(userID: number) {
    return apiMutate(`/usersettings/${userID}/block`, 'patch');
}

export async function unblockUser(userID: number) {
    return apiMutate(`/usersettings/${userID}/unblock`, 'patch');
}
