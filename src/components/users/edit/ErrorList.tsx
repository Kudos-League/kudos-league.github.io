import React from 'react';

const ErrorList: React.FC<{ errors: Record<string, any> }> = ({ errors }) => {
    const keys = Object.keys(errors || {});
    if (!keys.length) return null;
    return (
        <div className='mt-4 space-y-2'>
            {keys.map((field) => (
                <p key={field} className='text-sm text-red-600'>
                    {field}: {errors[field]?.message || 'Invalid value'}
                </p>
            ))}
        </div>
    );
};

export default React.memo(ErrorList);
