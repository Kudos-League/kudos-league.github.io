import React from 'react';
import { getEndpointUrl } from '@/shared/api/config';

export default function DiscordSignUpButton() {
    const handleDiscordSignUp = () => {
        const discordSignUpUrl = `${getEndpointUrl()}/users/discord/register`;
        window.location.href = discordSignUpUrl;
    };

    return (
        <button
            onClick={handleDiscordSignUp}
            className='w-10 h-10 rounded-full bg-[#7289DA] text-white font-bold text-lg flex items-center justify-center hover:bg-[#5b6eae] transition-colors'
            title='Sign up with Discord'
            aria-label='Sign up with Discord'
        >
            D
        </button>
    );
}
