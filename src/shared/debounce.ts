export default function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    } as T;
}
