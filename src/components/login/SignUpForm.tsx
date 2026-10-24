import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { Alert, TinyHelpLink } from './fields';
import Input from '@/components/forms/Input';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';
import OAuthGroup from './OAuthGroup';
import { routes } from '@/routes';

type SignUpFormValues = {
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    agreedToTerms?: boolean;
};

type SignUpFormProps = {
    onSuccess?: () => void;
    onError?: (message: string) => void;
};

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const { register: registerUser } = useAuth();
    const form = useForm<SignUpFormValues>({ mode: 'onBlur' });
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const inviteToken = (searchParams.get('invite') || '').trim();
    const emailToken = (searchParams.get('emailToken') || '').trim();

    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setError] = useState<string | null>(null);
    const [successMessage, setSuccess] = useState<string | null>(null);
    const alertRef = React.useRef<HTMLDivElement>(null);

    const scrollToAlert = () => {
        // Wait for the alert to render before scrolling it into view so the
        // user always gets feedback, even when the submit button is below the
        // fold on mobile.
        requestAnimationFrame(() => {
            alertRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    };

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate('/');
    };

    if (!inviteToken) {
        return (
            <Auth title='Invite Required' onBack={handleBack}>
                <div className='space-y-4 text-sm text-gray-200 dark:text-gray-300'>
                    <p>
                        Kudos is currently invite-only. Ask an existing member
                        to share an invite link with you to create an account.
                    </p>
                    <p>
                        Already have an account?{' '}
                        <TinyHelpLink onClick={() => navigate('/login')}>
                            Log In
                        </TinyHelpLink>
                    </p>
                </div>
            </Auth>
        );
    }

    const onSubmit = async (
        values: SignUpFormValues & {
            password?: string;
            confirmPassword?: string;
        }
    ) => {
        const { username, email, password, confirmPassword } = values as any;

        if (password !== confirmPassword) {
            setSuccess(null);
            setError('Passwords do not match.');
            scrollToAlert();
            return;
        }

        if (!inviteToken) {
            setSuccess(null);
            setError(
                'Invite token missing. Please open the invite link again.'
            );
            scrollToAlert();
            return;
        }

        setError(null);
        setSuccess(null);
        try {
            setIsVerifying(true);
            const result = await registerUser(
                username,
                email,
                password,
                inviteToken,
                emailToken || undefined
            );
            setIsVerifying(false);

            if (typeof result === 'string') {
                setSuccess(result);
                scrollToAlert();
            }
            else {
                onSuccess?.();
                navigate('/');
            }
        }
        catch (err: any) {
            setIsVerifying(false);
            const message = (
                err?.message ||
                (typeof err === 'string' ? err : '') ||
                'Sign-up failed. Please try again.'
            ).replace(/^Error:\s*/, '');
            setError(message);
            onError?.(message);
            scrollToAlert();
        }
    };

    const onInvalid = (errors: Record<string, any>) => {
        // react-hook-form blocks submission silently when fields are invalid.
        // Surface the first specific message at the top so the user knows why
        // "nothing happened" after tapping Sign Up.
        const firstMessage = Object.values(errors)
            .map((e) => e?.message)
            .find((m): m is string => typeof m === 'string' && m.length > 0);
        setSuccess(null);
        setError(
            firstMessage ||
                'Please fill in all required fields correctly before signing up.'
        );
        scrollToAlert();
    };

    return (
        <Auth title='Create your account' onBack={handleBack}>
            <Form
                methods={form}
                onSubmit={onSubmit}
                onInvalid={onInvalid}
                className='space-y-6'
            >
                <input
                    type='hidden'
                    name='inviteToken'
                    value={inviteToken}
                    readOnly
                />

                <div ref={alertRef} className='scroll-mt-4'>
                    {errorMessage && <Alert tone='error'>{errorMessage}</Alert>}
                    {successMessage && (
                        <Alert tone='success'>{successMessage}</Alert>
                    )}
                </div>
                <div>
                    <div className='col-span-2'>
                        <FormField name='username'>
                            <Input
                                name='username'
                                label=''
                                placeholder='Username'
                                form={form}
                                registerOptions={{
                                    required: 'Username is required',
                                    minLength: {
                                        value: 3,
                                        message:
                                            'Username must be at least 3 characters'
                                    }
                                }}
                            />
                        </FormField>
                    </div>
                    <FormField name='email'>
                        <Input
                            name='email'
                            label=''
                            placeholder='Email'
                            form={form}
                            registerOptions={{
                                required: 'Email is required',
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: 'Enter a valid email'
                                }
                            }}
                            htmlInputType='email'
                        />
                    </FormField>
                    <FormField name='password'>
                        <Input
                            name='password'
                            label=''
                            placeholder='Password'
                            form={form}
                            registerOptions={{
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message:
                                        'Password must be at least 6 characters'
                                }
                            }}
                            htmlInputType='password'
                        />
                    </FormField>
                    <FormField name='confirmPassword'>
                        <Input
                            name='confirmPassword'
                            label=''
                            placeholder='Confirm Password'
                            form={form}
                            registerOptions={{
                                required: 'Please confirm your password'
                            }}
                            htmlInputType='password'
                        />
                    </FormField>
                </div>

                <FormField name='agreedToTerms' noMargin>
                    <label className='flex items-start gap-2 text-sm text-gray-200 dark:text-gray-300'>
                        <input
                            type='checkbox'
                            className='mt-1 h-4 w-4 shrink-0'
                            {...form.register('agreedToTerms', {
                                required:
                                    'You must agree to the Terms & Conditions'
                            })}
                        />
                        <span>
                            I agree to the{' '}
                            <a
                                href={routes.terms}
                                target='_blank'
                                rel='noreferrer'
                                className='underline hover:text-white'
                            >
                                Terms &amp; Conditions
                            </a>
                        </span>
                    </label>
                </FormField>

                <Button type='submit' disabled={isVerifying} className='w-full'>
                    {isVerifying ? 'Loading...' : 'Sign Up'}
                </Button>

                <p className='text-center text-sm/6 text-gray-200 dark:text-gray-300'>
                    or sign up with
                </p>
                <OAuthGroup inviteToken={inviteToken} emailToken={emailToken} />

                <p className='text-center text-sm/6 text-gray-200 dark:text-gray-300'>
                    Already have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/login')}>
                        Log In
                    </TinyHelpLink>
                </p>
            </Form>
        </Auth>
    );
}
