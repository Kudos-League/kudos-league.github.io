import React from 'react';
import { getEndpointUrl } from '@/shared/api/config';

export default function GoogleSignUpButton() {
    const handleGoogleSignUp = () => {
        const googleSignUpUrl = `${getEndpointUrl()}/users/google/register`;
        window.location.href = googleSignUpUrl;
    };

    return (
        <button
            onClick={handleGoogleSignUp}
            className='w-10 h-10 rounded-full bg-[#4285F4] text-white font-bold text-lg flex items-center justify-center hover:bg-[#357ae8] transition-colors'
            title='Sign up with Google'
            aria-label='Sign up with Google'
        >
            G
        </button>
    );
}
