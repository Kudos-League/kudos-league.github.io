import React from 'react';
import Button from '@/components/common/Button';
import { getEndpointUrl } from '@/shared/api/config';

type Provider = 'discord' | 'google';

const styles: Record<Provider, { bg: string; label: string; text: string }> = {
    discord: { bg: '!bg-[#7289DA]', label: 'Login with Discord', text: 'D' },
    google: { bg: '!bg-[#4285F4]', label: 'Login with Google', text: 'G' }
};

export default function OAuthButton({
    provider,
    inviteToken,
    emailToken
}: {
    provider: Provider;
    inviteToken?: string;
    emailToken?: string;
}) {
    const { bg, label, text } = styles[provider];

    const handle = () => {
        const params = new URLSearchParams();
        if (inviteToken && inviteToken.trim()) {
            params.set('inviteToken', inviteToken.trim());
        }
        if (emailToken && emailToken.trim()) {
            params.set('emailToken', emailToken.trim());
        }
        const query = params.toString();
        const url = `${getEndpointUrl()}/users/${provider}${query ? `?${query}` : ''}`;
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
