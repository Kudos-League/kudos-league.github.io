import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api/apiClient';
import type { FeedbackDTO } from '@/shared/api/types';

export const qkAdmin = {
    reports: () => ['admin', 'reports'] as const,
    feedback: () => ['admin', 'feedback'] as const,
    suspicious: () => ['admin', 'suspicious'] as const,
    analyticsMau: () => ['admin', 'analytics', 'mau'] as const,
    userLoginAudits: (userId: number | string) => ['admin', 'user', userId, 'loginAudits'] as const,
    userSuspectedLinked: (userId: number | string) => ['admin', 'user', userId, 'suspectedLinked'] as const,
    userHandshakes: (userId: number | string) => ['admin', 'user', userId, 'handshakes'] as const,
    userReports: (userId: number | string) => ['admin', 'user', userId, 'reports'] as const
};

export function useAdminReportsQuery() {
    return useQuery<any[]>({
        queryKey: qkAdmin.reports(),
        queryFn: () => apiGet<any[]>('/admin/reports'),
        staleTime: 30_000
    });
}

export function useAdminFeedbackQuery() {
    return useQuery<FeedbackDTO[]>({
        queryKey: qkAdmin.feedback(),
        queryFn: () => apiGet<FeedbackDTO[]>('/feedback'),
        staleTime: 30_000
    });
}

export function useAdminSuspiciousQuery() {
    return useQuery<any[]>({
        queryKey: qkAdmin.suspicious(),
        queryFn: () => apiGet<any[]>('/admin/suspicious'),
        staleTime: 30_000
    });
}

export function useAdminAnalyticsMauQuery() {
    return useQuery<{ month: string; count: number }[]>({
        queryKey: qkAdmin.analyticsMau(),
        queryFn: () => apiGet<{ month: string; count: number }[]>('/admin/analytics/mau'),
        staleTime: 60_000
    });
}

type Paged<T> = { data: T[]; nextCursor?: number };

export function useAdminUserLoginAuditsQuery(userId: number | string | undefined, limit = 5) {
    return useInfiniteQuery({
        queryKey: qkAdmin.userLoginAudits(userId!),
        queryFn: ({ pageParam }) =>
            apiGet<Paged<any>>(`/admin/users/${userId}/login-audits`, {
                params: { limit, cursor: pageParam }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!userId
    });
}

export function useAdminUserSuspectedLinkedQuery(userId: number | string | undefined, limit = 5) {
    return useInfiniteQuery({
        queryKey: qkAdmin.userSuspectedLinked(userId!),
        queryFn: ({ pageParam }) =>
            apiGet<Paged<any>>(`/admin/users/${userId}/suspected-linked`, {
                params: { limit, cursor: pageParam }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!userId
    });
}

export function useAdminUserHandshakesQuery(userId: number | string | undefined, limit = 5) {
    return useInfiniteQuery({
        queryKey: qkAdmin.userHandshakes(userId!),
        queryFn: ({ pageParam }) =>
            apiGet<Paged<any>>(`/admin/users/${userId}/shared-handshakes`, {
                params: { limit, cursor: pageParam }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!userId
    });
}

export function useAdminUserReportsQuery(userId: number | string | undefined, limit = 5) {
    return useInfiniteQuery({
        queryKey: qkAdmin.userReports(userId!),
        queryFn: ({ pageParam }) =>
            apiGet<Paged<any>>(`/admin/users/${userId}/reports`, {
                params: { limit, cursor: pageParam }
            }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !!userId
    });
}
