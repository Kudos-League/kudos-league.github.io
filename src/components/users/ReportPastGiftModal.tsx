import React from 'react';
import Modal from '@/components/common/Modal';
import Input from '@/components/forms/Input';
import DropdownPicker from '@/components/forms/DropdownPicker';
import TagInput from '@/components/TagInput';
import Button from '@/components/common/Button';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useCategories } from '@/shared/api/queries/categories';
import { useReportPastGift } from '@/shared/api/mutations/posts';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';

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
            <Form methods={form} onSubmit={onSubmit} className='space-y-3'>
                <Input name='title' label='Title *' form={form} registerOptions={{ required: true }} />
                <Input name='body' label='Description *' form={form} registerOptions={{ required: true }} multiline />
                <FormField name='categoryID' label='Category'>
                    <Controller
                        control={form.control}
                        name='categoryID'
                        rules={{ validate: (v) => (v && v !== 0) || 'Please select a category.' }}
                        render={({ field }) => (
                            <DropdownPicker
                                options={(categories as any[]).map((c) => ({ label: c.name, value: String(c.id) }))}
                                value={String(field.value || '')}
                                onChange={(val) => field.onChange(val ? parseInt(val) : 0)}
                                onBlur={field.onBlur}
                                placeholder={catsLoading ? 'Loading…' : 'Select a category'}
                            />
                        )}
                    />
                </FormField>
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
                    <Button variant='primary' type='submit' disabled={mutate.isPending}>
                        {mutate.isPending ? 'Saving…' : 'Submit'}
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}

