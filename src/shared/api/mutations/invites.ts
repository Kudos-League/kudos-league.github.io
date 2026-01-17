import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';

export const qkInvites = {
    list: () => ['invites'] as const
};

type CreateInvitePayload = {
    emails?: string[];
    email?: string;
};

type InviteResponse = {
    invites: Array<{ email: string; link: string }>;
};

export function useCreateInvitesMutation() {
    const qc = useQueryClient();

    return useMutation<InviteResponse, Error, CreateInvitePayload>({
        mutationFn: (payload) =>
            apiMutate<InviteResponse, CreateInvitePayload>('/users/invites', 'post', payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkInvites.list() });
        }
    });
}

export function useRevokeInviteMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { inviteId: number }>({
        mutationFn: ({ inviteId }) =>
            apiMutate<void, void>(`/users/invites/${inviteId}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkInvites.list() });
        }
    });
}
