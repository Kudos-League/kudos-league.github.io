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

    const getErrorMessage = (error: any): string => {
        // Handle different types of login errors with specific, helpful messages
        
        const status = error?.response?.status;
        const responseMessage = error?.response?.data?.message;
        const responseError = error?.response?.data?.error;
        
        console.log('Login error details:', { status, responseMessage, responseError, error });
        
        // Handle specific HTTP status codes
        switch (status) {
        case 400:
            return 'Invalid username or password format. Please check your credentials.';
                
        case 401:
            return 'Invalid username or password. Please try again.';
                
        case 403:
            // This is likely an email verification issue
            if (responseMessage?.toLowerCase().includes('email') || 
                    responseMessage?.toLowerCase().includes('verify') ||
                    responseMessage?.toLowerCase().includes('verification') ||
                    responseMessage?.toLowerCase().includes('unverified')) {
                return `Please verify your email address before logging in. Check your inbox for a verification link.`;
            }
            if (responseMessage?.toLowerCase().includes('disabled') ||
                    responseMessage?.toLowerCase().includes('suspended') ||
                    responseMessage?.toLowerCase().includes('banned')) {
                return `Your account has been restricted. Contact support for assistance.`;
            }
            // Default 403 message - likely email verification
            return 'Your account needs verification. Please check your email for a verification link, or contact support if you need help.';
                
        case 429:
            return 'Too many login attempts. Please wait a few minutes before trying again.';
                
        case 500:
            return 'Server error occurred. Please try again in a few moments.';
                
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
                
        default:
            // Handle network errors
            if (!error?.response) {
                return 'Unable to connect to server. Please check your internet connection.';
            }
                
            // Handle other errors with backend message if available
            if (responseMessage && typeof responseMessage === 'string') {
                // Make backend messages more user-friendly
                if (responseMessage.toLowerCase().includes('email') || 
                        responseMessage.toLowerCase().includes('verify')) {
                    return `Email verification required: ${responseMessage}`;
                }
                return responseMessage;
            }
                
            if (responseError && typeof responseError === 'string') {
                return responseError;
            }
                
            return error?.message || 'Login failed. Please try again.';
        }
    };

    const onSubmit = async (data: FormValues) => {
        setErrorMessage(null);
        try {
            await login(data);
            onSuccess?.();
        }
        catch (error: any) {
            const message = getErrorMessage(error);
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
                        <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                            <div className='flex items-start'>
                                <div className='flex-shrink-0'>
                                    <span className='text-red-400 text-lg'>⚠️</span>
                                </div>
                                <div className='ml-3 flex-1'>
                                    <p className='text-sm text-red-700 font-medium'>
                                        Login Failed
                                    </p>
                                    <p className='text-sm text-red-600 mt-1'>
                                        {errorMessage}
                                    </p>
                                    {(errorMessage.toLowerCase().includes('verification') || 
                                      errorMessage.toLowerCase().includes('verify') ||
                                      errorMessage.toLowerCase().includes('email')) && (
                                        <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded'>
                                            <p className='text-xs text-blue-700 font-medium flex items-center'>
                                                <span className='mr-2'>💡</span>
                                                What to do next:
                                            </p>
                                            <ul className='text-xs text-blue-600 mt-2 space-y-1 ml-4'>
                                                <li>• Check your email inbox (including spam folder)</li>
                                                <li>• Look for a verification email from Kudos League</li>
                                                <li>• Click the verification link in the email</li>
                                                <li>• If you can&apos;t find it, contact support</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
