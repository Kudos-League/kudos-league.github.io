import {
    useQuery,
    useInfiniteQuery,
    UseQueryOptions,
    useSuspenseQuery
} from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { EventDTO } from '@/shared/api/types';

export const qk = {
    events: (filters?: any) => ['events', filters] as const,
    event: (id: number) => ['event', id] as const,
    search: (query: string) => ['eventSearch', query] as const
};

type Filters =
    | {
          filter?: 'all' | 'ongoing' | 'upcoming' | 'past';
          location?: string;
          local?: boolean;
          radiusKm?: number;
      }
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

export function useSearchEventsQuery(query: string, limit = 20, eventFilter?: 'all' | 'ongoing' | 'upcoming') {
    const normalizedQuery = query.toLowerCase();
    return useInfiniteQuery<EventDTO[], Error>({
        queryKey: [...qk.search(normalizedQuery), 'infinite', eventFilter],
        queryFn: ({ pageParam = 0 }) =>
            apiGet<EventDTO[]>('/events/search', {
                params: { query: normalizedQuery, limit, offset: pageParam, eventFilter }
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.length < limit) return undefined;
            return (lastPageParam as number) + limit;
        },
        enabled: query.length >= 2,
        staleTime: 0,
        gcTime: 60_000
    });
}

export function useUserEventsQuery(
    userId: number | undefined,
    filter: 'all' | 'created' | 'participating' = 'all'
) {
    return useQuery<EventDTO[]>({
        queryKey: ['events', 'user', userId, filter],
        queryFn: () =>
            apiGet<EventDTO[]>(`/users/${userId}/events`, {
                params: { filter }
            }),
        enabled: !!userId,
        staleTime: 60_000
    });
}
