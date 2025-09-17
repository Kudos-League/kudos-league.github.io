import React from 'react';
import { useFormContext } from 'react-hook-form';

type Props = {
    name: string;
    label?: string;
    helper?: string;
    children?: React.ReactNode;
    className?: string;
};

export default function FormField({ name, label, helper, children, className }: Props) {
    const { formState } = useFormContext();
    const error = (formState.errors as any)[name];
    const errorMessage = error?.message ?? (error?.type === 'required' ? 'This field is required' : undefined);

    return (
        <div className={`${className ?? ''} mb-3`}> 
            {label && (
                <label className='block text-sm font-semibold mb-1 text-gray-800 dark:text-gray-200'>
                    {label}
                </label>
            )}
            {children}
            {helper && !error && (
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{helper}</p>
            )}
            {error && (
                <p className='text-sm mt-1 text-red-600 dark:text-red-400'>{errorMessage}</p>
            )}
        </div>
    );
}
