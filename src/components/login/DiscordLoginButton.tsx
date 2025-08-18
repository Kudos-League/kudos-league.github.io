import React from 'react';
import { getEndpointUrl } from '@/shared/api/config';
import Button from '../common/Button';

export default function DiscordLoginButton() {
    const handleDiscordLogin = () => {
        const discordLoginUrl = `${getEndpointUrl()}/users/discord`;
        window.location.href = discordLoginUrl;
    };

    return (
        <Button
            onClick={handleDiscordLogin}
            className='w-10 h-10 rounded-full !bg-[#7289DA] text-white font-bold text-lg flex items-center justify-center'
            title='Login with Discord'
            aria-label='Login with Discord'
            shape='circle'
        >
            D
        </Button>
    );
}
