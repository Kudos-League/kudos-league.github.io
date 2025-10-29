import React from 'react';
import FeedbackForm from '@/components/common/FeedbackModal';

export default function FeedbackPage() {
    return (
        <div className='max-w-4xl mx-auto px-4 py-10 space-y-6'>
            <div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-lg p-6 sm:p-10'>
                <FeedbackForm />
            </div>

            <section className='bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 space-y-3 text-sm text-teal-900 dark:text-teal-100'>
                <h2 className='text-base font-semibold'>Tips for useful submissions</h2>
                <ul className='list-disc pl-5 space-y-2'>
                    <li>For bugs, include what you tried, what you expected, and what actually happened.</li>
                    <li>Add screenshots when they help illustrate the issue or feedback.</li>
                    <li>Feature requests are welcome—share the problem you are solving and why it matters.</li>
                </ul>
            </section>
        </div>
    );
}
