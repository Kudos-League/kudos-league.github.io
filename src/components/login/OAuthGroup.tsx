import React from 'react';
import OAuthButton from './OAuthButton';

export default function OAuthGroup({ inviteToken }: { inviteToken?: string }) {
    return (
        <div className='flex justify-center gap-4'>
            <OAuthButton provider='discord' inviteToken={inviteToken} />
            <OAuthButton provider='google' inviteToken={inviteToken} />
        </div>
    );
}
