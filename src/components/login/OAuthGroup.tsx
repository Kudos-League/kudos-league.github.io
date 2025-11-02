import React from 'react';
import OAuthButton from './OAuthButton';

export default function OAuthGroup({ inviteToken, emailToken }: { inviteToken?: string; emailToken?: string }) {
    return (
        <div className='flex justify-center gap-4'>
            <OAuthButton provider='discord' inviteToken={inviteToken} emailToken={emailToken} />
            <OAuthButton provider='google' inviteToken={inviteToken} emailToken={emailToken} />
        </div>
    );
}
