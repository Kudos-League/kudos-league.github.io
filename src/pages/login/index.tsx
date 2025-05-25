import React from 'react';
import { useNavigate } from 'react-router-dom';
import Login from '@/components/login/Login';

export default function LoginPage() {
    const navigate = useNavigate();

    return (
        <Login onSuccess={() => navigate('/feed')} onError={console.error} />
    );
}
