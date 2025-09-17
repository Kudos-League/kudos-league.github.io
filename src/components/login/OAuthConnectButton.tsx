import React from 'react';
import Button from '@/components/common/Button';
import { getEndpointUrl } from '@/shared/api/config';
import { useAuth } from '@/contexts/useAuth';

type Provider = 'discord' | 'google';

type Props = {
    provider: Provider;
    className?: string;
    children?: React.ReactNode;
    title?: string;
    variant?: 'primary' | 'secondary' | 'icon';
};

export default function OAuthConnectButton({
    provider,
    className,
    children,
    title,
    variant = 'primary'
}: Props) {
    const { token } = useAuth();

    const handle = () => {
        if (!token) return;
        const url = `${getEndpointUrl()}/users/${provider}?linkToken=${encodeURIComponent(
            token
        )}`;
        window.location.href = url;
    };

    return (
        <Button onClick={handle} variant={variant} className={className} title={title}>
            {children ?? 'Connect'}
        </Button>
    );
}

