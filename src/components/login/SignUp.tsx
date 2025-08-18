import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import GoogleLoginButton from './GoogleLoginButton';
import DiscordLoginButton from './DiscordLoginButton';
import Button from '../common/Button';

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
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    // Helper function to add debug logs
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        setDebugLogs(prev => [...prev, logMessage]);
    };

    const handleAccessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addLog(`Access password attempt: ${accessPassword ? '[PROVIDED]' : '[EMPTY]'}`);
        
        if (accessPassword === 'kudos') {
            setIsAuthorized(true);
            setAccessError(null);
            addLog('Access granted - password correct');
        }
        else {
            setAccessError('Incorrect password');
            addLog('Access denied - incorrect password');
        }
    };

    const onSubmit = async () => {
        const { username, email } = form.getValues();
        
        addLog('=== SIGN UP ATTEMPT STARTED ===');
        addLog(`Username: ${username || '[EMPTY]'}`);
        addLog(`Email: ${email || '[EMPTY]'}`);
        addLog(`Password length: ${formPassword.value?.length || 0}`);
        addLog(`Confirm password length: ${confirmPassword.value?.length || 0}`);
        addLog(`Passwords match: ${formPassword.value === confirmPassword.value}`);

        // Client-side validation
        if (!username || !email || !formPassword.value) {
            const missingFields = [];
            if (!username) missingFields.push('username');
            if (!email) missingFields.push('email');
            if (!formPassword.value) missingFields.push('password');
            
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            setErrorMessage(errorMsg);
            addLog(`VALIDATION ERROR: ${errorMsg}`);
            return;
        }

        if (formPassword.value !== confirmPassword.value) {
            const errorMsg = 'Passwords do not match.';
            setErrorMessage(errorMsg);
            addLog(`VALIDATION ERROR: ${errorMsg}`);
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const errorMsg = 'Please enter a valid email address.';
            setErrorMessage(errorMsg);
            addLog(`VALIDATION ERROR: ${errorMsg}`);
            return;
        }

        // Username validation  
        if (username.length < 3) {
            const errorMsg = 'Username must be at least 3 characters long.';
            setErrorMessage(errorMsg);
            addLog(`VALIDATION ERROR: ${errorMsg}`);
            return;
        }

        // Password validation
        if (formPassword.value.length < 6) {
            const errorMsg = 'Password must be at least 6 characters long.';
            setErrorMessage(errorMsg);
            addLog(`VALIDATION ERROR: ${errorMsg}`);
            return;
        }

        addLog('Client-side validation passed');

        try {
            setIsVerifying(true);
            await registerUser(username, email, formPassword.value);
            setErrorMessage(null);
            setSuccessMessage(null);
            
            addLog('Calling registerUser function...');
            const result = await registerUser(username, email, formPassword.value);
            
            addLog(`Register result type: ${typeof result}`);
            addLog(`Register result: ${JSON.stringify(result)}`);
            
            if (result && typeof result === 'string') {
                // Email verification message
                addLog('Registration successful - email verification required');
                setSuccessMessage(result);
                setIsVerifying(false);
            }
            else {
                // Direct login successful
                addLog('Registration successful - direct login');
                setIsVerifying(false);
                onSuccess?.();
                navigate('/');
            }
        }
        catch (err: any) {
            addLog('=== REGISTRATION ERROR ===');
            addLog(`Error type: ${typeof err}`);
            addLog(`Error message: ${err?.message || 'Unknown'}`);
            addLog(`Error response: ${JSON.stringify(err?.response?.data || 'No response data')}`);
            addLog(`Error status: ${err?.response?.status || 'No status'}`);
            addLog(`Full error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`);
            
            setIsVerifying(false);
            
            let message = 'Sign-up failed';
            
            // Try to extract meaningful error message
            if (err?.response?.data?.message) {
                message = err.response.data.message;
                addLog(`Using response message: ${message}`);
            } 
            else if (err?.message) {
                message = err.message;
                addLog(`Using error message: ${message}`);
            }
            
            setErrorMessage(message);
            onError?.(message);
        }
    };

    // Show debug logs in development
    const showDebugLogs = process.env.NODE_ENV === 'development' || debugLogs.length > 0;

    // Password gate screen
    if (!isAuthorized) {
        return (
            <div className='min-h-screen flex items-center justify-center relative'>
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
                        
                        <Button
                            type='submit'
                            className='w-full'
                        >
                            Continue
                        </Button>

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

    // Main sign-up form
    return (
        <>
            <img
                src='/images/welcome.png'
                className='absolute inset-0 w-full h-full object-cover opacity-80 -z-10'
            />

            <div className='min-h-screen flex items-center justify-center relative'>
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
                                tabIndex={-1}
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
                                tabIndex={-1}
                                className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500'
                            >
                                {confirmPassword.visible ? '🙈' : '👁️'}
                            </button>
                        </div>

                        <Button
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
                        </Button>
                        <p className='text-center text-sm text-gray-500'>
                        or sign up with
                        </p>

                        <div className='flex justify-center gap-4'>
                            <GoogleLoginButton />
                            <DiscordLoginButton />
                        </div>

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
                            <div className='bg-red-50 border border-red-200 rounded p-3 mt-4'>
                                <p className='text-red-500 text-center text-sm font-medium'>
                                    {errorMessage}
                                </p>
                            </div>
                        )}

                        {successMessage && (
                            <div className='bg-green-50 border border-green-200 rounded p-3 mt-4'>
                                <p className='text-green-600 text-center text-sm'>
                                    {successMessage}
                                </p>
                            </div>
                        )}
                    </form>

                    {/* Debug Logs Section */}
                    {showDebugLogs && debugLogs.length > 0 && (
                        <div className='mt-6 p-3 bg-gray-50 border rounded'>
                            <details>
                                <summary className='text-sm font-medium text-gray-700 cursor-pointer'>
                                    Debug Logs ({debugLogs.length})
                                </summary>
                                <div className='mt-2 max-h-40 overflow-y-auto text-xs font-mono'>
                                    {debugLogs.map((log, index) => (
                                        <div key={index} className='py-1 border-b border-gray-200 last:border-b-0'>
                                            {log}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type='button'
                                    onClick={() => setDebugLogs([])}
                                    className='mt-2 text-xs text-red-600 hover:text-red-800'
                                >
                                    Clear Logs
                                </Button>
                            </details>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
