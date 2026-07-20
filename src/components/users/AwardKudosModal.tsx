import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import Tippy from '@tippyjs/react/headless';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/forms/Input';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';
import { useAwardKudos } from '@/shared/api/mutations/kudos';
import { UserDTO } from '@/shared/api/types';
import { ensureJpegAll } from '@/shared/convertHeic';
import { takeFilesFromInput } from '@/shared/takeFilesFromInput';

const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE_MB = 10;

type FormValues = {
    title: string;
    description: string;
    amount: number | string;
};

export function KudosInfoTooltip({
    children
}: {
    children: React.ReactElement;
}) {
    return (
        <Tippy
            placement='top'
            delay={[100, 0]}
            render={(attrs) => (
                <div
                    {...attrs}
                    data-testid='kudos-info-tooltip'
                    className='max-w-xs bg-black text-white text-xs rounded-lg px-3 py-2 leading-relaxed shadow-lg'
                >
                    Awarding kudos is for thanking someone for{' '}
                    <span className='font-semibold'>past gifts</span> or help
                    that happened <span className='font-semibold'>outside
                    the website</span> — no post or handshake needed. Kudos
                    are freely given — awarding doesn&apos;t reduce your own
                    kudos — and photo evidence helps our admins verify the
                    award.
                </div>
            )}
        >
            {children}
        </Tippy>
    );
}

export default function AwardKudosModal({
    open,
    onClose,
    recipient
}: {
    open: boolean;
    onClose: () => void;
    recipient: UserDTO;
}) {
    const awardMutation = useAwardKudos();

    const form = useForm<FormValues>({
        mode: 'onBlur',
        defaultValues: { title: '', description: '', amount: '' }
    });

    const [selectedImages, setSelectedImages] = React.useState<File[]>([]);
    const [fileError, setFileError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            form.reset({ title: '', description: '', amount: '' });
            setSelectedImages([]);
            setFileError(null);
        }
    }, [open, form]);

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const raw = takeFilesFromInput(e.target);
        if (!raw.length) return;
        const converted = await ensureJpegAll(raw);
        const updated = [...selectedImages, ...converted];
        if (updated.length > MAX_FILE_COUNT) {
            setFileError(`Max ${MAX_FILE_COUNT} photos allowed.`);
            return;
        }
        const tooLarge = updated.find(
            (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024
        );
        if (tooLarge) {
            setFileError(`Photos must be under ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }
        setSelectedImages(updated);
        setFileError(null);
    };

    const removeImage = (idx: number) =>
        setSelectedImages((prev) => prev.filter((_, i) => i !== idx));

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        await awardMutation.mutateAsync({
            recipientID: recipient.id,
            title: data.title,
            description: data.description || undefined,
            amount: Number(data.amount),
            files: selectedImages
        });
        form.reset({ title: '', description: '', amount: '' });
        setSelectedImages([]);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Award kudos to ${recipient.username ?? 'this user'}`}
        >
            <div className='flex items-center gap-1.5 mb-3 text-sm text-gray-600 dark:text-gray-300'>
                <KudosInfoTooltip>
                    <button
                        type='button'
                        aria-label='What is awarding kudos?'
                        data-testid='kudos-info-trigger'
                        className='inline-flex items-center gap-1 p-0.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    >
                        <QuestionMarkCircleIcon className='w-4 h-4' />
                        <span>What is this?</span>
                    </button>
                </KudosInfoTooltip>
            </div>

            <Form methods={form} onSubmit={onSubmit} className='space-y-3'>
                <FormField name='title' label='Title *' noMargin>
                    <Input
                        name='title'
                        label=''
                        showLabel={false}
                        noMargin
                        form={form}
                        registerOptions={{
                            required: 'Title is required',
                            minLength: {
                                value: 3,
                                message:
                                    'Title must be at least 3 characters'
                            },
                            maxLength: {
                                value: 150,
                                message:
                                    'Title must be under 150 characters'
                            }
                        }}
                        placeholder='e.g. Helped me move houses'
                    />
                </FormField>
                <FormField name='description' label='Description' noMargin>
                    <Input
                        name='description'
                        label=''
                        showLabel={false}
                        noMargin
                        form={form}
                        multiline
                        registerOptions={{
                            maxLength: {
                                value: 4000,
                                message:
                                    'Description must be under 4000 characters'
                            }
                        }}
                        placeholder='What did they do for you?'
                    />
                </FormField>
                <FormField name='amount' label='Kudos to award *' noMargin>
                    <Input
                        name='amount'
                        label=''
                        showLabel={false}
                        noMargin
                        form={form}
                        htmlInputType='number'
                        registerOptions={{
                            required: 'Enter how many kudos to award',
                            validate: (value: unknown) => {
                                const n = Number(value);
                                if (!Number.isInteger(n) || n <= 0)
                                    return 'Kudos must be a positive whole number';
                                // Kudos are freely given, not spent from a balance.
                                // Re-enable to cap awards by the giver's kudos
                                // (pair with the commented debit in the backend):
                                // const balance = useAuth().user?.kudos ?? 0;
                                // if (n > balance)
                                //     return `You only have ${balance} kudos`;
                                return true;
                            }
                        }}
                        placeholder='e.g. 25'
                    />
                </FormField>

                <div>
                    <label className='block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200'>
                        Photographic evidence (optional)
                    </label>
                    <input
                        type='file'
                        accept='image/*'
                        multiple
                        data-testid='award-kudos-files'
                        onChange={handleImageUpload}
                    />
                    {fileError && (
                        <p
                            className='mt-1 text-sm text-red-600 dark:text-red-400'
                            data-testid='award-kudos-file-error'
                        >
                            {fileError}
                        </p>
                    )}
                    {selectedImages.length > 0 && (
                        <div className='mt-2 flex flex-wrap gap-2'>
                            {selectedImages.map((file, idx) => (
                                <div
                                    key={`${file.name}-${idx}`}
                                    className='relative'
                                    data-testid='award-kudos-preview'
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`Evidence ${idx + 1}`}
                                        className='w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-zinc-700'
                                    />
                                    <button
                                        type='button'
                                        aria-label={`Remove photo ${idx + 1}`}
                                        data-testid={`award-kudos-remove-${idx}`}
                                        onClick={() => removeImage(idx)}
                                        className='absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none flex items-center justify-center'
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='flex justify-end gap-2'>
                    <Button variant='ghost' onClick={onClose} type='button'>
                        Cancel
                    </Button>
                    <Button
                        variant='primary'
                        type='submit'
                        data-testid='award-kudos-submit'
                        disabled={awardMutation.isPending}
                    >
                        {awardMutation.isPending ? 'Awarding…' : 'Award kudos'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
