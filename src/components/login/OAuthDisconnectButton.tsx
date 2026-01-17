import React from 'react';
import Button from '@/components/common/Button';
import { useDisconnectOAuthMutation } from '@/shared/api/mutations/users';
import { useAuth } from '@/contexts/useAuth';

type Provider = 'discord' | 'google';

type Props = {
    provider: Provider;
    className?: string;
    children?: React.ReactNode;
    title?: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onSuccess?: () => void;
    onError?: (message: string) => void;
};

export default function OAuthDisconnectButton({
    provider,
    className,
    children,
    title,
    variant = 'secondary',
    onSuccess,
    onError
}: Props) {
    const { token, updateUser } = useAuth();
    const disconnectMutation = useDisconnectOAuthMutation();

    const handle = async () => {
        if (!token || disconnectMutation.isPending) return;
        try {
            await disconnectMutation.mutateAsync({ provider });
            if (provider === 'discord')
                updateUser({ discordID: undefined as any });
            if (provider === 'google')
                updateUser({ googleID: undefined as any });
            onSuccess?.();
        }
        catch (e: any) {
            const msg =
                e?.response?.data?.message || 'Failed to disconnect provider';
            onError?.(msg);
        }
    };

    return (
        <Button
            onClick={handle}
            disabled={disconnectMutation.isPending}
            variant={variant}
            className={className}
            title={title}
        >
            {children ?? (disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect')}
        </Button>
    );
}
