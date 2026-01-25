import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type { UserDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';

export const qkUsers = {
    me: ['user', 'me'] as const,
    user: (id: number | string) => ['user', id] as const
};

type UpdateInput = Partial<UserDTO> & {
    avatar?: File;
    avatarURL?: string;
};

export function useUpdateUser(userId?: number | string) {
    const { token } = useAuth();
    const qc = useQueryClient();

    return useMutation<UserDTO, string[], UpdateInput>({
        mutationFn: async (payload) => {
            if (!token) throw ['Not authenticated'];

            return apiMutate<UserDTO, UpdateInput>(
                `/users/${userId ?? 'me'}`,
                'patch',
                payload,
                { as: 'form' }
            );
        },
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: qkUsers.me });
            qc.invalidateQueries({ queryKey: ['events'] });
            qc.setQueryData(qkUsers.user(updated.id ?? 'me'), updated);
        }
    });
}

type ReportUserPayload = {
    id: number | string;
    reason: string;
    notes?: string;
    files?: File[];
};

export function useReportUser() {
    return useMutation<void, Error, ReportUserPayload>({
        mutationFn: ({ id, reason, notes, files }) =>
            apiMutate<void, { reason: string; notes?: string; files?: File[] }>(
                `/users/${id}/report`,
                'post',
                {
                    reason,
                    notes,
                    files
                }
            ),
        onSuccess: () => {
            // TODO: Could use alertBus
        }
    });
}

export function useDeleteAccountMutation() {
    return useMutation<void, Error, void>({
        mutationFn: () => apiMutate<void, void>('/users/me', 'delete')
    });
}

export function useReactivateUserMutation() {
    const qc = useQueryClient();
    return useMutation<UserDTO, Error, { userId: number | string }>({
        mutationFn: ({ userId }) =>
            apiMutate<UserDTO, void>(`/users/${userId}/reactivate`, 'patch'),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: qkUsers.user(updated.id) });
        }
    });
}

export function useBanUserMutation() {
    const qc = useQueryClient();
    return useMutation<void, Error, { userId: number | string; reason?: string; endDate?: string }>({
        mutationFn: ({ userId, reason, endDate }) =>
            apiMutate<void, { reason?: string; endDate?: string }>(
                `/admin/users/${userId}/ban`,
                'post',
                { reason, endDate }
            ),
        onSuccess: (_, { userId }) => {
            qc.invalidateQueries({ queryKey: qkUsers.user(userId) });
        }
    });
}

export function useUnbanUserMutation() {
    const qc = useQueryClient();
    return useMutation<void, Error, { userId: number | string }>({
        mutationFn: ({ userId }) =>
            apiMutate<void, void>(`/admin/users/${userId}/unban`, 'post'),
        onSuccess: (_, { userId }) => {
            qc.invalidateQueries({ queryKey: qkUsers.user(userId) });
        }
    });
}

export function useDisconnectOAuthMutation() {
    const qc = useQueryClient();
    return useMutation<void, Error, { provider: 'discord' | 'google' }>({
        mutationFn: ({ provider }) =>
            apiMutate<void, void>(`/users/connections/${provider}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkUsers.me });
        }
    });
}

export function useForgotPasswordMutation() {
    return useMutation<void, Error, { email: string }>({
        mutationFn: ({ email }) =>
            apiMutate<void, { email: string }>('/users/forgot-password', 'post', { email })
    });
}

export function useResetPasswordMutation() {
    return useMutation<void, Error, { token: string; password: string }>({
        mutationFn: ({ token, password }) =>
            apiMutate<void, { token: string; password: string }>(
                '/users/reset-password',
                'post',
                { token, password }
            )
    });
}
