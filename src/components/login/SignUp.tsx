import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type SignUpFormProps = {
    onSuccess?: () => void;
    onError?: (errorMessage: string) => void;
};

type SignUpFormValues = {
    username: string;
    email: string;
};

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const { register: registerUser } = useAuth();
    const form = useForm<SignUpFormValues>();
    const navigate = useNavigate();

    // Password gate state
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [accessPassword, setAccessPassword] = useState('');
    const [accessError, setAccessError] = useState<string | null>(null);

    const [formPassword, setFormPassword] = useState({
        value: '',
        visible: false
    });
    const [confirmPassword, setConfirmPassword] = useState({
        value: '',
        visible: false
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (accessPassword === 'kudos') {
            setIsAuthorized(true);
            setAccessError(null);
        }
        else {
            setAccessError('Incorrect password');
        }
    };

    const onSubmit = async () => {
        const { username, email } = form.getValues();
        if (!username || !email || !formPassword.value) {
            setErrorMessage('All fields are required.');
            return;
        }

        if (formPassword.value !== confirmPassword.value) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        try {
            setIsVerifying(true);
            await registerUser(username, email, formPassword.value);
            setIsVerifying(false);
            onSuccess?.();
            navigate('/feed');
        }
        catch (err: any) {
            setIsVerifying(false);
            const message = err?.message || 'Sign-up failed';
            setErrorMessage(message);
            onError?.(message);
        }
    };

    // Password gate screen
    if (!isAuthorized) {
        return (
            <div className='min-h-screen flex items-center justify-center relative'>
                <img
                    src='/images/login_background.jpg'
                    className='absolute inset-0 w-full h-full object-cover opacity-80 -z-10'
                />
                <div className='bg-white p-8 rounded-lg shadow-lg max-w-md w-full'>
                    <h1 className='text-3xl font-bold text-center mb-6'>Access Required</h1>
                    <p className='text-gray-600 text-center mb-6'>
                        Please enter the access password to continue with sign-up.
                    </p>

                    <form onSubmit={handleAccessSubmit} className='space-y-4'>
                        <input
                            className='w-full p-3 rounded bg-gray-100'
                            placeholder='Access Password'
                            type='password'
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value)}
                        />
                        
                        <button
                            type='submit'
                            className='w-full py-3 rounded text-white font-bold bg-blue-600 hover:bg-blue-700'
                        >
                            Continue
                        </button>

                        <div className='text-center text-sm mt-4'>
                            Already have an account?{' '}
                            <button
                                type='button'
                                onClick={() => navigate('/login')}
                                className='text-blue-500 font-bold'
                            >
                                Log In
                            </button>
                        </div>

                        {accessError && (
                            <p className='text-red-500 text-center mt-2'>
                                {accessError}
                            </p>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    // Original sign-up form
    return (
        <div className='min-h-screen flex items-center justify-center relative'>
            <img
                src='/images/login_background.jpg'
                className='absolute inset-0 w-full h-full object-cover opacity-80 -z-10'
            />
            <div className='bg-white p-8 rounded-lg shadow-lg max-w-md w-full'>
                <h1 className='text-3xl font-bold text-center mb-6'>Sign Up</h1>

                <form
                    onSubmit={(e) => e.preventDefault()}
                    className='space-y-4'
                >
                    <input
                        className='w-full p-3 rounded bg-gray-100'
                        placeholder='Username'
                        {...form.register('username')}
                    />
                    <input
                        className='w-full p-3 rounded bg-gray-100'
                        placeholder='Email'
                        type='email'
                        {...form.register('email')}
                    />
                    <div className='relative'>
                        <input
                            className='w-full p-3 rounded bg-gray-100 pr-10'
                            placeholder='Password'
                            type={formPassword.visible ? 'text' : 'password'}
                            value={formPassword.value}
                            onChange={(e) =>
                                setFormPassword({
                                    ...formPassword,
                                    value: e.target.value
                                })
                            }
                        />
                        <button
                            type='button'
                            onClick={() =>
                                setFormPassword((prev) => ({
                                    ...prev,
                                    visible: !prev.visible
                                }))
                            }
                            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500'
                        >
                            {formPassword.visible ? '🙈' : '👁️'}
                        </button>
                    </div>
                    <div className='relative'>
                        <input
                            className='w-full p-3 rounded bg-gray-100 pr-10'
                            placeholder='Confirm Password'
                            type={confirmPassword.visible ? 'text' : 'password'}
                            value={confirmPassword.value}
                            onChange={(e) =>
                                setConfirmPassword({
                                    ...confirmPassword,
                                    value: e.target.value
                                })
                            }
                        />
                        <button
                            type='button'
                            onClick={() =>
                                setConfirmPassword((prev) => ({
                                    ...prev,
                                    visible: !prev.visible
                                }))
                            }
                            className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500'
                        >
                            {confirmPassword.visible ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <button
                        type='button'
                        onClick={onSubmit}
                        disabled={isVerifying}
                        className={`w-full py-3 rounded text-white font-bold ${
                            isVerifying
                                ? 'bg-purple-300'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isVerifying ? 'Loading...' : 'Sign Up'}
                    </button>

                    <div className='text-center text-sm mt-4'>
                        Already have an account?{' '}
                        <button
                            type='button'
                            onClick={() => navigate('/login')}
                            className='text-blue-500 font-bold'
                        >
                            Log In
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