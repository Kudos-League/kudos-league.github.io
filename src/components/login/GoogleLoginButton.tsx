import React from 'react';
import { getEndpointUrl } from '@/shared/api/config';

export default function DiscordLoginButton() {
    const handleLogin = () => {
        const loginURL = `${getEndpointUrl()}/users/google`;
        window.location.href = loginURL;
    };

    return (
        <button
            onClick={handleLogin}
            className='w-10 h-10 rounded-full bg-[#7289DA] text-white font-bold text-lg flex items-center justify-center'
            title='Login with Google'
            aria-label='Login with Google'
        >
            G
        </button>
    );
}
