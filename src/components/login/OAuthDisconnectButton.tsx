import React from 'react';
import Button from '@/components/common/Button';
import { disconnectProvider } from '@/shared/api/actions';
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
    const [pending, setPending] = React.useState(false);

    const handle = async () => {
        if (!token || pending) return;
        try {
            setPending(true);
            await disconnectProvider(provider, token);
            if (provider === 'discord') updateUser({ discordID: undefined as any });
            if (provider === 'google') updateUser({ googleID: undefined as any });
            onSuccess?.();
        }
        catch (e: any) {
            const msg =
                e?.response?.data?.message || 'Failed to disconnect provider';
            onError?.(msg);
        }
        finally {
            setPending(false);
        }
    };

    return (
        <Button
            onClick={handle}
            disabled={pending}
            variant={variant}
            className={className}
            title={title}
        >
            {children ?? (pending ? 'Disconnecting…' : 'Disconnect')}
        </Button>
    );
}

