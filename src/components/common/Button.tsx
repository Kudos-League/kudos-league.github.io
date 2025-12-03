import React from 'react';
import clsx from 'clsx';

type Variant =
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'warning'
    | 'success'
    | 'info'
    | 'icon'
    | 'ghost';

type Shape = 'default' | 'circle' | 'pill';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    shape?: Shape;
}

const baseClasses =
    'inline-flex items-center justify-center font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variantClasses: Record<Variant, string> = {
    primary:
        'bg-brand-600 text-white shadow-xs hover:bg-brand-500 focus-visible:outline-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300',
    secondary:
        'bg-white text-zinc-900 shadow-xs inset-ring inset-ring-zinc-300 hover:bg-zinc-50 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20',
    danger: 'bg-red-600 text-white shadow-xs hover:bg-red-500 focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400',
    warning:
        'bg-amber-500 text-black shadow-xs hover:bg-amber-400 focus-visible:outline-amber-500 dark:bg-amber-400 dark:text-zinc-900',
    success:
        'bg-green-600 text-white shadow-xs hover:bg-green-500 focus-visible:outline-green-600 dark:bg-green-500 dark:hover:bg-green-400',
    info: 'bg-blue-500 text-white shadow-xs hover:bg-blue-400 focus-visible:outline-blue-500 dark:bg-blue-400 dark:hover:bg-blue-300',
    icon: 'bg-brand-600 text-white shadow-xs hover:bg-brand-500 focus-visible:outline-brand-600 dark:bg-brand-400 dark:hover:bg-brand-300',
    ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:text-zinc-300 dark:hover:bg-white/10'
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
