import {
    useQuery,
    UseQueryOptions,
    useSuspenseQuery
} from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { EventDTO } from '@/shared/api/types';

export const qk = {
    events: (filters?: any) => ['events', filters] as const,
    event: (id: number) => ['event', id] as const
};

type Filters =
    | { filter?: 'all' | 'ongoing' | 'upcoming' | 'past'; location?: string }
    | undefined;

type EventsKey = ReturnType<typeof qk.events>;

export function useEvents(
    filters?: Filters,
    options?: Omit<
        UseQueryOptions<EventDTO[], unknown, EventDTO[], EventsKey>,
        'queryKey' | 'queryFn'
    >
) {
    return useSuspenseQuery<EventDTO[], unknown, EventDTO[], EventsKey>({
        queryKey: qk.events(filters),
        queryFn: () => apiGet<EventDTO[]>('/events', { params: filters }),
        ...options
    });
}

export function useEvent(eventId: number) {
    return useQuery({
        queryKey: qk.event(eventId),
        queryFn: () => apiGet<EventDTO>(`/events/${eventId}`),
        enabled: !!eventId
    });
}
