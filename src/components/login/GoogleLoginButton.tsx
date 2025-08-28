import React from 'react';
import { getEndpointUrl } from '@/shared/api/config';
import Button from '../common/Button';

export default function DiscordLoginButton() {
    const handleLogin = () => {
        const loginURL = `${getEndpointUrl()}/users/google`;
        window.location.href = loginURL;
    };

    return (
        <Button
            onClick={handleLogin}
            className='w-10 h-10 rounded-full !bg-[#4285F4] text-white font-bold text-lg flex items-center justify-center'
            title='Login with Google'
            aria-label='Login with Google'
            shape='circle'
        >
            G
        </Button>
    );
}
