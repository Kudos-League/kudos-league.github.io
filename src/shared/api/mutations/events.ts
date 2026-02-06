import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import type {
    EventDTO,
    CreateEventDTO,
    UpdateEventDTO
} from '@/shared/api/types';
import { qk } from '@/shared/api/queries/events';
import { useAuth } from '@/contexts/useAuth';

export function useCreateEvent(p0: { onSuccess: () => void }) {
    const { token } = useAuth();
    const qc = useQueryClient();

    return useMutation<EventDTO, string[], CreateEventDTO>({
        mutationFn: async (payload) => {
            if (!token) throw ['Not authenticated'];
            return apiMutate<EventDTO, CreateEventDTO>(
                '/events',
                'post',
                payload
            );
        },
        onSuccess: (created) => {
            qc.setQueryData(qk.event(created.id as number), created);
            // Refetch after a delay to allow backend to process
            setTimeout(() => {
                qc.invalidateQueries({ queryKey: ['events'] });
            }, 1000);
            p0?.onSuccess?.();
        }
    });
}

export function useJoinEvent(eventId: number) {
    const { token, user } = useAuth();
    const qc = useQueryClient();

    return useMutation<{ success: boolean }, string[], void>({
        mutationFn: async () => {
            if (!token) throw ['Not authenticated'];
            return apiMutate<{ success: boolean }, void>(
                `/events/${eventId}/join`,
                'post'
            );
        },
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: qk.event(eventId) });
            const prev = qc.getQueryData<EventDTO>(qk.event(eventId));

            if (prev) {
                qc.setQueryData<EventDTO>(qk.event(eventId), {
                    ...prev,
                    participants: [...prev.participants, user]
                });
            }

            return { prev };
        },
        onError: (_err, _vars, ctx: { prev?: EventDTO } | undefined) => {
            if (ctx?.prev) qc.setQueryData(qk.event(eventId), ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: qk.event(eventId) });
            qc.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

interface UpdateEventMutationData {
    id: number;
    data: UpdateEventDTO;
}

export const useUpdateEvent = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data
        }: UpdateEventMutationData): Promise<EventDTO> => {
            if (!token) throw new Error('Authentication required');
            return apiMutate<EventDTO, UpdateEventDTO>(
                `/events/${id}`,
                'patch',
                data,
                { as: 'form' }
            );
        },
        onSuccess: (updatedEvent) => {
            // Update the specific event in the cache
            queryClient.setQueryData(['event', updatedEvent.id], updatedEvent);

            // Invalidate events list to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (error) => {
            console.error('Failed to update event:', error);
        }
    });
};

export function useDeleteEvent() {
    const { token } = useAuth();
    const qc = useQueryClient();

    return useMutation<EventDTO, string[], number>({
        mutationFn: async (eventId) => {
            if (!token) throw ['Not authenticated'];
            return apiMutate<EventDTO, void>(`/events/${eventId}`, 'delete');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['events'] });
        }
    });
}

export function useInviteToEvent(eventId: number) {
    const { token } = useAuth();

    return useMutation<{ success: boolean }, string[], { userId: number }>({
        mutationFn: async ({ userId }) => {
            if (!token) throw ['Not authenticated'];
            return apiMutate<{ success: boolean }, { userId: number }>(
                `/events/${eventId}/invite`,
                'post',
                { userId }
            );
        }
    });
}

export function useLeaveEvent(eventId: number) {
    const { token, user } = useAuth();
    const qc = useQueryClient();

    return useMutation<void, string[], void>({
        mutationFn: async () => {
            if (!token) throw ['Not authenticated'];
            return apiMutate<void, void>(`/events/${eventId}/leave`, 'post');
        },
        onMutate: async () => {
            await qc.cancelQueries({ queryKey: qk.event(eventId) });
            const prev = qc.getQueryData<EventDTO>(qk.event(eventId));

            if (prev && user) {
                qc.setQueryData<EventDTO>(qk.event(eventId), {
                    ...prev,
                    participants: (prev.participants || []).filter(
                        (p) => p.id !== user.id
                    )
                });
            }

            return { prev };
        },
        onError: (_err, _vars, ctx: { prev?: EventDTO } | undefined) => {
            if (ctx?.prev) qc.setQueryData(qk.event(eventId), ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: qk.event(eventId) });
            qc.invalidateQueries({ queryKey: ['events'] });
        }
    });
}
