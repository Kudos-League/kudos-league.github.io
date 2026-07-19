import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';
import { pushAlert } from '@/components/common/alertBus';
import type { UserDTO } from '@/shared/api/types';

export type AwardKudosPayload = {
    recipientID: number;
    title: string;
    description?: string;
    amount: number;
    files?: File[];
};

export type AwardKudosResult = {
    giftID: string;
    amount: number;
    title: string;
    description: string | null;
    attachments: string[];
    verificationStatus: 'pending' | 'verified' | 'rejected';
    recipientID: number;
    giverID: number;
    giverTotal: number;
    recipientTotal: number;
};

function extractErrMessage(err: any): string {
    if (Array.isArray(err) && err.every((s) => typeof s === 'string')) {
        return err.join(', ');
    }

    return (
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong'
    );
}

export function useAwardKudos() {
    const qc = useQueryClient();

    return useMutation<AwardKudosResult, Error, AwardKudosPayload>({
        mutationFn: (payload) =>
            apiMutate<AwardKudosResult, AwardKudosPayload>(
                '/kudos/award',
                'post',
                payload,
                { as: 'form' }
            ),
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['kudos-history'] });
            qc.invalidateQueries({ queryKey: ['user', result.recipientID] });
            qc.setQueriesData<UserDTO | undefined>(
                { queryKey: ['user', result.recipientID] },
                (prev) =>
                    prev ? { ...prev, kudos: result.recipientTotal } : prev
            );
            pushAlert({
                type: 'success',
                message: `Awarded ${result.amount} kudos!`
            });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}

export type KudosAwardVerdict = 'verify' | 'reject';

export function useVerifyKudosAward() {
    const qc = useQueryClient();

    return useMutation<
        { giftID: string; verificationStatus: string },
        Error,
        { giftID: string; action: KudosAwardVerdict }
    >({
        mutationFn: ({ giftID, action }) =>
            apiMutate<
                { giftID: string; verificationStatus: string },
                { action: KudosAwardVerdict }
            >(`/kudos/awards/${giftID}/verify`, 'put', { action }),
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['kudos-awards'] });
            qc.invalidateQueries({ queryKey: ['kudos-history'] });
            pushAlert({
                type: 'success',
                message:
                    result.verificationStatus === 'verified'
                        ? 'Award verified.'
                        : 'Award rejected — kudos returned.'
            });
        },
        onError: (err) => {
            pushAlert({ type: 'danger', message: extractErrMessage(err) });
        }
    });
}
