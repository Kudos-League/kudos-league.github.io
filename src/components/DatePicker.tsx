import React from 'react';
import { format } from 'date-fns';
import { LOCAL_FMT } from '@/shared/constants';

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
    const formattedValue = format(date, LOCAL_FMT);

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
