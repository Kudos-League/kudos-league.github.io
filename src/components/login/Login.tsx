import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DiscordLoginButton from './DiscordLoginButton';
import GoogleLoginButton from './GoogleLoginButton';

type LoginFormProps = {
	onSuccess?: () => void;
	onError?: (errorMessage: string) => void;
	initialError?: string;
};

type FormValues = {
    username: string;
    password: string;
};

export default function LoginForm({ onSuccess, onError, initialError }: LoginFormProps) {
    const { login, token, logout } = useAuth();
    const {
        register: formRegister,
        handleSubmit,
        setValue
    } = useForm<FormValues>();
    const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const onSubmit = async (data: FormValues) => {
        setErrorMessage(null);
        try {
            await login(data);
            onSuccess?.();
        }
        catch (error: any) {
            const message = error.message || 'Login failed';
            setErrorMessage(message);
            onError?.(message);
        }
    };

    if (token) {
        return (
            <div className='p-4'>
                <p>You are logged in.</p>
                <button
                    onClick={logout}
                    className='bg-red-500 text-white px-4 py-2 mt-2 rounded'
                >
                    Log Out
                </button>
            </div>
        );
    }

    return (
        <div className='min-h-screen flex items-center justify-center relative'>
            <img
                src='/images/welcome.png'
                className='absolute inset-0 w-full h-full object-cover opacity-80 -z-10'
            />
            <div className='bg-white p-8 rounded-lg shadow-lg max-w-md w-full'>
                <h1 className='text-3xl font-bold text-center mb-6'>Welcome</h1>

                <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <input
                        {...formRegister('username')}
                        className='w-full p-3 rounded bg-gray-100'
                        placeholder='Username'
                        onChange={(e) => setValue('username', e.target.value)}
                    />
                    <div className='relative'>
                        <input
                            {...formRegister('password')}
                            className='w-full p-3 rounded bg-gray-100 pr-10'
                            placeholder='Password'
                            type={passwordVisible ? 'text' : 'password'}
                            onChange={(e) =>
                                setValue('password', e.target.value)
                            }
                        />
                        <button
                            type='button'
                            onClick={() => setPasswordVisible((prev) => !prev)}
                            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500'
                            tabIndex={-1}
                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        >
                            {passwordVisible ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <div className='text-right text-sm mb-2'>
                        <button
                            type='button'
                            onClick={() => navigate('/forgot-password')}
                            className='text-blue-500'
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type='submit'
                        className='w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700'
                    >
                        Log In
                    </button>

                    <p className='text-center text-sm text-gray-500'>
                        or log in with
                    </p>

                    <div className='flex justify-center gap-4'>
                        <DiscordLoginButton />
                        <GoogleLoginButton />
                    </div>

                    <div className='text-center text-sm mt-4'>
                        Don&apos;t have an account?{' '}
                        <button
                            type='button'
                            onClick={() => navigate('/sign-up')}
                            className='text-blue-500 font-bold'
                        >
                            Sign Up
                        </button>
                    </div>

                    {errorMessage && (
                        <p className='text-red-500 text-center mt-2'>
                            {errorMessage}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
