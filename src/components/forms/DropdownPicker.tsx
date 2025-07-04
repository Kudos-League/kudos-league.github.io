import React from 'react';

type DropdownPickerProps = {
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export default function DropdownPicker({
    options,
    value,
    onChange,
    placeholder = 'Select an option'
}: DropdownPickerProps) {
    return (
        <select
            className='block w-full border rounded p-2'
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option disabled value=''>
                {placeholder}
            </option>
            {options.map(({ label, value }) => (
                <option key={value} value={value}>
                    {label}
                </option>
            ))}
        </select>
    );
}
