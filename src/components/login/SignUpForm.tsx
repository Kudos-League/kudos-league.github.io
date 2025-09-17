import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { Alert, TinyHelpLink } from './fields';
import Input from '@/components/forms/Input';
import OAuthGroup from './OAuthGroup';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';

type SignUpFormValues = {
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
};

type SignUpFormProps = {
    onSuccess?: () => void;
    onError?: (message: string) => void;
};

function AccessGate({ onContinue }: { onContinue: () => void }) {
    const [accessError, setAccessError] = useState<string | null>(null);
    const navigate = useNavigate();
    const form = useForm<{ accessPassword: string }>({ mode: 'onBlur', defaultValues: { accessPassword: '' } });

    const handleAccessSubmit = (values: { accessPassword: string }) => {
        if (values.accessPassword === 'kudos') {
            setAccessError(null);
            onContinue();
        }
        else {
            setAccessError('Incorrect password');
        }
    };

    return (
        <Auth title='Access Required'>
            <Form methods={form} onSubmit={handleAccessSubmit} className='space-y-6'>
                <FormField name='accessPassword' label=''>
                    <Input
                        name='accessPassword'
                        label=''
                        placeholder='Access Password'
                        form={form}
                        htmlInputType='password'
                    />
                </FormField>

                <Button type='submit' className='w-full'>
                    Continue
                </Button>

                <p className='text-center text-sm/6 text-gray-500 dark:text-gray-400'>
                    Already have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/login')}>
                        Log In
                    </TinyHelpLink>
                </p>

                {accessError && <Alert tone='error'>{accessError}</Alert>}
            </Form>
        </Auth>
    );
}

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const { register: registerUser } = useAuth();
    const form = useForm<SignUpFormValues>({ mode: 'onBlur' });
    const navigate = useNavigate();

    const [authorized, setAuthorized] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setError] = useState<string | null>(null);
    const [successMessage, setSuccess] = useState<string | null>(null);

    if (!authorized)
        return <AccessGate onContinue={() => setAuthorized(true)} />;

    const onSubmit = async (values: SignUpFormValues & { password?: string; confirmPassword?: string }) => {
        const { username, email, password, confirmPassword } = values as any;

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError(null);
        try {
            setIsVerifying(true);
            const result = await registerUser(username, email, password);
            setIsVerifying(false);

            if (typeof result === 'string') {
                setSuccess(result);
            }
            else {
                onSuccess?.();
                navigate('/');
            }
        }
        catch (err: any) {
            setIsVerifying(false);
            let msg = 'Sign-up failed';
            if (err?.response?.data?.message) msg = err.response.data.message;
            else if (err?.message) msg = err.message;
            setError(msg);
            onError?.(msg);
        }
    };

    return (
        <Auth title='Create your account'>
            <Form methods={form} onSubmit={onSubmit} className='space-y-6' serverError={errorMessage}>
                <div>
                    <div className='col-span-2'>
                        <FormField name='username'>
                            <Input
                                name='username'
                                label=''
                                placeholder='Username'
                                form={form}
                                registerOptions={{ required: 'Username is required', minLength: { value: 3, message: 'Username must be at least 3 characters' } }}
                            />
                        </FormField>
                    </div>
                    <FormField name='email'>
                        <Input
                            name='email'
                            label=''
                            placeholder='Email'
                            form={form}
                            registerOptions={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } }}
                            htmlInputType='email'
                        />
                    </FormField>
                    <FormField name='password'>
                        <Input
                            name='password'
                            label=''
                            placeholder='Password'
                            form={form}
                            registerOptions={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                            htmlInputType='password'
                        />
                    </FormField>
                    <FormField name='confirmPassword'>
                        <Input
                            name='confirmPassword'
                            label=''
                            placeholder='Confirm Password'
                            form={form}
                            registerOptions={{ required: 'Please confirm your password' }}
                            htmlInputType='password'
                        />
                    </FormField>
                </div>

                <Button type='submit' disabled={isVerifying} className='w-full'>
                    {isVerifying ? 'Loading...' : 'Sign Up'}
                </Button>

                <p className='text-center text-sm/6 text-gray-500 dark:text-gray-400'>
                    or sign up with
                </p>
                <OAuthGroup />

                <p className='text-center text-sm/6 text-gray-500 dark:text-gray-400'>
                    Already have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/login')}>
                        Log In
                    </TinyHelpLink>
                </p>

                {successMessage && (
                    <Alert tone='success'>{successMessage}</Alert>
                )}
            </Form>
        </Auth>
    );
}
