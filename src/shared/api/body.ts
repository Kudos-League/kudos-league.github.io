type BuildMode = 'json' | 'form' | 'auto';

function isFileish(v: unknown): v is File | Blob {
    return (
        (typeof File !== 'undefined' && v instanceof File) ||
        (typeof Blob !== 'undefined' && v instanceof Blob)
    );
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
        if (val === undefined) {
            console.log(`[FormData] Skipping undefined key: ${key}`);
            return;
        }
        if (val === null) {
            console.log(`[FormData] Appending null for key: ${key}`);
            fd.append(key, 'null');
            return;
        }
        if (isFileish(val)) {
            console.log(`[FormData] Appending File/Blob for key: ${key}`, val);
            fd.append(key, val as any);
        }
        else if (Array.isArray(val)) {
            const containsObjects = val.some(
                (v) =>
                    isPlainObject(v) ||
                    Array.isArray(v) ||
                    isFileish(v) ||
                    v === null
            );
            console.log(
                `[FormData] Array key: ${key}, length: ${val.length}, containsObjects: ${containsObjects}`,
                val
            );
            if (containsObjects) {
                val.forEach((v, i) => {
                    console.log(`[FormData] Recursing for ${key}[${i}]`);
                    append(`${key}[${i}]`, v);
                });
            }
            else {
                const jsonStr = JSON.stringify(val);
                console.log(
                    `[FormData] Appending JSON array for key: ${key}`,
                    jsonStr
                );
                fd.append(key, jsonStr);
            }
        }
        else if (isPlainObject(val)) {
            const jsonStr = JSON.stringify(val);
            console.log(
                `[FormData] Appending JSON object for key: ${key}`,
                jsonStr
            );
            fd.append(key, jsonStr);
        }
        else {
            const strVal = String(val);
            console.log(`[FormData] Appending string for key: ${key}`, strVal);
            fd.append(key, strVal);
        }
    };

    console.log(
        '[FormData] Starting toFormData conversion with keys:',
        Object.keys(obj)
    );
    Object.entries(obj).forEach(([k, v]) => append(k, v));

    console.log('[FormData] Final FormData entries:');
    fd.forEach((value, key) => {
        if (value instanceof File) {
            console.log(`  ${key}: [File: ${value.name}]`);
        }
        else {
            console.log(`  ${key}: ${value}`);
        }
    });

    return fd;
}

export function buildBody(
    body: any,
    mode: BuildMode
): { data: any; headers: Record<string, string> } {
    if (
        mode === 'form' ||
        (mode === 'auto' && (body instanceof FormData || hasFileDeep(body)))
    ) {
        const data = body instanceof FormData ? body : toFormData(body ?? {});
        return { data, headers: { 'Content-Type': 'multipart/form-data' } };
    }

    // default JSON
    return { data: body, headers: { 'Content-Type': 'application/json' } };
}
