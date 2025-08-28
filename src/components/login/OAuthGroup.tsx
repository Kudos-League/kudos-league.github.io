import React from 'react';
import OAuthButton from './OAuthButton';

export default function OAuthGroup() {
    return (
        <div className="flex justify-center gap-4">
            <OAuthButton provider="discord" />
            <OAuthButton provider="google" />
        </div>
    );
}