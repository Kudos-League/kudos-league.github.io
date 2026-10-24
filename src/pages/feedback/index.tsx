import React from 'react';
import { useNavigate } from 'react-router-dom';
import FeedbackForm from '@/components/common/FeedbackModal';

export default function FeedbackPage() {
    const navigate = useNavigate();

    const handleSubmitted = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate('/');
    };

    return (
        <div className='max-w-4xl mx-auto px-4 py-10 space-y-6'>
            <div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-lg p-6 sm:p-10'>
                <FeedbackForm onSubmitted={handleSubmitted} />
            </div>
        </div>
    );
}
