import React, { useMemo, useState } from 'react';
import Auth from '@/components/login/Auth';
import Button from '@/components/common/Button';
import { Alert, PasswordInput } from '@/components/login/fields';
import { apiMutate } from '@/shared/api/apiClient';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { routes } from '@/routes';

export default function ResetPasswordPage() {
    const [sp] = useSearchParams();
    const token = useMemo(() => sp.get('token') || '', [sp]);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [visible1, setVisible1] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!token) {
            setError('Invalid or missing token.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        try {
            await apiMutate('/users/reset-password', 'post', {
                token,
                password
            });
            setDone(true);
        }
        catch (err: any) {
            setError(
                err?.response?.data?.message || 'Unable to reset password.'
            );
        }
    };

    if (done) {
        return (
            <Auth title='Password updated'>
                <div className='space-y-4'>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                        Your password has been reset. You can now log in with
                        your new password.
                    </p>
                    <Button
                        onClick={() => navigate(routes.login)}
                        className='w-full'
                    >
                        Go to Login
                    </Button>
                </div>
            </Auth>
        );
    }

    return (
        <Auth title='Set a new password'>
            <form onSubmit={onSubmit} className='space-y-6'>
                <div>
                    <PasswordInput
                        placeholder='New password'
                        aria-label='New password'
                        visible={visible1}
                        setVisible={setVisible1}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <PasswordInput
                        placeholder='Confirm password'
                        aria-label='Confirm password'
                        visible={visible2}
                        setVisible={setVisible2}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                    />
                </div>
                <div>
                    <Button type='submit' className='w-full'>
                        Reset password
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
