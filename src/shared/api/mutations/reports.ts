import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import { qkAdmin } from '@/shared/api/queries/admin';

export function useDeleteReportMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { reportId: number }>({
        mutationFn: ({ reportId }) =>
            apiMutate<void, void>(`/admin/reports/${reportId}`, 'delete'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.reports() });
        }
    });
}

export function useUpdateReportStatusMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { reportId: number; status: string }>({
        mutationFn: ({ reportId, status }) =>
            apiMutate<void, { status: string }>(`/admin/reports/${reportId}`, 'put', { status }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.reports() });
        }
    });
}

export function useResolveReportMutation() {
    const qc = useQueryClient();

    return useMutation<void, Error, { reportId: number; rewardKudos: number }>({
        mutationFn: ({ reportId, rewardKudos }) =>
            apiMutate<void, { rewardKudos: number }>(`/admin/reports/${reportId}/resolve`, 'put', { rewardKudos }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: qkAdmin.reports() });
        }
    });
}
