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
                    className='absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    title={visible ? 'Hide password' : 'Show password'}
                >
                    {visible ? (
                        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                    ) : (
                        <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                    )}
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
            className='font-semibold text-indigo-300 hover:text-indigo-200 dark:text-indigo-300 dark:hover:text-indigo-200 text-sm/6'
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
