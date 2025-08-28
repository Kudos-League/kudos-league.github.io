import React from 'react';
import Button from '@/components/common/Button';
import { getEndpointUrl } from '@/shared/api/config';

type Provider = 'discord' | 'google';

const styles: Record<Provider, { bg: string; label: string; text: string }> = {
    discord: { bg: '!bg-[#7289DA]', label: 'Login with Discord', text: 'D' },
    google: { bg: '!bg-[#4285F4]', label: 'Login with Google', text: 'G' }
};

export default function OAuthButton({ provider }: { provider: Provider }) {
    const { bg, label, text } = styles[provider];

    const handle = () => {
        const url = `${getEndpointUrl()}/users/${provider}`;
        window.location.href = url;
    };

    return (
        <Button
            onClick={handle}
            className={`w-10 h-10 rounded-full ${bg} text-white font-bold text-lg flex items-center justify-center`}
            title={label}
            aria-label={label}
            shape='circle'
            variant='icon'
        >
            {text}
        </Button>
    );
}
