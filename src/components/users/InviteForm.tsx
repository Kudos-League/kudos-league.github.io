import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '@/components/common/Button';
import { apiMutate } from '@/shared/api/apiClient';

type InviteFormValues = {
    emails: string[];
};

export default function InviteForm() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [emails, setEmails] = useState<string[]>(['']);
    const [emailInput, setEmailInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [generatedLinks, setGeneratedLinks] = useState<Array<{ email: string; link: string }>>([]);

    const form = useForm<InviteFormValues>({
        defaultValues: { emails: [''] }
    });

    const addEmail = () => {
        if (emailInput.trim() && isValidEmail(emailInput.trim())) {
            setEmails([...emails, emailInput.trim()]);
            setEmailInput('');
            setError(null);
        }
        else {
            setError('Please enter a valid email address');
        }
    };

    const removeEmail = (index: number) => {
        setEmails(emails.filter((_, i) => i !== index));
    };

    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (emails.length === 0 || (emails.length === 1 && !emails[0])) {
            setError('Please add at least one email address');
            return;
        }

        const validEmails = emails.filter(e => e && isValidEmail(e));
        if (validEmails.length === 0) {
            setError('Please add at least one valid email address');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setGeneratedLinks([]);

        try {
            // Call API to generate invite links
            const response = await apiMutate<{ invites: Array<{ email: string; link: string }> }, { emails: string[] }>(
                '/users/invites',
                'post',
                { emails: validEmails }
            );

            setGeneratedLinks(response.invites);
            setSuccess(`Successfully generated ${response.invites.length} invite link(s)`);
            setEmails(['']);
            setEmailInput('');
        }
        catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to generate invite links. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setSuccess('Link copied to clipboard!');
        setTimeout(() => setSuccess(null), 2000);
    };

    return (
        <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-sm overflow-hidden'>
            {/* Header - Always Visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className='w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors'
            >
                <div className='flex items-center gap-3'>
                    <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                        <PlusIcon className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                    </div>
                    <div className='text-left'>
                        <h3 className='font-semibold text-gray-900 dark:text-gray-100'>
                            Invite Friends
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                            Generate invite links to share with friends
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUpIcon className='w-5 h-5 text-gray-400' />
                ) : (
                    <ChevronDownIcon className='w-5 h-5 text-gray-400' />
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className='px-6 py-4 border-t border-gray-200 dark:border-white/10'>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {/* Email Input */}
                        <div>
                            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                                Email Addresses
                            </label>
                            <div className='flex gap-2'>
                                <input
                                    type='email'
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addEmail();
                                        }
                                    }}
                                    placeholder='friend@example.com'
                                    className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                                />
                                <Button
                                    type='button'
                                    onClick={addEmail}
                                    variant='primary'
                                    className='whitespace-nowrap'
                                >
                                    Add Email
                                </Button>
                            </div>
                        </div>

                        {/* Email List */}
                        {emails.length > 0 && emails.some(e => e) && (
                            <div className='space-y-2'>
                                <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                                    Emails to invite ({emails.filter(e => e).length}):
                                </p>
                                <div className='space-y-1 max-h-48 overflow-y-auto'>
                                    {emails.filter(e => e).map((email, index) => (
                                        <div
                                            key={index}
                                            className='flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg'
                                        >
                                            <span className='text-sm text-gray-700 dark:text-gray-200 truncate'>
                                                {email}
                                            </span>
                                            <button
                                                type='button'
                                                onClick={() => removeEmail(index)}
                                                className='text-gray-400 hover:text-red-500 transition-colors'
                                            >
                                                <XMarkIcon className='w-4 h-4' />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm'>
                                {error}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 px-4 py-3 rounded-lg text-sm'>
                                {success}
                            </div>
                        )}

                        {/* Generated Links */}
                        {generatedLinks.length > 0 && (
                            <div className='space-y-2'>
                                <p className='text-sm font-medium text-gray-700 dark:text-gray-200'>
                                    Generated Invite Links:
                                </p>
                                <div className='space-y-2 max-h-64 overflow-y-auto'>
                                    {generatedLinks.map((invite, index) => (
                                        <div
                                            key={index}
                                            className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 rounded-lg'
                                        >
                                            <div className='flex items-start justify-between gap-3'>
                                                <div className='flex-1 min-w-0'>
                                                    <p className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
                                                        {invite.email}
                                                    </p>
                                                    <p className='text-xs text-gray-600 dark:text-gray-300 break-all'>
                                                        {invite.link}
                                                    </p>
                                                </div>
                                                <Button
                                                    type='button'
                                                    onClick={() => copyToClipboard(invite.link)}
                                                    variant='secondary'
                                                    className='text-xs whitespace-nowrap'
                                                >
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type='submit'
                            disabled={loading || emails.filter(e => e).length === 0}
                            variant='success'
                            className='w-full'
                        >
                            {loading ? (
                                <div className='flex items-center justify-center gap-2'>
                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                    Generating Links...
                                </div>
                            ) : (
                                `Generate ${emails.filter(e => e).length} Invite Link${emails.filter(e => e).length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}