import React, { useState } from 'react';
import Auth from '@/components/login/Auth';
import Button from '@/components/common/Button';
import { Alert, TextInput } from '@/components/login/fields';
import { requestPasswordReset } from '@/shared/api/actions';
import { useNavigate } from 'react-router-dom';
import { routes } from '@/routes';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await requestPasswordReset(email);
            setSubmitted(true);
        }
        catch (err: any) {
            setSubmitted(true);
        }
    };

    if (submitted) {
        return (
            <Auth title='Check your email'>
                <div className='space-y-4'>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        If an account exists for {email}, you’ll receive an
                        email with a link to reset your password.
                    </p>
                    <Button
                        onClick={() => navigate(routes.login)}
                        className='w-full'
                    >
                        Back to Login
                    </Button>
                </div>
            </Auth>
        );
    }

    return (
        <Auth title='Forgot your password?'>
            <form onSubmit={onSubmit} className='space-y-6'>
                <div>
                    <TextInput
                        placeholder='Email address'
                        aria-label='Email address'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <Button type='submit' className='w-full'>
                        Send reset link
                    </Button>
                </div>
                {error && (
                    <Alert tone='error' title='Error'>
                        <p>{error}</p>
                    </Alert>
                )}
            </form>
        </Auth>
    );
}
