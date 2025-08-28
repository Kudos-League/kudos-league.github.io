import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { Alert, PasswordInput, TextInput, TinyHelpLink } from './fields';
import OAuthGroup from './OAuthGroup';

type SignUpFormValues = {
  username: string;
  email: string;
};

type SignUpFormProps = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

function AccessGate({
    onContinue
}: {
  onContinue: () => void;
}) {
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
        <Auth title="Access Required">
            <form onSubmit={handleAccessSubmit} className="space-y-6">
                <TextInput
                    placeholder="Access Password"
                    aria-label="Access Password"
                    type="password"
                    onChange={(e) => setAccessPassword(e.target.value)}
                />
                <Button type="submit" className="w-full">Continue</Button>

                <p className="text-center text-sm/6 text-gray-500 dark:text-gray-400">
                    Already have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/login')}>Log In</TinyHelpLink>
                </p>

                {accessError && <Alert tone="error">{accessError}</Alert>}
            </form>
        </Auth>
    );
}

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
    const { register: registerUser } = useAuth();
    const form = useForm<SignUpFormValues>();
    const navigate = useNavigate();

    const [authorized, setAuthorized] = useState(false);
    const [pwVisible, setPwVisible] = useState(false);
    const [cpwVisible, setCpwVisible] = useState(false);
    const [pw, setPw] = useState('');
    const [cpw, setCpw] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setError] = useState<string | null>(null);
    const [successMessage, setSuccess] = useState<string | null>(null);

    if (!authorized) return <AccessGate onContinue={() => setAuthorized(true)} />;

    const onSubmit = async () => {
        const { username, email } = form.getValues();

        if (!username || !email || !pw) return setError('Missing required fields: username, email, password');
        if (username.length < 3) return setError('Username must be at least 3 characters long.');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address.');
        if (pw.length < 6) return setError('Password must be at least 6 characters long.');
        if (pw !== cpw) return setError('Passwords do not match.');
        setError(null);

        try {
            setIsVerifying(true);
            const result = await registerUser(username, email, pw);
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
        <Auth title="Create your account">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div>
                    <div className="col-span-2">
                        <TextInput
                            rounded="top"
                            placeholder="Username"
                            aria-label="Username"
                            {...form.register('username')}
                        />
                    </div>
                    <TextInput
                        rounded="none"
                        placeholder="Email"
                        aria-label="Email"
                        type="email"
                        {...form.register('email')}
                    />
                    <PasswordInput
                        rounded="none"
                        placeholder="Password"
                        aria-label="Password"
                        visible={pwVisible}
                        setVisible={setPwVisible}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                    />
                    <PasswordInput
                        rounded="bottom"
                        placeholder="Confirm Password"
                        aria-label="Confirm Password"
                        visible={cpwVisible}
                        setVisible={setCpwVisible}
                        value={cpw}
                        onChange={(e) => setCpw(e.target.value)}
                    />
                </div>

                <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={isVerifying}
                    className="w-full"
                >
                    {isVerifying ? 'Loading...' : 'Sign Up'}
                </Button>

                <p className="text-center text-sm/6 text-gray-500 dark:text-gray-400">or sign up with</p>
                <OAuthGroup />

                <p className="text-center text-sm/6 text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
                    <TinyHelpLink onClick={() => navigate('/login')}>Log In</TinyHelpLink>
                </p>

                {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
                {successMessage && <Alert tone="success">{successMessage}</Alert>}
            </form>
        </Auth>
    );
}