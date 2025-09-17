import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { Alert, PasswordInput, TextInput, TinyHelpLink } from './fields';
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
    const [accessPassword, setAccessPassword] = useState('');
    const [accessError, setAccessError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessPassword === 'kudos') {
            setAccessError(null);
            onContinue();
        }
        else {
            setAccessError('Incorrect password');
        }
    };

    return (
        <Auth title='Access Required'>
            <form onSubmit={handleAccessSubmit} className='space-y-6'>
                <TextInput
                    placeholder='Access Password'
                    aria-label='Access Password'
                    type='password'
                    onChange={(e) => setAccessPassword(e.target.value)}
                />
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
            </form>
        </Auth>
    );
}

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const { register: registerUser } = useAuth();
    const form = useForm<SignUpFormValues>({ mode: 'onBlur' });
    const navigate = useNavigate();

    const [authorized, setAuthorized] = useState(false);
    const [pwVisible, setPwVisible] = useState(false);
    const [cpwVisible, setCpwVisible] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setError] = useState<string | null>(null);
    const [successMessage, setSuccess] = useState<string | null>(null);

    if (!authorized)
        return <AccessGate onContinue={() => setAuthorized(true)} />;

    const onSubmit = async (values: SignUpFormValues & { password?: string; confirmPassword?: string }) => {
        const { username, email, password, confirmPassword } = values as any;

        // basic client-side checks already applied by rules, but keep confirm/password match here
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
                        <FormField name='username' label='Username'>
                            <Controller
                                name='username'
                                control={form.control}
                                rules={{ required: 'Username is required', minLength: { value: 3, message: 'Username must be at least 3 characters' } }}
                                render={({ field }) => (
                                    <TextInput rounded='top' placeholder='Username' aria-label='Username' {...field} />
                                )}
                            />
                        </FormField>
                    </div>
                    <FormField name='email' label='Email'>
                        <Controller
                            name='email'
                            control={form.control}
                            rules={{ required: 'Email is required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' } }}
                            render={({ field }) => (
                                <TextInput rounded='none' placeholder='Email' aria-label='Email' type='email' {...field} />
                            )}
                        />
                    </FormField>
                    <FormField name='password' label='Password'>
                        <Controller
                            name='password'
                            control={form.control}
                            rules={{ required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } }}
                            render={({ field }) => (
                                <PasswordInput rounded='none' placeholder='Password' aria-label='Password' visible={pwVisible} setVisible={setPwVisible} value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />
                            )}
                        />
                    </FormField>
                    <FormField name='confirmPassword' label='Confirm Password'>
                        <Controller
                            name='confirmPassword'
                            control={form.control}
                            rules={{ required: 'Please confirm your password' }}
                            render={({ field }) => (
                                <PasswordInput rounded='bottom' placeholder='Confirm Password' aria-label='Confirm Password' visible={cpwVisible} setVisible={setCpwVisible} value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />
                            )}
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
