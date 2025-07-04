import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Login from '@/components/login/Login';

export default function LoginPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const errorFromQuery = searchParams.get('error');

    return (
        <Login
            onSuccess={() => navigate('/feed')}
            onError={(err) => console.error('Login error:', err)}
            initialError={errorFromQuery || undefined}
        />
    );
}

