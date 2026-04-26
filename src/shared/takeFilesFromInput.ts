type FileInputLike = Pick<HTMLInputElement, 'files'>;
type ResettableFileInputLike = Pick<HTMLInputElement, 'value'>;

export function takeFilesFromInput(input: FileInputLike): File[] {
    return Array.from(input.files ?? []);
}

export function resetFileInputBeforeOpen(input: ResettableFileInputLike) {
    input.value = '';
}
