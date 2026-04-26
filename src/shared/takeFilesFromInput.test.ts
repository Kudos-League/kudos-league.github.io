import {
    resetFileInputBeforeOpen,
    takeFilesFromInput
} from './takeFilesFromInput';

function buildFileList(files: File[]): FileList {
    return {
        ...files,
        length: files.length,
        item: (index: number) => files[index] ?? null
    } as FileList;
}

describe('takeFilesFromInput', () => {
    it('copies selected files without clearing the native input label', () => {
        const file = new File(['image'], 'post-image.png', {
            type: 'image/png'
        });
        const selectedFiles = buildFileList([file]);
        const input = {
            files: selectedFiles,
            value: 'C:\\fakepath\\post-image.png'
        } as Pick<HTMLInputElement, 'files' | 'value'>;

        expect(takeFilesFromInput(input)).toEqual([file]);
        expect(input.value).toBe('C:\\fakepath\\post-image.png');
    });

    it('returns an empty array when no files are selected', () => {
        const input = {
            files: null,
            value: ''
        } as Pick<HTMLInputElement, 'files' | 'value'>;

        expect(takeFilesFromInput(input)).toEqual([]);
        expect(input.value).toBe('');
    });

    it('can clear the input before opening the picker again', () => {
        const input = {
            value: 'C:\\fakepath\\post-image.png'
        } as Pick<HTMLInputElement, 'value'>;

        resetFileInputBeforeOpen(input);

        expect(input.value).toBe('');
    });
});
