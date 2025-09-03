import React from 'react';
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
            <div className='my-2'>
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
                />
            </div>
        );
    }

    return (
        <div className='my-2'>
            <label htmlFor={name} className='block mb-1 text-sm font-medium'>
                {label}
            </label>
            {multiline ? (
                <textarea
                    {...props}
                    disabled={disabled}
                    id={name}
                    value={field.value}
                    onChange={(e) => {
                        field.onChange(e.target.value);
                        onValueChange?.(e.target.value);
                    }}
                    className='w-full border rounded px-3 py-2'
                    placeholder={placeholder}
                    rows={4}
                />
            ) : (
                <input
                    {...props}
                    disabled={disabled}
                    id={name}
                    type={type === 'password' ? 'password' : 'text'}
                    value={value ?? field.value}
                    onChange={(e) => {
                        field.onChange(e.target.value);
                        onValueChange?.(e.target.value);
                    }}
                    className='w-full border rounded px-3 py-2'
                    placeholder={placeholder}
                    multiple={multipleFiles}
                />
            )}
        </div>
    );
}
