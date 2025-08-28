import React from 'react';
import clsx from 'clsx';

type Variant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'warning'
    | 'success'
    | 'info'
    | 'icon';

type Shape = 'default' | 'circle' | 'pill';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    shape?: Shape;
}

const baseClasses =
    'inline-flex items-center justify-center font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
    primary:
        'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400',
    secondary:
        'bg-white text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20',
    danger: 'bg-red-600 text-white shadow-xs hover:bg-red-500 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400',
    warning:
        'bg-yellow-500 text-black shadow-xs hover:bg-yellow-400 focus-visible:outline-yellow-500 dark:bg-yellow-400 dark:text-gray-900',
    success:
        'bg-green-600 text-white shadow-xs hover:bg-green-500 focus-visible:outline-green-600 dark:bg-green-500 dark:hover:bg-green-400',
    info: 'bg-sky-600 text-white shadow-xs hover:bg-sky-500 focus-visible:outline-sky-600 dark:bg-sky-500 dark:hover:bg-sky-400',
    icon: 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400'
};

const shapeClasses: Record<Shape, string> = {
    default: 'rounded-md px-3 py-2 text-sm',
    circle: 'rounded-full p-2',
    pill: 'rounded-full px-4 py-2 text-sm'
};

export default function Button({
    variant = 'primary',
    shape = 'default',
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            {...props}
            className={clsx(
                baseClasses,
                variantClasses[variant],
                shapeClasses[shape],
                className
            )}
        >
            {children}
        </button>
    );
}
