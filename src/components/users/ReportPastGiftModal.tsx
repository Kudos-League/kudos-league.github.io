import React from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/forms/Input';
import DropdownPicker from '@/components/forms/DropdownPicker';
import TagInput from '@/components/TagInput';
import Button from '@/components/common/Button';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useCategories } from '@/shared/api/queries/categories';
import { useReportPastGift } from '@/shared/api/mutations/posts';

type FormValues = {
  title: string;
  body: string;
  categoryID: number;
  tags: string[];
  files?: File[];
};

export default function ReportPastGiftModal({ open, onClose, receiverID }: { open: boolean; onClose: () => void; receiverID: number }) {
    const form = useForm<FormValues>({ defaultValues: { tags: [], categoryID: 0 } });
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const mutate = useReportPastGift();

    const [selectedImages, setSelectedImages] = React.useState<File[]>([]);

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        await mutate.mutateAsync({
            title: data.title,
            body: data.body,
            type: 'gift',
            tags: data.tags,
            categoryID: data.categoryID,
            files: selectedImages,
            receiverID
        } as any);
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title='Log Past Gift'>
            <div className='space-y-3'>
                <Input name='title' label='Title *' form={form} registerOptions={{ required: true }} />
                <Input name='body' label='Description *' form={form} registerOptions={{ required: true }} multiline />
                <div>
                    <label className='block text-sm font-semibold mt-2 text-gray-800 dark:text-gray-200'>Category</label>
                    <DropdownPicker
                        options={(categories as any[]).map((c) => ({ label: c.name, value: String(c.id) }))}
                        value={String(form.watch('categoryID') || '')}
                        onChange={(val) => form.setValue('categoryID', parseInt(val), { shouldValidate: true, shouldDirty: true })}
                        placeholder={catsLoading ? 'Loading…' : 'Select a category'}
                    />
                </div>
                <TagInput
                    initialTags={form.watch('tags')}
                    onTagsChange={(tags) => form.setValue('tags', tags.map((t) => t.name))}
                />
                <div>
                    <label className='block text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200'>Attach Images (optional)</label>
                    <input type='file' accept='image/*' multiple onChange={(e) => setSelectedImages(e.target.files ? Array.from(e.target.files) : [])} />
                </div>
                <div className='flex justify-end gap-2'>
                    <Button variant='ghost' onClick={onClose}>Cancel</Button>
                    <Button variant='primary' onClick={form.handleSubmit(onSubmit)} disabled={mutate.isPending}>
                        {mutate.isPending ? 'Saving…' : 'Submit'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

