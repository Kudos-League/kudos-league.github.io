import React, { useEffect, useState } from 'react';
import Button from '../common/Button';

type Props = {
    open: boolean;
    onClose: () => void;
    onSave: (kudos: number) => Promise<void>;
    current?: number | null;
    reportId: number;
};

export default function RewardKudosModal({
    open,
    onClose,
    onSave,
    current,
    reportId
}: Props) {
    const [value, setValue] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setValue(typeof current === 'number' ? String(current) : '');
            setError(null);
            setSaving(false);
        }
    }, [open, current]);

    if (!open) return null;

    const parsed = Number(value);
    const disabled =
        Number.isNaN(parsed) || parsed < 0 || !Number.isFinite(parsed);

    const submit = async () => {
        if (disabled) {
            setError('Enter a non-negative number. Yes, zero is a number.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSave(parsed);
            onClose();
        }
        catch {
            setError('Failed to resolve. Try again.');
        }
        finally {
            setSaving(false);
        }
    };

    return (
        <div
            className='fixed inset-0 z-[1000] flex items-center justify-center
                       bg-black/60'
            role='dialog'
            aria-modal='true'
            aria-label={`Resolve item ${reportId}`}
        >
            <div
                className='w-full max-w-md rounded-2xl p-5 shadow-xl
                           light:bg-white light:text-gray-900
                           dark:bg-neutral-900 dark:text-neutral-100
                           light:border light:border-gray-200
                           dark:border dark:border-neutral-800'
            >
                <h2 className='text-lg font-semibold'>Resolve Item</h2>
                <p
                    className='mt-1 text-sm
                               light:text-gray-600
                               dark:text-neutral-300'
                >
                    How many kudos should be granted when resolving this?
                </p>

                <div className='mt-4'>
                    <label className='text-sm font-medium'>Kudos</label>
                    <input
                        type='number'
                        min={0}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className='mt-1 w-full rounded-lg px-3 py-2
                                   light:border light:border-gray-300 light:bg-white light:text-gray-900
                                   dark:border dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100
                                   focus:outline-none focus:ring-2
                                   light:focus:ring-indigo-500
                                   dark:focus:ring-indigo-400'
                        placeholder='e.g. 10'
                    />
                    {error && (
                        <p className='mt-2 text-sm light:text-red-600 dark:text-red-400'>
                            {error}
                        </p>
                    )}
                </div>

                <div className='mt-5 flex justify-end gap-2'>
                    <Button variant='ghost' onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        variant='success'
                        onClick={submit}
                        disabled={saving || disabled}
                    >
                        {saving ? 'Resolving…' : 'Resolve'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
