import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Login from '@/components/login/LoginForm';

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const errorFromQuery = searchParams.get('error');
    const returnUrl = searchParams.get('returnUrl');

    const handleLoginSuccess = () => {
        // If there's a return URL, go there; otherwise go to home (original was '/feed' but that route doesn't exist)
        if (returnUrl) {
            navigate(decodeURIComponent(returnUrl));
        }
        else {
            navigate('/');
        }
    };

    return (
        <Login
            onSuccess={handleLoginSuccess}
            onError={(err) => console.error('Login error:', err)}
            initialError={errorFromQuery || undefined}
        />
    );
}
