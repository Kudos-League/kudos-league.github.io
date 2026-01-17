import { useMutation } from '@tanstack/react-query';
import { apiMutate } from '@/shared/api/apiClient';

type CreateCheckoutSessionPayload = {
    amount: number;
    interval?: string;
};

type CheckoutSessionResponse = {
    clientSecret: string;
    sessionId?: string;
};

export function useCreateCheckoutSessionMutation() {
    return useMutation<CheckoutSessionResponse, Error, CreateCheckoutSessionPayload>({
        mutationFn: (payload) =>
            apiMutate<CheckoutSessionResponse, CreateCheckoutSessionPayload>(
                '/stripe/checkout-session',
                'post',
                payload
            )
    });
}
