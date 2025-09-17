import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { PasswordInput, TextInput, TinyHelpLink } from './fields';
import OAuthGroup from './OAuthGroup';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';

type LoginFormProps = {
    onSuccess?: () => void;
    onError?: (errorMessage: string) => void;
    initialError?: string;
};

type FormValues = {
    username: string;
    password: string;
};

export default function LoginForm({
    onSuccess,
    onError,
    initialError
}: LoginFormProps) {
    const { login, token, logout } = useAuth();
    const methods = useForm<FormValues>({ mode: 'onBlur' });
    const { setValue } = methods;
    const [errorMessage, setErrorMessage] = useState<string | null>(initialError ?? null);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const navigate = useNavigate();

    const getErrorMessage = (error: any): string => {
        const status = error?.response?.status;
        const responseMessage = error?.response?.data?.message;
        const responseError = error?.response?.data?.error;

        switch (status) {
        case 400:
            return 'Invalid username or password format. Please check your credentials.';
        case 401:
            return 'Invalid username or password. Please try again.';
        case 403:
            if (
                responseMessage?.toLowerCase().includes('email') ||
                    responseMessage?.toLowerCase().includes('verify') ||
                    responseMessage?.toLowerCase().includes('verification') ||
                    responseMessage?.toLowerCase().includes('unverified')
            ) {
                return 'Please verify your email address before logging in. Check your inbox for a verification link.';
            }
            if (
                responseMessage?.toLowerCase().includes('disabled') ||
                    responseMessage?.toLowerCase().includes('suspended') ||
                    responseMessage?.toLowerCase().includes('banned')
            ) {
                return 'Your account has been restricted. Contact support for assistance.';
            }
            return 'Your account needs verification. Please check your email for a verification link, or contact support if you need help.';
        case 409:
            return 'You already have an account with that username or email. Please Log In.';
        case 429:
            return 'Too many login attempts. Please wait a few minutes before trying again.';
        case 500:
            return 'Server error occurred. Please try again in a few moments.';
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
        default:
            if (!error?.response)
                return 'Unable to connect to server. Please check your internet connection.';
            if (responseMessage && typeof responseMessage === 'string') {
                if (
                    responseMessage.toLowerCase().includes('email') ||
                        responseMessage.toLowerCase().includes('verify')
                ) {
                    return `Email verification required: ${responseMessage}`;
                }
                return responseMessage;
            }
            if (responseError && typeof responseError === 'string')
                return responseError;
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
                <p className='mb-3'>You are logged in.</p>
                <Button onClick={logout} variant='danger'>
                    Log Out
                </Button>
            </div>
        );
    }

    return (
        <Auth title='Sign in to your account'>
            <Form methods={methods} onSubmit={onSubmit} className='space-y-6' serverError={errorMessage}>
                <div>
                    <div className='col-span-2'>
                        <FormField name='username' label='Username'>
                            <Controller
                                name='username'
                                control={methods.control}
                                rules={{ required: 'Username is required' }}
                                render={({ field }) => (
                                    <TextInput
                                        rounded='top'
                                        placeholder='Username'
                                        aria-label='Username'
                                        value={field.value || ''}
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setValue('username', e.target.value);
                                        }}
                                        onBlur={field.onBlur}
                                    />
                                )}
                            />
                        </FormField>
                    </div>
                    <FormField name='password' helper=''>
                        <Controller
                            name='password'
                            control={methods.control}
                            rules={{ required: 'Password is required' }}
                            render={({ field }) => (
                                <PasswordInput
                                    rounded='bottom'
                                    placeholder='Password'
                                    aria-label='Password'
                                    visible={passwordVisible}
                                    setVisible={setPasswordVisible}
                                    value={field.value || ''}
                                    onChange={(e) => {
                                        field.onChange(e);
                                        setValue('password', e.target.value);
                                    }}
                                    onBlur={field.onBlur}
                                />
                            )}
                        />
                    </FormField>
                </div>

                <div className='flex items-center justify-between'>
                    <div />
                    <div className='text-sm/6'>
                        <TinyHelpLink
                            onClick={() => navigate('/forgot-password')}
                        >
                            Forgot password?
                        </TinyHelpLink>
                    </div>
                </div>

                <div>
                    <Button
                        type='submit'
                        className='flex w-full justify-center'
                    >
                        Log In
                    </Button>
                </div>

                <p className='text-center text-sm/6 text-gray-500 dark:text-gray-400'>
                    or log in with
                </p>
                <OAuthGroup />

                <p className='text-center text-sm/6 text-gray-500 dark:text-gray-400'>
                    Don&apos;t have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/sign-up')}>
                        Sign Up
                    </TinyHelpLink>
                </p>
            </Form>
        </Auth>
    );
}
