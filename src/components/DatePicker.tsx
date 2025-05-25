import React from 'react';

interface UniversalDatePickerProps {
    date: Date;
    onChange: (newDate: Date) => void;
    label?: string;
}

export default function UniversalDatePickerWeb({
    date,
    onChange,
    label
}: UniversalDatePickerProps) {
    const formattedValue = date.toISOString().slice(0, 16);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val) {
            onChange(new Date(val));
        }
    };

    return (
        <div className='my-2'>
            {label && (
                <label className='block mb-1 font-semibold'>{label}</label>
            )}
            <input
                type='datetime-local'
                value={formattedValue}
                onChange={handleChange}
                className='w-full px-2 py-1 border rounded'
            />
        </div>
    );
}
