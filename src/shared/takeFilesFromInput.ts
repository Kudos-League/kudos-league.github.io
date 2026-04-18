type FileInputLike = Pick<HTMLInputElement, 'files' | 'value'>;

export function takeFilesFromInput(input: FileInputLike): File[] {
    const selectedFiles = Array.from(input.files ?? []);
    input.value = '';
    return selectedFiles;
}
