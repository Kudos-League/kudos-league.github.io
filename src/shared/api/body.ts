type BuildMode = 'json' | 'form' | 'auto';

function isFileish(v: unknown): v is File | Blob {
    return typeof File !== 'undefined' && v instanceof File || typeof Blob !== 'undefined' && v instanceof Blob;
}
function isPlainObject(v: unknown) {
    return Object.prototype.toString.call(v) === '[object Object]';
}
function hasFileDeep(value: any): boolean {
    if (!value) return false;
    if (isFileish(value)) return true;
    if (Array.isArray(value)) return value.some(hasFileDeep);
    if (isPlainObject(value)) return Object.values(value).some(hasFileDeep);
    return false;
}

export function toFormData(obj: Record<string, any>): FormData {
    const fd = new FormData();

    const append = (key: string, val: any) => {
        if (val === undefined || val === null) return;
        if (isFileish(val)) {
            fd.append(key, val as any);
        }
        else if (Array.isArray(val)) {
            // append arrays with bracket syntax; for primitives we serialize JSON to keep BE happy
            const containsObjects = val.some(v => isPlainObject(v) || Array.isArray(v) || isFileish(v));
            if (containsObjects) {
                val.forEach((v, i) => append(`${key}[${i}]`, v));
            }
            else {
                fd.append(key, JSON.stringify(val));
            }
        }
        else if (isPlainObject(val)) {
            // serialize nested objects as JSON to avoid losing structure
            fd.append(key, JSON.stringify(val));
        }
        else {
            fd.append(key, String(val));
        }
    };

    Object.entries(obj).forEach(([k, v]) => append(k, v));
    return fd;
}

export function buildBody(
    body: any,
    mode: BuildMode
): { data: any; headers: Record<string, string> } {
    if (mode === 'form' || (mode === 'auto' && (body instanceof FormData || hasFileDeep(body)))) {
        const data = body instanceof FormData ? body : toFormData(body ?? {});
        return { data, headers: { 'Content-Type': 'multipart/form-data' } };
    }

    // default JSON
    return { data: body, headers: { 'Content-Type': 'application/json' } };
}