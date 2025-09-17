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
