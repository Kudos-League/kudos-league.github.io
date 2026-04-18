import { takeFilesFromInput } from './takeFilesFromInput';

function buildFileList(files: File[]): FileList {
    return {
        ...files,
        length: files.length,
        item: (index: number) => files[index] ?? null
    } as FileList;
}

describe('takeFilesFromInput', () => {
    it('copies selected files before clearing the input value', () => {
        const file = new File(['image'], 'post-image.png', {
            type: 'image/png'
        });
        const selectedFiles = buildFileList([file]);
        const emptyFiles = buildFileList([]);
        let hasSelection = true;

        const input = {
            get files() {
                return hasSelection ? selectedFiles : emptyFiles;
            },
            get value() {
                return hasSelection ? 'C:\\fakepath\\post-image.png' : '';
            },
            set value(next: string) {
                hasSelection = next !== '';
            }
        } as Pick<HTMLInputElement, 'files' | 'value'>;

        expect(takeFilesFromInput(input)).toEqual([file]);
        expect(input.value).toBe('');
    });

    it('returns an empty array when no files are selected', () => {
        const input = {
            files: null,
            value: ''
        } as Pick<HTMLInputElement, 'files' | 'value'>;

        expect(takeFilesFromInput(input)).toEqual([]);
        expect(input.value).toBe('');
    });
});
