import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    rounded?: 'top' | 'bottom' | 'both' | 'none';
    className?: string;
};

const baseInput =
    'block w-full bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 ' +
    'outline-gray-300 placeholder:text-gray-400 focus:relative focus:outline-2 focus:-outline-offset-2 ' +
    'focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-gray-700 ' +
    'dark:placeholder:text-gray-500 dark:focus:outline-indigo-500';

const radius: Record<NonNullable<InputProps['rounded']>, string> = {
    top: 'rounded-t-md',
    bottom: 'rounded-b-md -mt-px',
    both: 'rounded-md',
    none: ''
};

export function TextInput({
    rounded = 'both',
    className = '',
    ...props
}: InputProps) {
    return (
        <input
            {...props}
            className={`${baseInput} ${radius[rounded]} ${className}`}
        />
    );
}

export function PasswordInput({
    rounded = 'both',
    visible,
    setVisible,
    className = '',
    ...props
}: InputProps & {
    visible: boolean;
    setVisible: (v: boolean) => void;
    className?: string;
}) {
    return (
        <div className={rounded === 'bottom' ? '-mt-px' : ''}>
            <div className='relative'>
                <input
                    {...props}
                    type={visible ? 'text' : 'password'}
                    className={`${baseInput} ${radius[rounded]} pr-10 ${className}`}
                />
                <button
                    type='button'
                    tabIndex={-1}
                    onClick={() => setVisible(!visible)}
                    className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500'
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    title={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
        </div>
    );
}

export function TinyHelpLink({
    onClick,
    children
}: {
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className='font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm/6'
        >
            {children}
        </button>
    );
}

export function Alert({
    tone,
    title,
    children
}: {
    tone: 'error' | 'success' | 'info';
    title?: string;
    children?: React.ReactNode;
}) {
    const tones = {
        error: 'bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200',
        success:
            'bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-200',
        info: 'bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200'
    } as const;

    return (
        <div className={tones[tone]}>
            {title && <p className='font-medium'>{title}</p>}
            {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
        </div>
    );
}
