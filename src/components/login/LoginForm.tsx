import React, { useState } from 'react';
import { useForm, useController, type RegisterOptions, type UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Button from '@/components/common/Button';
import Auth from './Auth';
import { Alert, TinyHelpLink } from './fields';
import { routes } from '@/routes';
import Input from '@/components/forms/Input';
import OAuthGroup from './OAuthGroup';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';

type LoginFormProps = {
    onSuccess?: () => void;
    onError?: (errorMessage: React.ReactNode) => void;
    initialError?: string;
};

type FormValues = {
    username: string;
    password: string;
};

const passwordInputClasses = 'w-full border rounded px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';

type PasswordFieldProps = {
    name: keyof FormValues;
    form: UseFormReturn<FormValues>;
    placeholder?: string;
    registerOptions?: RegisterOptions<FormValues>;
};

function PasswordField({ name, form, placeholder, registerOptions }: PasswordFieldProps) {
    const { field } = useController<FormValues>({
        control: form.control,
        name,
        rules: registerOptions
    });

    const [visible, setVisible] = useState(false);

    return (
        <div className='my-2'>
            <div className='relative'>
                <input
                    id={name}
                    ref={field.ref}
                    type={visible ? 'text' : 'password'}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    placeholder={placeholder}
                    autoComplete={name === 'password' ? 'current-password' : undefined}
                    className={`${passwordInputClasses} pr-10`}
                />
                <button
                    type='button'
                    onClick={() => setVisible((prev) => !prev)}
                    className='absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300'
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    title={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}

export default function LoginForm({
    onSuccess,
    onError,
    initialError
}: LoginFormProps) {
    const { login, token, logout } = useAuth();
    const methods = useForm<FormValues>({ mode: 'onBlur' });
    const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(initialError ?? null);
    const navigate = useNavigate();

    const getErrorMessage = (error: any): React.ReactNode => {
        const resp = error?.response ?? error;
        let body: any = resp?.data ?? resp?.body ?? resp;

        if (!body && Array.isArray(resp) && resp.length > 0) {
            const first = resp[0];
            if (typeof first === 'string') body = { message: first };
            else if (first && typeof first === 'object') body = first;
        }
        const status = resp?.status ?? resp?.statusCode ?? error?.status;

        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }
            catch {
                // leave as string
            }
        }

        let arrayResponseMessage: string[] | null = null;
        if (Array.isArray(body)) {
            if (body.length === 1) {
                const first = body[0];
                if (typeof first === 'string') body = { message: first };
                else if (first && typeof first === 'object') body = first;
                else body = { message: String(first) };
            }
            else if (body.length > 1) {
                arrayResponseMessage = body.map((it: any) => (typeof it === 'string' ? it : (it?.message ?? it?.error ?? String(it))));
            }
        }

        if ((body == null || typeof body !== 'object') && typeof error?.message === 'string') {
            try {
                const parsed = JSON.parse(error.message);
                if (parsed && typeof parsed === 'object') body = parsed;
            }
            catch {
                // ignore
            }
        }

        const responseMessageRaw =
            body?.message ?? body?.error ?? body?.msg ?? (typeof error?.message === 'string' ? error.message : undefined);
        const responseMessage = arrayResponseMessage ?? responseMessageRaw;
        const banEnd = body?.banEndDate ?? body?.ban_end_date ?? body?.ban_end ?? error?.banEndDate ?? null;

        const formatBan = (d: any) => {
            try {
                return new Date(d).toLocaleString();
            }
            catch {
                return null;
            }
        };

        switch (status) {
        case 400:
            return 'Invalid username or password format. Please check your credentials.';
        case 401:
            return 'Invalid username or password. Please try again.';
        case 403: {
            if (Array.isArray(responseMessage)) {
                const when = banEnd ? formatBan(banEnd) : null;
                return (
                    <div>
                        <p>{when ? `This account is banned (until ${when}):` : 'This account is banned:'}</p>
                        <ul>
                            {responseMessage.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    </div>
                );
            }

            if (responseMessage && typeof responseMessage === 'string') {
                const when = banEnd ? formatBan(banEnd) : null;
                return when ? `${responseMessage} (until ${when})` : responseMessage;
            }

            if (banEnd) {
                const when = formatBan(banEnd);
                return when ? `This account is banned until ${when}.` : 'This account is banned.';
            }

            return 'Your account has been restricted. Contact support for assistance.';
        }
        case 409:
            return 'You already have an account with that username or email. Please Log In.';
        case 429:
            return 'Too many login attempts. Please wait a few minutes before trying again.';
        case 500:
            return 'Server error occurred. Please try again in a few moments.';
        case 503:
            return 'Service temporarily unavailable. Please try again later.';
        default: {
            if (!error?.response && typeof error?.message === 'string') {
                const msg = error.message;
                if (msg && msg.length > 0) return msg;
            }

            if (responseMessage && typeof responseMessage === 'string') return responseMessage;

            if (!error?.response) return 'Unable to connect to server. Please check your internet connection.';

            return error?.message || 'Login failed. Please try again.';
        }
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
            <Form
                methods={methods}
                onSubmit={onSubmit}
                className='space-y-6'
                serverError={typeof errorMessage === 'string' ? errorMessage : undefined}
            >
                <div>
                    <div className='col-span-2'>
                        <FormField name='username'>
                            <Input
                                name='username'
                                label=''
                                placeholder='Username'
                                form={methods}
                                registerOptions={{ required: 'Username is required' }}
                            />
                        </FormField>
                    </div>
                    <FormField name='password'>
                        <PasswordField
                            name='password'
                            placeholder='Password'
                            form={methods}
                            registerOptions={{ required: 'Password is required' }}
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
                    <TinyHelpLink onClick={() => navigate(routes.signUp)}>
                        Sign Up
                    </TinyHelpLink>
                </p>
            </Form>
            {typeof errorMessage !== 'string' && errorMessage && (
                <div className='mt-4 text-sm text-red-600'>{errorMessage}</div>
            )}
        </Auth>
    );
}
