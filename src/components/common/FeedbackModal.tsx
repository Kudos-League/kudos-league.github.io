import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

type FeedbackModalProps = {
    open: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<void>;
};

export default function FeedbackModal({
    open,
    onClose,
    onSubmit
}: FeedbackModalProps) {
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!content.trim()) {
            setError('Feedback cannot be empty.');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await onSubmit(content.trim());
            setContent('');
            onClose();
        }
        catch {
            setError('Failed to submit feedback. Try again.');
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onClose} title='Submit Feedback'>
            <textarea
                className='w-full border border-gray-300 dark:border-zinc-700 rounded-lg p-2 dark:bg-zinc-800 dark:text-white'
                rows={4}
                placeholder='Your feedback...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            {error && <p className='text-sm text-red-600 mt-2'>{error}</p>}
            <div className='mt-4 flex justify-end gap-2'>
                <Button variant='ghost' onClick={onClose} disabled={saving}>
                    Cancel
                </Button>
                <Button
                    variant='success'
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? 'Submitting...' : 'Submit'}
                </Button>
            </div>
        </Modal>
    );
}
