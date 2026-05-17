import React, { useState } from 'react';
import {
    FieldValues,
    RegisterOptions,
    useController,
    UseFormReturn,
    Path,
    PathValue
} from 'react-hook-form';
import FilePicker from './FilePicker';
import DropdownPicker from './DropdownPicker';

type Props<T extends FieldValues> = {
    name: Path<T>;
    label: string;
    disabled?: boolean;
    form: UseFormReturn<T>;
    type?: 'text' | 'password' | 'file' | 'dropdown' | 'file-image';
    options?: { label: string; value: string }[];
    registerOptions?: RegisterOptions<T>;
    placeholder?: string;
    value?: string;
    multipleFiles?: boolean;
    multiline?: boolean;
    onValueChange?: (value: string | File[]) => void;
    valueTransformer?: (value: string) => any;
    htmlInputType?: string;
    noMargin?: boolean;
    showLabel?: boolean;
    className?: string;
};

export default function Input<T extends FieldValues>({
    name,
    label,
    disabled = false,
    form,
    type = 'text',
    options = [],
    registerOptions,
    placeholder,
    value,
    multipleFiles = true,
    multiline = false,
    onValueChange,
    valueTransformer,
    htmlInputType,
    noMargin = false,
    showLabel = true,
    className,
    ...props
}: Props<T>) {
    const defaultValue: PathValue<T, Path<T>> = type === 'dropdown'
        ? (options?.[0]?.value as PathValue<T, Path<T>>)
        : type === 'file'
            ? ([] as unknown as PathValue<T, Path<T>>)
            : ('' as PathValue<T, Path<T>>);

    const { field } = useController<T>({
        control: form.control,
        name,
        defaultValue,
        rules: registerOptions
    });

    if (type === 'file' || type === 'file-image') {
        return (
            <FilePicker
                placeholder={placeholder || 'Choose Files'}
                multiple={multipleFiles}
                selectedFiles={field.value as File[]}
                onChange={(files) => {
                    const normalized = Array.isArray(files)
                        ? files
                        : files
                            ? [files]
                            : [];
                    field.onChange(normalized);
                    onValueChange?.(normalized);
                }}
                type={type}
            />
        );
    }

    if (type === 'dropdown') {
        return (
            <div className={noMargin ? undefined : 'my-2'}>
                <label className='block mb-1 text-sm font-medium'>
                    {label}
                </label>
                <DropdownPicker
                    options={options}
                    value={field.value}
                    placeholder={placeholder || label}
                    onChange={(val) => {
                        field.onChange(val);
                        onValueChange?.(val);
                    }}
                    onBlur={field.onBlur}
                />
            </div>
        );
    }

    const containerClass = noMargin ? undefined : 'my-2';

    const isPassword =
        htmlInputType === 'password' || type === 'password';
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className={containerClass + (className ? ` ${className}` : '')}>
            <label
                htmlFor={name}
                className='block mb-1 text-sm font-medium text-gray-900 dark:text-gray-200'
            >
                {label}
            </label>
            {multiline ? (
                <textarea
                    {...props}
                    disabled={disabled}
                    id={name}
                    value={field.value}
                    onChange={(e) => {
                        const transformed = valueTransformer
                            ? valueTransformer(e.target.value)
                            : e.target.value;
                        field.onChange(transformed);
                        onValueChange?.(transformed as string);
                    }}
                    onBlur={field.onBlur}
                    className='w-full border rounded px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent overflow-y-auto'
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        touchAction: 'pan-y'
                    }}
                    placeholder={placeholder}
                    rows={4}
                />
            ) : (
                <div className={isPassword ? 'relative' : undefined}>
                    <input
                        {...props}
                        disabled={disabled}
                        id={name}
                        type={
                            isPassword
                                ? (passwordVisible ? 'text' : 'password')
                                : (htmlInputType ?? 'text')
                        }
                        value={value ?? field.value}
                        onChange={(e) => {
                            const transformed = valueTransformer
                                ? valueTransformer(e.target.value)
                                : e.target.value;
                            field.onChange(transformed);
                            onValueChange?.(transformed as string);
                        }}
                        onBlur={field.onBlur}
                        className={`w-full border rounded px-3 py-2 bg-white text-gray-900 placeholder:text-gray-500 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-400 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent${isPassword ? ' pr-10' : ''}`}
                        placeholder={placeholder}
                        multiple={multipleFiles}
                    />
                    {isPassword && (
                        <button
                            type='button'
                            onClick={() => setPasswordVisible((v) => !v)}
                            className='absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300'
                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                            title={passwordVisible ? 'Hide password' : 'Show password'}
                        >
                            {passwordVisible ? (
                                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>
                            ) : (
                                <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>
                            )}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
